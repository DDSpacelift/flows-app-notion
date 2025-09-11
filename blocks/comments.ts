import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../notionClient";

export const createComment: AppBlock = {
  name: "Create Comment",
  description: "Creates a comment on a page or discussion thread",
  category: "Comments",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "ID of the page to comment on (or URL)",
          type: "string",
          required: true,
        },
        richText: {
          name: "Comment Text",
          description: "Comment content in rich text format (array)",
          type: {
            type: "array",
            items: {
              type: "object",
            },
          },
          required: true,
        },
        discussionId: {
          name: "Discussion ID",
          description: "Parent discussion thread ID (for replies)",
          type: "string",
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { pageId, richText, discussionId } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanPageId = parseNotionId(pageId);

        // Build request body
        const requestBody: any = {
          parent: {
            page_id: cleanPageId,
          },
          rich_text: richText,
        };

        if (discussionId) {
          requestBody.discussion_id = discussionId;
        }

        const response = await callNotionApi(
          "/comments",
          "POST",
          requestBody,
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        await events.emit({
          id: response.id,
          parentId: cleanPageId,
          discussionId: response.discussion_id,
          createdTime: response.created_time,
          lastEditedTime: response.last_edited_time,
          createdBy: response.created_by,
          richText: response.rich_text,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Comment Created",
      description: "Emitted when the comment has been successfully created",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the comment",
          },
          parentId: {
            type: "string",
            description: "ID of the page the comment is on",
          },
          discussionId: {
            type: "string",
            description:
              "Discussion thread ID if part of a thread (null if not part of a thread)",
          },
          createdTime: {
            type: "string",
            description: "ISO 8601 date and time when created",
          },
          lastEditedTime: {
            type: "string",
            description: "ISO 8601 date and time when last edited",
          },
          createdBy: {
            type: "object",
            description: "User who created the comment",
            properties: {
              object: { type: "string" },
              id: { type: "string" },
            },
          },
          richText: {
            type: "array",
            description: "The comment content as rich text",
          },
        },
        required: [
          "id",
          "parentId",
          "createdTime",
          "lastEditedTime",
          "createdBy",
          "richText",
        ],
      },
    },
  },
};

export const getComments: AppBlock = {
  name: "Get Comments",
  description: "Retrieves comments for a page or block",
  category: "Comments",

  inputs: {
    default: {
      config: {
        blockId: {
          name: "Block ID",
          description: "Block or page ID to get comments for (or URL)",
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
        const params = new URLSearchParams({
          block_id: cleanBlockId,
        });

        if (pageSize) {
          params.append("page_size", Math.min(pageSize, 100).toString());
        }

        if (startCursor) {
          params.append("start_cursor", startCursor);
        }

        const endpoint = `/comments?${params.toString()}`;

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
          commentCount: response.results.length,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Comments Retrieved",
      description: "Emitted when comments have been retrieved",
      default: true,
      type: {
        type: "object",
        properties: {
          results: {
            type: "array",
            description: "Array of comment objects",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Comment ID" },
                parent: { type: "object", description: "Parent page or block" },
                discussion_id: {
                  type: "string",
                  description: "Discussion thread ID (null if not in a thread)",
                },
                created_time: { type: "string", description: "Creation time" },
                last_edited_time: {
                  type: "string",
                  description: "Last edit time",
                },
                created_by: {
                  type: "object",
                  description: "User who created the comment",
                },
                rich_text: {
                  type: "array",
                  description: "Comment content as rich text",
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
          commentCount: {
            type: "number",
            description: "Number of comments retrieved",
          },
        },
        required: ["results", "hasMore", "commentCount"],
      },
    },
  },
};
