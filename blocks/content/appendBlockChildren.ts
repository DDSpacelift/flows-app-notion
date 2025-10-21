import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../../utils/notionClient";

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
        const { notionApiKey } = input.app.config;
        const { parentId, children, after } = input.event.inputConfig;

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
