import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../../utils/notionClient";

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
        const { notionApiKey } = input.app.config;
        const { blockId } = input.event.inputConfig;

        const cleanBlockId = parseNotionId(blockId);

        await callNotionApi(
          `/blocks/${cleanBlockId}`,
          "DELETE",
          {},
          notionApiKey,
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
