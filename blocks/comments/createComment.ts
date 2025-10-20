import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId } from "../../utils/notionClient";

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
        const { notionApiKey } = input.app.config;
        const { pageId, richText, discussionId } = input.event.inputConfig;

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
