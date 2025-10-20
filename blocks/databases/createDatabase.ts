import { AppBlock, events } from "@slflows/sdk/v1";
import {
  callNotionApi,
  parseNotionId,
  formatRichText,
} from "../../utils/notionClient";

export const createDatabase: AppBlock = {
  name: "Create Database",
  description: "Creates a new database in a parent page",
  category: "Databases",

  inputs: {
    default: {
      config: {
        parentPageId: {
          name: "Parent Page ID",
          description: "ID of the parent page (or URL)",
          type: "string",
          required: true,
        },
        title: {
          name: "Database Title",
          description: "Title of the new database",
          type: "string",
          required: true,
        },
        properties: {
          name: "Properties Schema",
          description: "Database property definitions (JSON object)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: true,
        },
        isInline: {
          name: "Is Inline",
          description: "Create as inline database vs full-page",
          type: "boolean",
          required: false,
          default: false,
        },
        description: {
          name: "Description",
          description: "Database description",
          type: {
            type: "array",
            items: {
              type: "object",
            },
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey } = input.app.config;
        const { parentPageId, title, properties, isInline, description } =
          input.event.inputConfig;

        const cleanParentId = parseNotionId(parentPageId);

        // Build request body
        const requestBody: any = {
          parent: {
            type: "page_id",
            page_id: cleanParentId,
          },
          title: formatRichText(title),
          properties: properties,
          is_inline: isInline || false,
        };

        if (description) {
          requestBody.description = description;
        }

        const response = await callNotionApi(
          "/databases",
          "POST",
          requestBody,
          notionApiKey,
        );

        await events.emit({
          id: response.id,
          url: response.url,
          createdTime: response.created_time,
          lastEditedTime: response.last_edited_time,
          title: response.title,
          properties: response.properties,
          parent: response.parent,
          isInline: response.is_inline,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Database Created",
      description: "Emitted when the database has been successfully created",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the created database",
          },
          url: {
            type: "string",
            description: "The URL to access the database in Notion",
          },
          createdTime: {
            type: "string",
            description: "ISO 8601 date and time when created",
          },
          lastEditedTime: {
            type: "string",
            description: "ISO 8601 date and time when last edited",
          },
          title: {
            type: "array",
            description: "Database title as rich text array",
          },
          properties: {
            type: "object",
            description: "The property schema of the database",
          },
          parent: {
            type: "object",
            description: "Information about the parent page",
          },
          isInline: {
            type: "boolean",
            description: "Whether the database is inline",
          },
        },
        required: [
          "id",
          "url",
          "createdTime",
          "lastEditedTime",
          "title",
          "properties",
          "parent",
          "isInline",
        ],
      },
    },
  },
};
