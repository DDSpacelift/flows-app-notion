import { AppBlock, events } from "@slflows/sdk/v1";
import {
  callNotionApi,
  parseNotionId,
  parseEmoji,
} from "../../utils/notionClient";

export const updatePage: AppBlock = {
  name: "Update Page",
  description: "Updates an existing page's properties or metadata",
  category: "Pages",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "ID of the page to update (or URL)",
          type: "string",
          required: true,
        },
        properties: {
          name: "Properties",
          description: "Updated properties (JSON object)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: false,
        },
        archived: {
          name: "Archive Status",
          description: "Archive or unarchive the page",
          type: "boolean",
          required: false,
        },
        icon: {
          name: "Icon",
          description:
            "Updated page icon (emoji string or external URL object, or null to remove)",
          type: "string",
          required: false,
        },
        cover: {
          name: "Cover",
          description:
            "Updated page cover (external URL object or null to remove)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey } = input.app.config;
        const { pageId, properties, archived, icon, cover } =
          input.event.inputConfig;

        const cleanPageId = parseNotionId(pageId);

        // Build the update request body
        const requestBody: any = {};

        if (properties !== undefined) {
          requestBody.properties = properties;
        }

        if (archived !== undefined) {
          requestBody.archived = archived;
        }

        if (icon !== undefined) {
          if (icon === null) {
            requestBody.icon = null;
          } else if (typeof icon === "string") {
            requestBody.icon = {
              type: "emoji",
              emoji: parseEmoji(icon),
            };
          } else {
            requestBody.icon = icon;
          }
        }

        if (cover !== undefined) {
          requestBody.cover = cover;
        }

        const response = await callNotionApi(
          `/pages/${cleanPageId}`,
          "PATCH",
          requestBody,
          notionApiKey,
        );

        await events.emit({
          id: response.id,
          url: response.url,
          createdTime: response.created_time,
          lastEditedTime: response.last_edited_time,
          properties: response.properties,
          parent: response.parent,
          archived: response.archived,
          icon: response.icon,
          cover: response.cover,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Page Updated",
      description: "Emitted when the page has been successfully updated",
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
          properties: {
            type: "object",
            description: "The updated property values of the page",
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
