import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../../utils/notionClient";

export const getDatabaseSchema: AppBlock = {
  name: "Get Database Schema",
  description: "Retrieves a database's schema and properties",
  category: "Databases",

  inputs: {
    default: {
      config: {
        databaseId: {
          name: "Database ID",
          description: "ID of the database (or URL)",
          type: "string",
          required: true,
        },
      },
      async onEvent(input) {
        const { notionApiKey } = input.app.config;
        const { databaseId } = input.event.inputConfig;

        const cleanDatabaseId = parseNotionId(databaseId);

        const response = await callNotionApi(
          `/databases/${cleanDatabaseId}`,
          "GET",
          null,
          notionApiKey,
        );

        await events.emit({
          id: response.id,
          url: response.url,
          createdTime: response.created_time,
          lastEditedTime: response.last_edited_time,
          title: response.title,
          description: response.description,
          properties: response.properties,
          parent: response.parent,
          isInline: response.is_inline,
          archived: response.archived,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Database Schema Retrieved",
      description: "Emitted when the database schema has been retrieved",
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
          description: {
            type: "array",
            description: "Database description (null if not set)",
          },
          properties: {
            type: "object",
            description: "Complete property schema with all definitions",
          },
          parent: {
            type: "object",
            description: "Information about the parent page",
          },
          isInline: {
            type: "boolean",
            description: "Whether the database is inline",
          },
          archived: {
            type: "boolean",
            description: "Whether the database is archived",
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
          "archived",
        ],
      },
    },
  },
};
