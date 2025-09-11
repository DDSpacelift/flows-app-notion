import { AppBlock, events } from "@slflows/sdk/v1";
import { callNotionApi, parseNotionId, formatRichText } from "../notionClient";

export const queryDatabase: AppBlock = {
  name: "Query Database",
  description: "Queries a database with filters and sorting",
  category: "Databases",

  inputs: {
    default: {
      config: {
        databaseId: {
          name: "Database ID",
          description: "Database ID to query (or URL)",
          type: "string",
          required: true,
        },
        filter: {
          name: "Filter",
          description: "Filter conditions in Notion format (JSON object)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: false,
        },
        sorts: {
          name: "Sorts",
          description: "Sort criteria (array of sort objects)",
          type: {
            type: "array",
            items: {
              type: "object",
            },
          },
          required: false,
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
        const { databaseId, filter, sorts, pageSize, startCursor } =
          input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanDatabaseId = parseNotionId(databaseId);

        // Build query body
        const requestBody: any = {
          page_size: Math.min(pageSize || 100, 100),
        };

        if (filter) {
          requestBody.filter = filter;
        }

        if (sorts && Array.isArray(sorts)) {
          requestBody.sorts = sorts;
        }

        if (startCursor) {
          requestBody.start_cursor = startCursor;
        }

        const response = await callNotionApi(
          `/databases/${cleanDatabaseId}/query`,
          "POST",
          requestBody,
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        await events.emit({
          results: response.results,
          nextCursor: response.next_cursor,
          hasMore: response.has_more,
          resultsCount: response.results.length,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Query Results",
      description: "Emitted when the database query completes",
      default: true,
      type: {
        type: "object",
        properties: {
          results: {
            type: "array",
            description: "Array of page objects from the database",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                url: { type: "string" },
                created_time: { type: "string" },
                last_edited_time: { type: "string" },
                properties: { type: "object" },
                archived: { type: "boolean" },
              },
            },
          },
          nextCursor: {
            type: "string",
            description:
              "Cursor for the next page of results (null if no more pages)",
          },
          hasMore: {
            type: "boolean",
            description: "Whether there are more results to fetch",
          },
          resultsCount: {
            type: "number",
            description: "Number of results in this page",
          },
        },
        required: ["results", "hasMore", "resultsCount"],
      },
    },
  },
};

export const createDatabase: AppBlock = {
  name: "Create Database",
  description: "Creates a new database in a parent page",
  category: "Databases",

  inputs: {
    default: {
      config: {
        parentPageId: {
          name: "Parent Page ID",
          description: "ID of the parent page (or URL)",
          type: "string",
          required: true,
        },
        title: {
          name: "Database Title",
          description: "Title of the new database",
          type: "string",
          required: true,
        },
        properties: {
          name: "Properties Schema",
          description: "Database property definitions (JSON object)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: true,
        },
        isInline: {
          name: "Is Inline",
          description: "Create as inline database vs full-page",
          type: "boolean",
          required: false,
          default: false,
        },
        description: {
          name: "Description",
          description: "Database description",
          type: {
            type: "array",
            items: {
              type: "object",
            },
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { parentPageId, title, properties, isInline, description } =
          input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanParentId = parseNotionId(parentPageId);

        // Build request body
        const requestBody: any = {
          parent: {
            type: "page_id",
            page_id: cleanParentId,
          },
          title: formatRichText(title),
          properties: properties,
          is_inline: isInline || false,
        };

        if (description) {
          requestBody.description = description;
        }

        const response = await callNotionApi(
          "/databases",
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
          title: response.title,
          properties: response.properties,
          parent: response.parent,
          isInline: response.is_inline,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Database Created",
      description: "Emitted when the database has been successfully created",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the created database",
          },
          url: {
            type: "string",
            description: "The URL to access the database in Notion",
          },
          createdTime: {
            type: "string",
            description: "ISO 8601 date and time when created",
          },
          lastEditedTime: {
            type: "string",
            description: "ISO 8601 date and time when last edited",
          },
          title: {
            type: "array",
            description: "Database title as rich text array",
          },
          properties: {
            type: "object",
            description: "The property schema of the database",
          },
          parent: {
            type: "object",
            description: "Information about the parent page",
          },
          isInline: {
            type: "boolean",
            description: "Whether the database is inline",
          },
        },
        required: [
          "id",
          "url",
          "createdTime",
          "lastEditedTime",
          "title",
          "properties",
          "parent",
          "isInline",
        ],
      },
    },
  },
};

export const updateDatabase: AppBlock = {
  name: "Update Database",
  description: "Updates a database's properties or schema",
  category: "Databases",

  inputs: {
    default: {
      config: {
        databaseId: {
          name: "Database ID",
          description: "ID of the database to update (or URL)",
          type: "string",
          required: true,
        },
        title: {
          name: "Title",
          description: "New database title",
          type: "string",
          required: false,
        },
        properties: {
          name: "Properties Schema",
          description: "Updated property schema (JSON object)",
          type: {
            type: "object",
            properties: {},
            additionalProperties: true,
          },
          required: false,
        },
        description: {
          name: "Description",
          description: "Updated database description",
          type: {
            type: "array",
            items: {
              type: "object",
            },
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { databaseId, title, properties, description } =
          input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanDatabaseId = parseNotionId(databaseId);

        // Build update request body
        const requestBody: any = {};

        if (title !== undefined) {
          requestBody.title = formatRichText(title);
        }

        if (properties !== undefined) {
          requestBody.properties = properties;
        }

        if (description !== undefined) {
          requestBody.description = description;
        }

        const response = await callNotionApi(
          `/databases/${cleanDatabaseId}`,
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
          title: response.title,
          properties: response.properties,
          parent: response.parent,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Database Updated",
      description: "Emitted when the database has been successfully updated",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the database",
          },
          url: {
            type: "string",
            description: "The URL to access the database in Notion",
          },
          createdTime: {
            type: "string",
            description: "ISO 8601 date and time when created",
          },
          lastEditedTime: {
            type: "string",
            description: "ISO 8601 date and time when last edited",
          },
          title: {
            type: "array",
            description: "Database title as rich text array",
          },
          properties: {
            type: "object",
            description: "The updated property schema",
          },
          parent: {
            type: "object",
            description: "Information about the parent page",
          },
        },
        required: [
          "id",
          "url",
          "createdTime",
          "lastEditedTime",
          "title",
          "properties",
          "parent",
        ],
      },
    },
  },
};

export const getDatabaseSchema: AppBlock = {
  name: "Get Database Schema",
  description: "Retrieves a database's schema and properties",
  category: "Databases",

  inputs: {
    default: {
      config: {
        databaseId: {
          name: "Database ID",
          description: "ID of the database (or URL)",
          type: "string",
          required: true,
        },
      },
      async onEvent(input) {
        const { notionApiKey, retryAttempts, requestTimeout } =
          input.app.config;
        const { databaseId } = input.event.inputConfig;

        if (!notionApiKey) {
          throw new Error("Notion API key not configured");
        }

        const cleanDatabaseId = parseNotionId(databaseId);

        const response = await callNotionApi(
          `/databases/${cleanDatabaseId}`,
          "GET",
          null,
          notionApiKey,
          retryAttempts,
          requestTimeout,
        );

        await events.emit({
          id: response.id,
          url: response.url,
          createdTime: response.created_time,
          lastEditedTime: response.last_edited_time,
          title: response.title,
          description: response.description,
          properties: response.properties,
          parent: response.parent,
          isInline: response.is_inline,
          archived: response.archived,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Database Schema Retrieved",
      description: "Emitted when the database schema has been retrieved",
      default: true,
      type: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The unique identifier of the database",
          },
          url: {
            type: "string",
            description: "The URL to access the database in Notion",
          },
          createdTime: {
            type: "string",
            description: "ISO 8601 date and time when created",
          },
          lastEditedTime: {
            type: "string",
            description: "ISO 8601 date and time when last edited",
          },
          title: {
            type: "array",
            description: "Database title as rich text array",
          },
          description: {
            type: "array",
            description: "Database description (null if not set)",
          },
          properties: {
            type: "object",
            description: "Complete property schema with all definitions",
          },
          parent: {
            type: "object",
            description: "Information about the parent page",
          },
          isInline: {
            type: "boolean",
            description: "Whether the database is inline",
          },
          archived: {
            type: "boolean",
            description: "Whether the database is archived",
          },
        },
        required: [
          "id",
          "url",
          "createdTime",
          "lastEditedTime",
          "title",
          "properties",
          "parent",
          "isInline",
          "archived",
        ],
      },
    },
  },
};
