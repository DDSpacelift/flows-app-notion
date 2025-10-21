import { AppBlock, events } from "@slflows/sdk/v1";
import {
  callNotionApi,
  parseNotionId,
  formatRichText,
} from "../../utils/notionClient";

export const updateDatabase: AppBlock = {
  name: "Update Database",
  description: "Updates a database's properties or schema",
  category: "Databases",

  inputs: {
    default: {
      config: {
        databaseId: {
          name: "Database ID",
          description: "ID of the database to update (or URL)",
          type: "string",
          required: true,
        },
        title: {
          name: "Title",
          description: "New database title",
          type: "string",
          required: false,
        },
        properties: {
          name: "Properties Schema",
          description: "Updated property schema (JSON object)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: false,
        },
        description: {
          name: "Description",
          description: "Updated database description",
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
        const { databaseId, title, properties, description } =
          input.event.inputConfig;

        const cleanDatabaseId = parseNotionId(databaseId);

        // Build update request body
        const requestBody: any = {};

        if (title !== undefined) {
          requestBody.title = formatRichText(title);
        }

        if (properties !== undefined) {
          requestBody.properties = properties;
        }

        if (description !== undefined) {
          requestBody.description = description;
        }

        const response = await callNotionApi(
          `/databases/${cleanDatabaseId}`,
          "PATCH",
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
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Database Updated",
      description: "Emitted when the database has been successfully updated",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the database",
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
            description: "The updated property schema",
          },
          parent: {
            type: "object",
            description: "Information about the parent page",
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
        ],
      },
    },
  },
};
