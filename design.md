# Notion App for Flows - Design Document

## Overview

The Notion app for Flows enables seamless integration with Notion workspaces, allowing users to create, update, query, and manage pages, databases, and content within their Notion workspace through automated workflows.

## 1. App Configuration Parameters

### Required Configuration

#### `notionApiKey`
- **Type**: string
- **Sensitive**: true
- **Required**: true
- **Description**: Notion Integration Token (Internal Integration Token)
- **Details**: Users need to create an internal integration at https://www.notion.so/my-integrations and copy the secret token. The integration must be shared with the pages/databases that the app will access.

### Optional Configuration

#### `defaultWorkspaceName`
- **Type**: string
- **Required**: false
- **Description**: Default workspace name for reference and logging
- **Details**: Helps identify which workspace is connected, useful when managing multiple Notion integrations

#### `retryAttempts`
- **Type**: number
- **Required**: false
- **Default**: 3
- **Description**: Number of retry attempts for failed API calls
- **Details**: Notion API can have rate limits and occasional timeouts; this configures automatic retry behavior

#### `requestTimeout`
- **Type**: number
- **Required**: false
- **Default**: 30000
- **Description**: Request timeout in milliseconds
- **Details**: Maximum time to wait for Notion API responses before timing out

## 2. Blocks Design

### Page Management

#### `createPage`
- **Description**: Creates a new page in a specified parent (page or database)
- **Category**: Pages
- **Input Config Fields**:
  - `parentType` (string, required): "page" or "database"
  - `parentId` (string, required): Parent page or database ID
  - `title` (string, required): Page title
  - `properties` (object, optional): Database properties if parent is a database
  - `content` (array, optional): Initial page content as Notion blocks
  - `icon` (object, optional): Page icon (emoji or external URL)
  - `cover` (object, optional): Page cover image
- **Output**: Created page object with ID, URL, and properties

#### `updatePage`
- **Description**: Updates an existing page's properties or metadata
- **Category**: Pages
- **Input Config Fields**:
  - `pageId` (string, required): ID of the page to update
  - `title` (string, optional): New page title
  - `properties` (object, optional): Updated properties
  - `archived` (boolean, optional): Archive/unarchive the page
  - `icon` (object, optional): Updated icon
  - `cover` (object, optional): Updated cover
- **Output**: Updated page object

#### `getPage`
- **Description**: Retrieves a page's metadata and properties
- **Category**: Pages
- **Input Config Fields**:
  - `pageId` (string, required): ID of the page to retrieve
  - `includeChildren` (boolean, optional): Include child blocks
- **Output**: Page object with properties and optionally children

#### `deletePage`
- **Description**: Archives (soft deletes) a page
- **Category**: Pages
- **Input Config Fields**:
  - `pageId` (string, required): ID of the page to delete
- **Output**: Confirmation with archived page ID

### Database Operations

#### `queryDatabase`
- **Description**: Queries a database with filters and sorting
- **Category**: Databases
- **Input Config Fields**:
  - `databaseId` (string, required): Database ID to query
  - `filter` (object, optional): Filter conditions in Notion format
  - `sorts` (array, optional): Sort criteria
  - `pageSize` (number, optional, default: 100): Results per page
  - `startCursor` (string, optional): Pagination cursor
- **Output**: Query results with pages and pagination info

#### `createDatabase`
- **Description**: Creates a new database in a parent page
- **Category**: Databases
- **Input Config Fields**:
  - `parentPageId` (string, required): Parent page ID
  - `title` (string, required): Database title
  - `properties` (object, required): Database schema properties
  - `isInline` (boolean, optional): Create as inline vs full-page
- **Output**: Created database object with ID and URL

#### `updateDatabase`
- **Description**: Updates a database's properties or schema
- **Category**: Databases
- **Input Config Fields**:
  - `databaseId` (string, required): Database ID to update
  - `title` (string, optional): New title
  - `properties` (object, optional): Updated property schema
  - `description` (string, optional): Database description
- **Output**: Updated database object

#### `getDatabaseSchema`
- **Description**: Retrieves a database's schema and properties
- **Category**: Databases
- **Input Config Fields**:
  - `databaseId` (string, required): Database ID
- **Output**: Database schema with all property definitions

### Content Management

#### `appendBlockChildren`
- **Description**: Appends blocks to a page or existing block
- **Category**: Content
- **Input Config Fields**:
  - `parentId` (string, required): Parent block or page ID
  - `children` (array, required): Array of block objects to append
  - `after` (string, optional): ID of sibling block to insert after
- **Output**: Created blocks with IDs

#### `updateBlock`
- **Description**: Updates an existing block's content
- **Category**: Content
- **Input Config Fields**:
  - `blockId` (string, required): Block ID to update
  - `content` (object, required): Updated block content
  - `archived` (boolean, optional): Archive the block
- **Output**: Updated block object

#### `deleteBlock`
- **Description**: Deletes a block and its children
- **Category**: Content
- **Input Config Fields**:
  - `blockId` (string, required): Block ID to delete
- **Output**: Confirmation with deleted block ID

#### `getBlockChildren`
- **Description**: Retrieves children of a block or page
- **Category**: Content
- **Input Config Fields**:
  - `blockId` (string, required): Parent block or page ID
  - `pageSize` (number, optional): Results per page
  - `startCursor` (string, optional): Pagination cursor
- **Output**: Array of child blocks with pagination

### Search and Discovery

#### `search`
- **Description**: Searches for pages and databases across the workspace
- **Category**: Search
- **Input Config Fields**:
  - `query` (string, optional): Search query text
  - `filter` (object, optional): Filter by object type ("page" or "database")
  - `sort` (object, optional): Sort criteria
  - `pageSize` (number, optional): Results per page
  - `startCursor` (string, optional): Pagination cursor
- **Output**: Search results with pages/databases

#### `listDatabases`
- **Description**: Lists all accessible databases in the workspace
- **Category**: Search
- **Input Config Fields**:
  - `pageSize` (number, optional): Results per page
  - `startCursor` (string, optional): Pagination cursor
- **Output**: List of databases with basic metadata

### Comments

#### `createComment`
- **Description**: Creates a comment on a page or discussion thread
- **Category**: Comments
- **Input Config Fields**:
  - `pageId` (string, required): Page ID to comment on
  - `richText` (array, required): Comment content in rich text format
  - `discussionId` (string, optional): Parent discussion thread ID
- **Output**: Created comment object

#### `getComments`
- **Description**: Retrieves comments for a page or block
- **Category**: Comments
- **Input Config Fields**:
  - `blockId` (string, required): Block or page ID
  - `pageSize` (number, optional): Results per page
  - `startCursor` (string, optional): Pagination cursor
- **Output**: Array of comments with pagination

### User Management

#### `getUser`
- **Description**: Retrieves information about a Notion user
- **Category**: Users
- **Input Config Fields**:
  - `userId` (string, required): User ID to retrieve
- **Output**: User object with name, email, avatar

#### `listUsers`
- **Description**: Lists all users in the workspace
- **Category**: Users
- **Input Config Fields**:
  - `pageSize` (number, optional): Results per page
  - `startCursor` (string, optional): Pagination cursor
- **Output**: Array of users with pagination

#### `getBotUser`
- **Description**: Gets information about the integration's bot user
- **Category**: Users
- **Output**: Bot user object with capabilities and metadata

### Utility Blocks

#### `validateConnection`
- **Description**: Validates the API connection and returns workspace info
- **Category**: Utility
- **Output**: Connection status and workspace metadata

#### `formatRichText`
- **Description**: Helper block to format plain text into Notion rich text format
- **Category**: Utility
- **Input Config Fields**:
  - `text` (string, required): Plain text to format
  - `annotations` (object, optional): Text formatting (bold, italic, etc.)
  - `link` (string, optional): URL to link the text to
- **Output**: Formatted rich text array

#### `parseProperties`
- **Description**: Converts simple key-value pairs to Notion property format
- **Category**: Utility
- **Input Config Fields**:
  - `properties` (object, required): Simple property object
  - `schema` (object, required): Database schema for type information
- **Output**: Notion-formatted properties object

## Implementation Notes

### Error Handling
- All blocks should handle Notion API errors gracefully
- Implement exponential backoff for rate limit errors (429)
- Provide clear error messages that include Notion error codes
- Handle pagination automatically where applicable

### Data Formats
- Support both simple and advanced input formats
- Provide helpers for common content types (paragraphs, headings, lists)
- Accept both page URLs and IDs as inputs (parse URLs to extract IDs)
- Support emoji shortcuts for icons (e.g., ":rocket:" → "🚀")

### Performance Considerations
- Batch operations where possible using Notion's batch endpoints
- Implement caching for frequently accessed schemas
- Use cursor-based pagination for large result sets
- Minimize API calls by combining operations when feasible

### Security
- Never log or expose the API key in error messages
- Validate all IDs to ensure proper format
- Sanitize user inputs before sending to Notion API
- Implement request signing if Notion adds webhook support

## Future Enhancements

### Phase 2 Features
- Webhook support when Notion API adds it
- Template system for common page structures
- Bulk operations for multiple pages/databases
- Export/import functionality for backup and migration
- Advanced formula and rollup property support

### Phase 3 Features
- AI-powered content generation blocks
- Sync blocks for bidirectional data flow
- Custom views and filtering interfaces
- Integration with Notion AI features
- Workspace analytics and reporting blocks