import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, formatRichText } from "../notionClient";

export const validateConnection: AppBlock = {
  name: "Validate Connection",
  description: "Validates the API connection and returns workspace info",
  category: "Utility",

  inputs: {
    default: {
      config: {},
      async onEvent(input) {
        const {
          notionApiKey,
          defaultWorkspaceName,
          retryAttempts,
          requestTimeout,
        } = input.app.config;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        try {
          // Get bot user info to validate connection
          const botResponse = await callNotionApi(
            "/users/me",
            "GET",
            null,
            notionApiKey,
            retryAttempts,
            requestTimeout,
          );

          // Search for at least one page to verify permissions
          const searchResponse = await callNotionApi(
            "/search",
            "POST",
            { page_size: 1 },
            notionApiKey,
            retryAttempts,
            requestTimeout,
          );

          await events.emit({
            connected: true,
            botUser: {
              id: botResponse.bot.id,
              name: botResponse.name || "Notion Integration",
              workspaceName:
                botResponse.bot.workspace_name ||
                defaultWorkspaceName ||
                "Unknown",
            },
            capabilities: {
              canAccess: searchResponse.results.length > 0,
              hasPages: searchResponse.results.some(
                (r: any) => r.object === "page",
              ),
              hasDatabases: searchResponse.results.some(
                (r: any) => r.object === "database",
              ),
            },
            workspaceName:
              defaultWorkspaceName ||
              botResponse.bot.workspace_name ||
              "Unknown",
            timestamp: new Date().toISOString(),
          });
        } catch (error: any) {
          await events.emit({
            connected: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Connection Validated",
      description: "Emitted when connection validation completes",
      default: true,
      type: {
        type: "object",
        properties: {
          connected: {
            type: "boolean",
            description: "Whether the connection is valid",
          },
          botUser: {
            type: "object",
            description: "Bot user information",
            properties: {
              id: { type: "string", description: "Bot user ID" },
              name: { type: "string", description: "Bot name" },
              workspaceName: { type: "string", description: "Workspace name" },
            },
          },
          capabilities: {
            type: "object",
            description: "Integration capabilities",
            properties: {
              canAccess: {
                type: "boolean",
                description: "Can access at least some content",
              },
              hasPages: { type: "boolean", description: "Has access to pages" },
              hasDatabases: {
                type: "boolean",
                description: "Has access to databases",
              },
            },
          },
          workspaceName: {
            type: "string",
            description: "Configured or detected workspace name",
          },
          error: {
            type: "string",
            description: "Error message if connection failed",
          },
          timestamp: { type: "string", description: "Validation timestamp" },
        },
        required: ["connected", "timestamp"],
      },
    },
  },
};

export const formatRichTextBlock: AppBlock = {
  name: "Format Rich Text",
  description: "Helper block to format plain text into Notion rich text format",
  category: "Utility",

  inputs: {
    default: {
      config: {
        text: {
          name: "Text",
          description: "Plain text to format",
          type: "string",
          required: true,
        },
        annotations: {
          name: "Annotations",
          description: "Text formatting options",
          type: {
            type: "object",
            properties: {
              bold: { type: "boolean", description: "Bold text" },
              italic: { type: "boolean", description: "Italic text" },
              strikethrough: {
                type: "boolean",
                description: "Strikethrough text",
              },
              underline: { type: "boolean", description: "Underlined text" },
              code: { type: "boolean", description: "Code formatting" },
              color: {
                type: "string",
                enum: [
                  "default",
                  "gray",
                  "brown",
                  "orange",
                  "yellow",
                  "green",
                  "blue",
                  "purple",
                  "pink",
                  "red",
                  "gray_background",
                  "brown_background",
                  "orange_background",
                  "yellow_background",
                  "green_background",
                  "blue_background",
                  "purple_background",
                  "pink_background",
                  "red_background",
                ],
                description: "Text color",
              },
            },
          },
          required: false,
        },
        link: {
          name: "Link URL",
          description: "URL to link the text to",
          type: "string",
          required: false,
        },
      },
      async onEvent(input) {
        const { text, annotations, link } = input.event.inputConfig;

        const richText = formatRichText(text, annotations, link);

        await events.emit({
          richText: richText,
          plainText: text,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Formatted Rich Text",
      description: "Emitted with the formatted rich text array",
      default: true,
      type: {
        type: "object",
        properties: {
          richText: {
            type: "array",
            description: "Notion-formatted rich text array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["text"] },
                text: {
                  type: "object",
                  properties: {
                    content: { type: "string" },
                    link: {
                      type: "object",
                      properties: {
                        url: { type: "string" },
                      },
                    },
                  },
                },
                annotations: {
                  type: "object",
                  properties: {
                    bold: { type: "boolean" },
                    italic: { type: "boolean" },
                    strikethrough: { type: "boolean" },
                    underline: { type: "boolean" },
                    code: { type: "boolean" },
                    color: { type: "string" },
                  },
                },
              },
            },
          },
          plainText: { type: "string", description: "Original plain text" },
        },
        required: ["richText", "plainText"],
      },
    },
  },
};

export const parseProperties: AppBlock = {
  name: "Parse Properties",
  description: "Converts simple key-value pairs to Notion property format",
  category: "Utility",

  inputs: {
    default: {
      config: {
        properties: {
          name: "Simple Properties",
          description: "Simple property object with key-value pairs",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: true,
        },
        schema: {
          name: "Database Schema",
          description: "Database schema for type information",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: true,
        },
      },
      async onEvent(input) {
        const { properties, schema } = input.event.inputConfig;

        const notionProperties: any = {};

        for (const [key, value] of Object.entries(properties)) {
          const propertySchema = schema[key];
          if (!propertySchema) {
            continue; // Skip properties not in schema
          }

          const propertyType = propertySchema.type;

          switch (propertyType) {
            case "title":
              notionProperties[key] = {
                title: formatRichText(String(value)),
              };
              break;

            case "rich_text":
              notionProperties[key] = {
                rich_text: formatRichText(String(value)),
              };
              break;

            case "number":
              notionProperties[key] = {
                number: Number(value),
              };
              break;

            case "select":
              notionProperties[key] = {
                select: {
                  name: String(value),
                },
              };
              break;

            case "multi_select":
              const items = Array.isArray(value) ? value : [value];
              notionProperties[key] = {
                multi_select: items.map((item) => ({
                  name: String(item),
                })),
              };
              break;

            case "date":
              notionProperties[key] = {
                date: {
                  start:
                    value instanceof Date ? value.toISOString() : String(value),
                },
              };
              break;

            case "checkbox":
              notionProperties[key] = {
                checkbox: Boolean(value),
              };
              break;

            case "url":
              notionProperties[key] = {
                url: String(value),
              };
              break;

            case "email":
              notionProperties[key] = {
                email: String(value),
              };
              break;

            case "phone_number":
              notionProperties[key] = {
                phone_number: String(value),
              };
              break;

            case "people":
              const peopleArray = Array.isArray(value) ? value : [value];
              notionProperties[key] = {
                people: peopleArray.map((userId) => ({
                  object: "user",
                  id: String(userId),
                })),
              };
              break;

            case "relation":
              const relationArray = Array.isArray(value) ? value : [value];
              notionProperties[key] = {
                relation: relationArray.map((pageId) => ({
                  id: String(pageId),
                })),
              };
              break;

            default:
              // For unsupported types, try to set as string
              if (propertyType === "formula" || propertyType === "rollup") {
                // These are read-only, skip
                continue;
              }
              notionProperties[key] = {
                [propertyType]: value,
              };
          }
        }

        await events.emit({
          notionProperties: notionProperties,
          originalProperties: properties,
          processedCount: Object.keys(notionProperties).length,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Properties Parsed",
      description: "Emitted with Notion-formatted properties",
      default: true,
      type: {
        type: "object",
        properties: {
          notionProperties: {
            type: "object",
            description: "Properties formatted for Notion API",
          },
          originalProperties: {
            type: "object",
            description: "Original simple properties",
          },
          processedCount: {
            type: "number",
            description: "Number of properties successfully processed",
          },
        },
        required: ["notionProperties", "originalProperties", "processedCount"],
      },
    },
  },
};
