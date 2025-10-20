import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi } from "../../utils/notionClient";

export const listDatabases: AppBlock = {
  name: "List Databases",
  description: "Lists all accessible databases in the workspace",
  category: "Search",

  inputs: {
    default: {
      config: {
        pageSize: {
          name: "Page Size",
          description: "Number of results per page (max 100)",
          type: "number",
          required: false,
          default: 100,
        },
        startCursor: {
          name: "Start Cursor",
          description: "Pagination cursor from previous list",
          type: "string",
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey } = input.app.config;
        const { pageSize, startCursor } = input.event.inputConfig;

        // Use search API with database filter
        const requestBody: any = {
          filter: {
            value: "database",
            property: "object",
          },
          page_size: Math.min(pageSize || 100, 100),
        };

        if (startCursor) {
          requestBody.start_cursor = startCursor;
        }

        const response = await callNotionApi(
          "/search",
          "POST",
          requestBody,
          notionApiKey,
        );

        // Transform results to include only relevant database fields
        const databases = response.results.map((db: any) => ({
          id: db.id,
          url: db.url,
          createdTime: db.created_time,
          lastEditedTime: db.last_edited_time,
          title: db.title,
          description: db.description,
          properties: db.properties,
          parent: db.parent,
          archived: db.archived,
        }));

        await events.emit({
          databases: databases,
          hasMore: response.has_more,
          nextCursor: response.next_cursor,
          databaseCount: databases.length,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Databases Listed",
      description: "Emitted when databases have been listed",
      default: true,
      type: {
        type: "object",
        properties: {
          databases: {
            type: "array",
            description: "List of databases with basic metadata",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Database ID" },
                url: { type: "string", description: "URL to access in Notion" },
                createdTime: { type: "string", description: "Creation time" },
                lastEditedTime: {
                  type: "string",
                  description: "Last edit time",
                },
                title: {
                  type: "array",
                  description: "Database title as rich text",
                },
                description: {
                  type: "array",
                  description: "Database description (null if not set)",
                },
                properties: { type: "object", description: "Property schema" },
                parent: { type: "object", description: "Parent information" },
                archived: { type: "boolean", description: "Whether archived" },
              },
            },
          },
          hasMore: {
            type: "boolean",
            description: "Whether there are more results",
          },
          nextCursor: {
            type: "string",
            description: "Cursor for the next page (null if no more pages)",
          },
          databaseCount: {
            type: "number",
            description: "Number of databases in this page",
          },
        },
        required: ["databases", "hasMore", "databaseCount"],
      },
    },
  },
};
