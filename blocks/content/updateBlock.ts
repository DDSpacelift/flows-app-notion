import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../../utils/notionClient";

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
        const { notionApiKey } = input.app.config;
        const { blockId, content, archived } = input.event.inputConfig;

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
