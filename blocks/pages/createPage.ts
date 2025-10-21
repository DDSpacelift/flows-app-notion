import { AppBlock, events } from "@slflows/sdk/v1";
import {
  callNotionApi,
  parseNotionId,
  formatRichText,
  parseEmoji,
} from "../../utils/notionClient";

export const createPage: AppBlock = {
  name: "Create Page",
  description: "Creates a new page in a specified parent (page or database)",
  category: "Pages",

  inputs: {
    default: {
      config: {
        parentType: {
          name: "Parent Type",
          description: "Type of parent (page or database)",
          type: {
            type: "string",
            enum: ["page", "database"],
          },
          required: true,
        },
        parentId: {
          name: "Parent ID",
          description: "Parent page or database ID (or URL)",
          type: "string",
          required: true,
        },
        title: {
          name: "Page Title",
          description: "Title of the new page",
          type: "string",
          required: true,
        },
        properties: {
          name: "Properties",
          description:
            "Database properties if parent is a database (JSON object)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: false,
        },
        content: {
          name: "Content",
          description: "Initial page content as Notion blocks (array)",
          type: {
            type: "array",
            items: {
              type: "object",
            },
          },
          required: false,
        },
        icon: {
          name: "Icon",
          description: "Page icon (emoji string or external URL object)",
          type: "string",
          required: false,
        },
        cover: {
          name: "Cover",
          description: "Page cover image (external URL object)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: false,
        },
        templateType: {
          name: "Template Type",
          description: "Type of template to use",
          type: {
            type: "string",
            enum: ["none", "default", "template_id"],
          },
          required: false,
        },
        templateId: {
          name: "Template ID",
          description:
            "Template page ID (required if templateType is 'template_id')",
          type: "string",
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey } = input.app.config;
        const {
          parentType,
          parentId,
          title,
          properties,
          content,
          icon,
          cover,
          templateType,
          templateId,
        } = input.event.inputConfig;

        const cleanParentId = parseNotionId(parentId);

        // Build the request body
        const requestBody: any = {
          parent:
            parentType === "database"
              ? { database_id: cleanParentId }
              : { page_id: cleanParentId },
        };

        // Add properties
        if (parentType === "database" && properties) {
          requestBody.properties = properties;
        } else {
          // For pages, we need to set the title as a property
          requestBody.properties = {
            title: {
              title: formatRichText(title),
            },
          };
        }

        // Add icon if provided
        if (icon) {
          if (typeof icon === "string") {
            requestBody.icon = {
              type: "emoji",
              emoji: parseEmoji(icon),
            };
          } else {
            requestBody.icon = icon;
          }
        }

        // Add cover if provided
        if (cover) {
          requestBody.cover = cover;
        }

        // Add content blocks if provided (not allowed when using a template)
        if (content && Array.isArray(content) && !templateType) {
          requestBody.children = content;
        }

        // Add template configuration if provided
        if (templateType) {
          if (templateType === "default") {
            requestBody.template = { type: "default" };
          } else if (templateType === "template_id" && templateId) {
            const cleanTemplateId = parseNotionId(templateId);
            requestBody.template = {
              type: "template_id",
              template_id: cleanTemplateId,
            };
          }
        }

        const response = await callNotionApi(
          "/pages",
          "POST",
          requestBody,
          notionApiKey,
        );

        await events.emit({
          id: response.id,
          url: response.url,
          createdTime: response.created_time,
          lastEditedTime: response.last_edited_time,
          properties: response.properties,
          parent: response.parent,
          archived: response.archived,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Page Created",
      description: "Emitted when the page has been successfully created",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the created page",
          },
          url: {
            type: "string",
            description: "The URL to access the page in Notion",
          },
          createdTime: {
            type: "string",
            description: "ISO 8601 date and time when the page was created",
          },
          lastEditedTime: {
            type: "string",
            description: "ISO 8601 date and time when the page was last edited",
          },
          properties: {
            type: "object",
            description: "The property values of the page",
          },
          parent: {
            type: "object",
            description: "Information about the parent page or database",
          },
          archived: {
            type: "boolean",
            description: "Whether the page is archived",
          },
        },
        required: [
          "id",
          "url",
          "createdTime",
          "lastEditedTime",
          "properties",
          "parent",
          "archived",
        ],
      },
    },
  },
};
