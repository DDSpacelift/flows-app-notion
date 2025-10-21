import { AppBlock, events } from "@slflows/sdk/v1";
import { formatRichText } from "../../utils/notionClient";

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
