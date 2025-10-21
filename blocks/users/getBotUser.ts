import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi } from "../../utils/notionClient";

export const getBotUser: AppBlock = {
  name: "Get Bot User",
  description: "Gets information about the integration's bot user",
  category: "Users",

  inputs: {
    default: {
      config: {},
      async onEvent(input) {
        const { notionApiKey } = input.app.config;

        const response = await callNotionApi(
          "/users/me",
          "GET",
          null,
          notionApiKey,
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
