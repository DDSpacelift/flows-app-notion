import { AppBlock, events } from "@slflows/sdk/v1";
import {
  callNotionApi,
  parseNotionId,
  formatRichText,
  parseEmoji,
} from "../notionClient";

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
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const {
          parentType,
          parentId,
          title,
          properties,
          content,
          icon,
          cover,
        } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

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

        // Add content blocks if provided
        if (content && Array.isArray(content)) {
          requestBody.children = content;
        }

        const response = await callNotionApi(
          "/pages",
          "POST",
          requestBody,
          notionApiKey,
          retryAttempts,
          requestTimeout,
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

export const getPage: AppBlock = {
  name: "Get Page",
  description: "Retrieves a page's metadata and properties",
  category: "Pages",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "ID of the page to retrieve (or URL)",
          type: "string",
          required: true,
        },
        includeChildren: {
          name: "Include Children",
          description: "Include child blocks in the response",
          type: "boolean",
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { pageId, includeChildren } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanPageId = parseNotionId(pageId);

        // Get page metadata
        const page = await callNotionApi(
          `/pages/${cleanPageId}`,
          "GET",
          null,
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        let children = null;
        if (includeChildren) {
          // Get page content blocks
          const blocksResponse = await callNotionApi(
            `/blocks/${cleanPageId}/children`,
            "GET",
            null,
            notionApiKey,
            retryAttempts,
            requestTimeout,
          );
          children = blocksResponse.results;
        }

        await events.emit({
          id: page.id,
          url: page.url,
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time,
          createdBy: page.created_by,
          lastEditedBy: page.last_edited_by,
          properties: page.properties,
          parent: page.parent,
          archived: page.archived,
          icon: page.icon,
          cover: page.cover,
          children: children,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Page Retrieved",
      description: "Emitted when the page has been successfully retrieved",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the page",
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
          createdBy: {
            type: "object",
            description: "User who created the page",
          },
          lastEditedBy: {
            type: "object",
            description: "User who last edited the page",
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
          icon: {
            type: "object",
            description: "Page icon if set (null if not set)",
          },
          cover: {
            type: "object",
            description: "Page cover if set (null if not set)",
          },
          children: {
            type: "array",
            description: "Child blocks if requested (null if not requested)",
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

export const updatePage: AppBlock = {
  name: "Update Page",
  description: "Updates an existing page's properties or metadata",
  category: "Pages",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "ID of the page to update (or URL)",
          type: "string",
          required: true,
        },
        properties: {
          name: "Properties",
          description: "Updated properties (JSON object)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: false,
        },
        archived: {
          name: "Archive Status",
          description: "Archive or unarchive the page",
          type: "boolean",
          required: false,
        },
        icon: {
          name: "Icon",
          description:
            "Updated page icon (emoji string or external URL object, or null to remove)",
          type: "string",
          required: false,
        },
        cover: {
          name: "Cover",
          description:
            "Updated page cover (external URL object or null to remove)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { pageId, properties, archived, icon, cover } =
          input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanPageId = parseNotionId(pageId);

        // Build the update request body
        const requestBody: any = {};

        if (properties !== undefined) {
          requestBody.properties = properties;
        }

        if (archived !== undefined) {
          requestBody.archived = archived;
        }

        if (icon !== undefined) {
          if (icon === null) {
            requestBody.icon = null;
          } else if (typeof icon === "string") {
            requestBody.icon = {
              type: "emoji",
              emoji: parseEmoji(icon),
            };
          } else {
            requestBody.icon = icon;
          }
        }

        if (cover !== undefined) {
          requestBody.cover = cover;
        }

        const response = await callNotionApi(
          `/pages/${cleanPageId}`,
          "PATCH",
          requestBody,
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        await events.emit({
          id: response.id,
          url: response.url,
          createdTime: response.created_time,
          lastEditedTime: response.last_edited_time,
          properties: response.properties,
          parent: response.parent,
          archived: response.archived,
          icon: response.icon,
          cover: response.cover,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Page Updated",
      description: "Emitted when the page has been successfully updated",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the page",
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
            description: "The updated property values of the page",
          },
          parent: {
            type: "object",
            description: "Information about the parent page or database",
          },
          archived: {
            type: "boolean",
            description: "Whether the page is archived",
          },
          icon: {
            type: "object",
            description: "Page icon if set (null if not set)",
          },
          cover: {
            type: "object",
            description: "Page cover if set (null if not set)",
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

export const deletePage: AppBlock = {
  name: "Delete Page",
  description: "Archives (soft deletes) a page",
  category: "Pages",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "ID of the page to delete (or URL)",
          type: "string",
          required: true,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { pageId } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanPageId = parseNotionId(pageId);

        // Archive the page (Notion doesn't have hard delete via API)
        const response = await callNotionApi(
          `/pages/${cleanPageId}`,
          "PATCH",
          { archived: true },
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        await events.emit({
          id: response.id,
          archived: true,
          archivedTime: response.last_edited_time,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Page Deleted",
      description: "Emitted when the page has been successfully archived",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the archived page",
          },
          archived: {
            type: "boolean",
            description: "Confirmation that the page is archived",
          },
          archivedTime: {
            type: "string",
            description: "ISO 8601 date and time when the page was archived",
          },
        },
        required: ["id", "archived", "archivedTime"],
      },
    },
  },
};
