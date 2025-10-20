import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../../utils/notionClient";

export const deletePage: AppBlock = {
  name: "Delete Page",
  description: "Archives (soft deletes) a page",
  category: "Pages",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "ID of the page to delete (or URL)",
          type: "string",
          required: true,
        },
      },
      async onEvent(input) {
        const { notionApiKey } = input.app.config;
        const { pageId } = input.event.inputConfig;

        const cleanPageId = parseNotionId(pageId);

        // Archive the page (Notion doesn't have hard delete via API)
        const response = await callNotionApi(
          `/pages/${cleanPageId}`,
          "PATCH",
          { archived: true },
          notionApiKey,
        );

        await events.emit({
          id: response.id,
          archived: true,
          archivedTime: response.last_edited_time,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Page Deleted",
      description: "Emitted when the page has been successfully archived",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the archived page",
          },
          archived: {
            type: "boolean",
            description: "Confirmation that the page is archived",
          },
          archivedTime: {
            type: "string",
            description: "ISO 8601 date and time when the page was archived",
          },
        },
        required: ["id", "archived", "archivedTime"],
      },
    },
  },
};
