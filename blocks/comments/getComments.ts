import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../../utils/notionClient";

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
        const { notionApiKey } = input.app.config;
        const { blockId, pageSize, startCursor } = input.event.inputConfig;

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
