import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi } from "../../utils/notionClient";

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
        const { notionApiKey } = input.app.config;
        const { userId } = input.event.inputConfig;

        const response = await callNotionApi(
          `/users/${userId}`,
          "GET",
          null,
          notionApiKey,
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
