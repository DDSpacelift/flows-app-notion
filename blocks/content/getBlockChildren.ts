import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../../utils/notionClient";

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
        const { notionApiKey } = input.app.config;
        const { blockId, pageSize, startCursor } = input.event.inputConfig;

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
