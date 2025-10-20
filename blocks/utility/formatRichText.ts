import { AppBlock, events } from "@slflows/sdk/v1";
import { formatRichText } from "../../utils/notionClient";

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
