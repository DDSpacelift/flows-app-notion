import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi } from "../notionClient";

export const getUser: AppBlock = {
  name: "Get User",
  description: "Retrieves information about a Notion user",
  category: "Users",

  inputs: {
    default: {
      config: {
        userId: {
          name: "User ID",
          description: "User ID to retrieve",
          type: "string",
          required: true,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { userId } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const response = await callNotionApi(
          `/users/${userId}`,
          "GET",
          null,
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        await events.emit({
          id: response.id,
          object: response.object,
          type: response.type,
          name: response.name,
          avatarUrl: response.avatar_url,
          person: response.person,
          bot: response.bot,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "User Retrieved",
      description: "Emitted when user information has been retrieved",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the user",
          },
          object: {
            type: "string",
            enum: ["user"],
            description: "Always 'user'",
          },
          type: {
            type: "string",
            enum: ["person", "bot"],
            description: "Type of user",
          },
          name: {
            type: "string",
            description: "User's name (null if not set)",
          },
          avatarUrl: {
            type: "string",
            description: "URL of user's avatar (null if not set)",
          },
          person: {
            type: "object",
            description:
              "Person details if type is 'person' (null if type is 'bot')",
            properties: {
              email: { type: "string", description: "Email address" },
            },
          },
          bot: {
            type: "object",
            description:
              "Bot details if type is 'bot' (null if type is 'person')",
            properties: {
              owner: {
                type: "object",
                description: "Bot owner information",
                properties: {
                  type: { type: "string", enum: ["workspace", "user"] },
                  workspace: { type: "string" },
                  user: { type: "object" },
                },
              },
              workspace_name: {
                type: "string",
                description: "Workspace name (null if not set)",
              },
            },
          },
        },
        required: ["id", "object", "type"],
      },
    },
  },
};

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
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { pageSize, startCursor } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

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
          retryAttempts,
          requestTimeout,
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

export const getBotUser: AppBlock = {
  name: "Get Bot User",
  description: "Gets information about the integration's bot user",
  category: "Users",

  inputs: {
    default: {
      config: {},
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const response = await callNotionApi(
          "/users/me",
          "GET",
          null,
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        await events.emit({
          id: response.bot.id,
          object: response.object,
          type: response.type,
          name: response.name || "Notion Integration",
          bot: {
            owner: response.bot.owner,
            workspaceName: response.bot.workspace_name,
          },
          capabilities: {
            canRead: true,
            canUpdate: true,
            canCreate: true,
            canDelete: true,
          },
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Bot User Retrieved",
      description: "Emitted when bot user information has been retrieved",
      default: true,
      type: {
        type: "object",
        properties: {
          id: { type: "string", description: "The bot user's ID" },
          object: {
            type: "string",
            enum: ["user"],
            description: "Always 'user'",
          },
          type: {
            type: "string",
            enum: ["bot"],
            description: "Always 'bot' for integrations",
          },
          name: { type: "string", description: "Bot name" },
          bot: {
            type: "object",
            description: "Bot-specific information",
            properties: {
              owner: {
                type: "object",
                description: "Bot owner details",
                properties: {
                  type: { type: "string", enum: ["workspace"] },
                  workspace: { type: "boolean" },
                },
              },
              workspaceName: {
                type: "string",
                description: "Workspace name (null if not set)",
              },
            },
          },
          capabilities: {
            type: "object",
            description: "Bot capabilities",
            properties: {
              canRead: { type: "boolean", description: "Can read content" },
              canUpdate: { type: "boolean", description: "Can update content" },
              canCreate: { type: "boolean", description: "Can create content" },
              canDelete: { type: "boolean", description: "Can delete content" },
            },
          },
        },
        required: ["id", "object", "type", "name", "bot", "capabilities"],
      },
    },
  },
};
