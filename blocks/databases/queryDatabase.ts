import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../../utils/notionClient";

export const queryDatabase: AppBlock = {
  name: "Query Database",
  description: "Queries a database with filters and sorting",
  category: "Databases",

  inputs: {
    default: {
      config: {
        databaseId: {
          name: "Database ID",
          description: "Database ID to query (or URL)",
          type: "string",
          required: true,
        },
        filter: {
          name: "Filter",
          description: "Filter conditions in Notion format (JSON object)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: false,
        },
        sorts: {
          name: "Sorts",
          description: "Sort criteria (array of sort objects)",
          type: {
            type: "array",
            items: {
              type: "object",
            },
          },
          required: false,
        },
        pageSize: {
          name: "Page Size",
          description: "Number of results per page (max 100)",
          type: "number",
          required: false,
          default: 100,
        },
        startCursor: {
          name: "Start Cursor",
          description: "Pagination cursor from previous query",
          type: "string",
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey } = input.app.config;
        const { databaseId, filter, sorts, pageSize, startCursor } =
          input.event.inputConfig;

        const cleanDatabaseId = parseNotionId(databaseId);

        // Build query body
        const requestBody: any = {
          page_size: Math.min(pageSize || 100, 100),
        };

        if (filter) {
          requestBody.filter = filter;
        }

        if (sorts && Array.isArray(sorts)) {
          requestBody.sorts = sorts;
        }

        if (startCursor) {
          requestBody.start_cursor = startCursor;
        }

        const response = await callNotionApi(
          `/databases/${cleanDatabaseId}/query`,
          "POST",
          requestBody,
          notionApiKey,
        );

        await events.emit({
          results: response.results,
          nextCursor: response.next_cursor,
          hasMore: response.has_more,
          resultsCount: response.results.length,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Query Results",
      description: "Emitted when the database query completes",
      default: true,
      type: {
        type: "object",
        properties: {
          results: {
            type: "array",
            description: "Array of page objects from the database",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                url: { type: "string" },
                created_time: { type: "string" },
                last_edited_time: { type: "string" },
                properties: { type: "object" },
                archived: { type: "boolean" },
              },
            },
          },
          nextCursor: {
            type: "string",
            description:
              "Cursor for the next page of results (null if no more pages)",
          },
          hasMore: {
            type: "boolean",
            description: "Whether there are more results to fetch",
          },
          resultsCount: {
            type: "number",
            description: "Number of results in this page",
          },
        },
        required: ["results", "hasMore", "resultsCount"],
      },
    },
  },
};
