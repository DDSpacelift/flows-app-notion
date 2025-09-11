import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../notionClient";

export const appendBlockChildren: AppBlock = {
  name: "Append Block Children",
  description: "Appends blocks to a page or existing block",
  category: "Content",

  inputs: {
    default: {
      config: {
        parentId: {
          name: "Parent ID",
          description: "Parent block or page ID (or URL)",
          type: "string",
          required: true,
        },
        children: {
          name: "Children Blocks",
          description: "Array of block objects to append",
          type: {
            type: "array",
            items: {
              type: "object",
            },
          },
          required: true,
        },
        after: {
          name: "After Block ID",
          description: "ID of sibling block to insert after",
          type: "string",
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { parentId, children, after } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanParentId = parseNotionId(parentId);

        // Build request body
        const requestBody: any = {
          children: children,
        };

        if (after) {
          requestBody.after = parseNotionId(after);
        }

        const response = await callNotionApi(
          `/blocks/${cleanParentId}/children`,
          "PATCH",
          requestBody,
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        await events.emit({
          results: response.results,
          hasMore: response.has_more,
          nextCursor: response.next_cursor,
          blockCount: response.results.length,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Blocks Appended",
      description: "Emitted when blocks have been successfully appended",
      default: true,
      type: {
        type: "object",
        properties: {
          results: {
            type: "array",
            description: "Array of created block objects with their IDs",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Block ID" },
                type: { type: "string", description: "Block type" },
                created_time: { type: "string", description: "Creation time" },
                last_edited_time: {
                  type: "string",
                  description: "Last edit time",
                },
                has_children: {
                  type: "boolean",
                  description: "Whether block has children",
                },
              },
            },
          },
          hasMore: {
            type: "boolean",
            description: "Whether there are more blocks",
          },
          nextCursor: {
            type: "string",
            description:
              "Pagination cursor if applicable (null if not paginated)",
          },
          blockCount: {
            type: "number",
            description: "Number of blocks created",
          },
        },
        required: ["results", "hasMore", "blockCount"],
      },
    },
  },
};

export const updateBlock: AppBlock = {
  name: "Update Block",
  description: "Updates an existing block's content",
  category: "Content",

  inputs: {
    default: {
      config: {
        blockId: {
          name: "Block ID",
          description: "ID of the block to update",
          type: "string",
          required: true,
        },
        content: {
          name: "Block Content",
          description: "Updated block content (varies by block type)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: true,
        },
        archived: {
          name: "Archive Block",
          description: "Archive the block",
          type: "boolean",
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { blockId, content, archived } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanBlockId = parseNotionId(blockId);

        // Build update request
        const requestBody: any = content;

        if (archived !== undefined) {
          requestBody.archived = archived;
        }

        const response = await callNotionApi(
          `/blocks/${cleanBlockId}`,
          "PATCH",
          requestBody,
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        await events.emit({
          id: response.id,
          type: response.type,
          createdTime: response.created_time,
          lastEditedTime: response.last_edited_time,
          hasChildren: response.has_children,
          archived: response.archived,
          content: response[response.type],
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Block Updated",
      description: "Emitted when the block has been successfully updated",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the block",
          },
          type: { type: "string", description: "The type of block" },
          createdTime: {
            type: "string",
            description: "ISO 8601 date and time when created",
          },
          lastEditedTime: {
            type: "string",
            description: "ISO 8601 date and time when last edited",
          },
          hasChildren: {
            type: "boolean",
            description: "Whether the block has children",
          },
          archived: {
            type: "boolean",
            description: "Whether the block is archived",
          },
          content: { type: "object", description: "The updated block content" },
        },
        required: [
          "id",
          "type",
          "createdTime",
          "lastEditedTime",
          "hasChildren",
          "archived",
        ],
      },
    },
  },
};

export const deleteBlock: AppBlock = {
  name: "Delete Block",
  description: "Deletes a block and its children",
  category: "Content",

  inputs: {
    default: {
      config: {
        blockId: {
          name: "Block ID",
          description: "ID of the block to delete",
          type: "string",
          required: true,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { blockId } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanBlockId = parseNotionId(blockId);

        await callNotionApi(
          `/blocks/${cleanBlockId}`,
          "DELETE",
          {},
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        await events.emit({
          id: cleanBlockId,
          deleted: true,
          deletedTime: new Date().toISOString(),
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Block Deleted",
      description: "Emitted when the block has been successfully deleted",
      default: true,
      type: {
        type: "object",
        properties: {
          id: { type: "string", description: "The ID of the deleted block" },
          deleted: {
            type: "boolean",
            description: "Confirmation that the block was deleted",
          },
          deletedTime: {
            type: "string",
            description: "ISO 8601 date and time when deleted",
          },
        },
        required: ["id", "deleted", "deletedTime"],
      },
    },
  },
};

export const getBlockChildren: AppBlock = {
  name: "Get Block Children",
  description: "Retrieves children of a block or page",
  category: "Content",

  inputs: {
    default: {
      config: {
        blockId: {
          name: "Block ID",
          description: "Parent block or page ID (or URL)",
          type: "string",
          required: true,
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
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { blockId, pageSize, startCursor } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanBlockId = parseNotionId(blockId);

        // Build query parameters
        const params = new URLSearchParams();
        if (pageSize) {
          params.append("page_size", Math.min(pageSize, 100).toString());
        }
        if (startCursor) {
          params.append("start_cursor", startCursor);
        }

        const queryString = params.toString();
        const endpoint = `/blocks/${cleanBlockId}/children${queryString ? `?${queryString}` : ""}`;

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
          blockCount: response.results.length,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Children Retrieved",
      description: "Emitted when child blocks have been retrieved",
      default: true,
      type: {
        type: "object",
        properties: {
          results: {
            type: "array",
            description: "Array of child block objects",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Block ID" },
                type: { type: "string", description: "Block type" },
                created_time: { type: "string", description: "Creation time" },
                last_edited_time: {
                  type: "string",
                  description: "Last edit time",
                },
                has_children: {
                  type: "boolean",
                  description: "Whether block has children",
                },
                archived: {
                  type: "boolean",
                  description: "Whether block is archived",
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
          blockCount: {
            type: "number",
            description: "Number of blocks retrieved",
          },
        },
        required: ["results", "hasMore", "blockCount"],
      },
    },
  },
};
