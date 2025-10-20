import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi } from "../../utils/notionClient";

export const listUsers: AppBlock = {
  name: "List Users",
  description: "Lists all users in the workspace",
  category: "Users",

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
          description: "Pagination cursor from previous query",
          type: "string",
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey } = input.app.config;
        const { pageSize, startCursor } = input.event.inputConfig;

        // Build query parameters
        const params = new URLSearchParams();
        if (pageSize) {
          params.append("page_size", Math.min(pageSize, 100).toString());
        }
        if (startCursor) {
          params.append("start_cursor", startCursor);
        }

        const queryString = params.toString();
        const endpoint = `/users${queryString ? `?${queryString}` : ""}`;

        const response = await callNotionApi(
          endpoint,
          "GET",
          null,
          notionApiKey,
        );

        await events.emit({
          results: response.results,
          hasMore: response.has_more,
          nextCursor: response.next_cursor,
          userCount: response.results.length,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Users Listed",
      description: "Emitted when users have been listed",
      default: true,
      type: {
        type: "object",
        properties: {
          results: {
            type: "array",
            description: "Array of user objects",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "User ID" },
                object: { type: "string", enum: ["user"] },
                type: { type: "string", enum: ["person", "bot"] },
                name: {
                  type: "string",
                  description: "User's name (null if not set)",
                },
                avatar_url: {
                  type: "string",
                  description: "Avatar URL (null if not set)",
                },
                person: {
                  type: "object",
                  properties: {
                    email: { type: "string" },
                  },
                },
                bot: {
                  type: "object",
                  properties: {
                    owner: { type: "object" },
                    workspace_name: { type: "string" },
                  },
                },
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
          userCount: {
            type: "number",
            description: "Number of users retrieved",
          },
        },
        required: ["results", "hasMore", "userCount"],
      },
    },
  },
};
