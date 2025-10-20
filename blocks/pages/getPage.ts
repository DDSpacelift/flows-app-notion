import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../../utils/notionClient";

export const getPage: AppBlock = {
  name: "Get Page",
  description: "Retrieves a page's metadata and properties",
  category: "Pages",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "ID of the page to retrieve (or URL)",
          type: "string",
          required: true,
        },
        includeChildren: {
          name: "Include Children",
          description: "Include child blocks in the response",
          type: "boolean",
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey } = input.app.config;
        const { pageId, includeChildren } = input.event.inputConfig;

        const cleanPageId = parseNotionId(pageId);

        // Get page metadata
        const page = await callNotionApi(
          `/pages/${cleanPageId}`,
          "GET",
          null,
          notionApiKey,
        );

        let children = null;
        if (includeChildren) {
          // Get page content blocks
          const blocksResponse = await callNotionApi(
            `/blocks/${cleanPageId}/children`,
            "GET",
            null,
            notionApiKey,
          );
          children = blocksResponse.results;
        }

        await events.emit({
          id: page.id,
          url: page.url,
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time,
          createdBy: page.created_by,
          lastEditedBy: page.last_edited_by,
          properties: page.properties,
          parent: page.parent,
          archived: page.archived,
          icon: page.icon,
          cover: page.cover,
          children: children,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Page Retrieved",
      description: "Emitted when the page has been successfully retrieved",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the page",
          },
          url: {
            type: "string",
            description: "The URL to access the page in Notion",
          },
          createdTime: {
            type: "string",
            description: "ISO 8601 date and time when the page was created",
          },
          lastEditedTime: {
            type: "string",
            description: "ISO 8601 date and time when the page was last edited",
          },
          createdBy: {
            type: "object",
            description: "User who created the page",
          },
          lastEditedBy: {
            type: "object",
            description: "User who last edited the page",
          },
          properties: {
            type: "object",
            description: "The property values of the page",
          },
          parent: {
            type: "object",
            description: "Information about the parent page or database",
          },
          archived: {
            type: "boolean",
            description: "Whether the page is archived",
          },
          icon: {
            type: "object",
            description: "Page icon if set (null if not set)",
          },
          cover: {
            type: "object",
            description: "Page cover if set (null if not set)",
          },
          children: {
            type: "array",
            description: "Child blocks if requested (null if not requested)",
          },
        },
        required: [
          "id",
          "url",
          "createdTime",
          "lastEditedTime",
          "properties",
          "parent",
          "archived",
        ],
      },
    },
  },
};
