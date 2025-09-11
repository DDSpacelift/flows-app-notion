# Notion - Flows App

A comprehensive Notion integration that brings the full power of Notion's workspace management to your Flows workflows. Create pages, manage databases, manipulate content, and automate your Notion workspace with ease.

## Features

This app provides extensive Notion capabilities organized into functional categories:

### Page Management
- Create new pages with rich content
- Retrieve page details and properties
- Update existing pages
- Archive or delete pages

### Database Operations
- Query databases with filters and sorting
- Create new databases with custom schemas
- Update database properties
- Get database schema and structure

### Content Manipulation
- Append blocks to pages (text, headings, lists, etc.)
- Update existing blocks
- Delete blocks
- Retrieve block children and structure

### Search and Discovery
- Search across your entire workspace
- List all accessible databases
- Filter by object type (page or database)

### Collaboration
- Create comments on pages and discussions
- Retrieve comment threads
- Support for rich text formatting in comments

### User Management
- Get user information
- List all workspace users
- Retrieve bot user details

### Utility Functions
- Validate API connection
- Format rich text with advanced styling
- Parse and transform Notion properties

## Setup

### 1. Create a Notion Integration

1. Visit [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Configure your integration:
   - Give it a descriptive name (e.g., "Flows Automation")
   - Select the workspace you want to connect
   - Choose appropriate capabilities (Read, Update, Insert content)
4. Copy the "Internal Integration Token" (starts with `secret_`)

### 2. Install the App

1. Add the Notion app to your Flows workspace
2. Paste your Integration Token in the configuration
3. Optionally set:
   - **Default Workspace Name** - For reference and logging
   - **Retry Attempts** - Number of retries for failed API calls (default: 3)
   - **Request Timeout** - Max wait time for API responses in ms (default: 30000)

### 3. Share Pages and Databases

**Important:** Your integration must be explicitly shared with pages and databases:

1. Open any Notion page or database you want to access
2. Click "Share" in the top-right corner
3. Click "Invite" and search for your integration name
4. Select your integration and click "Invite"
5. Repeat for all pages/databases you want to automate

## Block Reference

### Page Operations

#### Create Page
Creates a new page in your workspace.

**Inputs:**
- `parent` - Parent page or database ID
- `title` - Page title
- `properties` - Database properties (if parent is a database)
- `children` - Initial content blocks
- `icon` - Page icon (emoji or URL)
- `cover` - Cover image URL

#### Get Page
Retrieves complete page information.

**Inputs:**
- `pageId` - The page ID to retrieve

**Output:**
- Full page object with properties, parent, and metadata

#### Update Page
Modifies an existing page's properties.

**Inputs:**
- `pageId` - The page ID to update
- `properties` - Properties to update
- `archived` - Archive status
- `icon` - New icon
- `cover` - New cover image

#### Delete Page
Permanently deletes or archives a page.

**Inputs:**
- `pageId` - The page ID to delete
- `permanently` - If true, permanently delete; otherwise archive

### Database Operations

#### Query Database
Searches and filters database entries.

**Inputs:**
- `databaseId` - The database ID to query
- `filter` - Filter conditions
- `sorts` - Sort criteria
- `startCursor` - Pagination cursor
- `pageSize` - Results per page (max: 100)

**Output:**
- `results` - Array of database pages
- `hasMore` - More results available
- `nextCursor` - Cursor for next page

#### Create Database
Creates a new database with custom schema.

**Inputs:**
- `parent` - Parent page ID
- `title` - Database title
- `properties` - Property schema definition

#### Get Database Schema
Retrieves database structure and properties.

**Inputs:**
- `databaseId` - The database ID

**Output:**
- Complete schema with property definitions

### Content Blocks

#### Append Block Children
Adds new content blocks to a page.

**Inputs:**
- `blockId` - Parent block or page ID
- `children` - Array of blocks to append

**Supported Block Types:**
- Paragraph, Heading 1-3
- Bulleted/Numbered lists
- To-do items
- Toggle lists
- Code blocks
- Quotes, Callouts
- Dividers
- And more...

#### Update Block
Modifies an existing content block.

**Inputs:**
- `blockId` - The block ID to update
- `content` - New block content
- `archived` - Archive status

#### Get Block Children
Retrieves child blocks of a parent.

**Inputs:**
- `blockId` - Parent block ID
- `startCursor` - Pagination cursor
- `pageSize` - Results per page

### Search and Discovery

#### Search
Searches across your entire workspace.

**Inputs:**
- `query` - Search query text
- `filter` - Filter by object type (page/database)
- `sort` - Sort direction and timestamp type
- `startCursor` - Pagination cursor
- `pageSize` - Results per page

#### List Databases
Lists all accessible databases.

**Inputs:**
- `startCursor` - Pagination cursor
- `pageSize` - Results per page

### Comments

#### Create Comment
Adds a comment to a page or discussion.

**Inputs:**
- `parent` - Page ID or discussion ID
- `richText` - Comment content with formatting

#### Get Comments
Retrieves comments from a page or block.

**Inputs:**
- `blockId` - Block or page ID
- `startCursor` - Pagination cursor
- `pageSize` - Results per page

### User Management

#### Get User
Retrieves information about a specific user.

**Inputs:**
- `userId` - The user ID

#### List Users
Lists all users in the workspace.

**Inputs:**
- `startCursor` - Pagination cursor
- `pageSize` - Results per page

#### Get Bot User
Retrieves information about the integration bot.

### Utility Blocks

#### Validate Connection
Tests the API connection and permissions.

**Output:**
- `connected` - Connection status
- `workspace` - Workspace details
- `botUser` - Bot user information

#### Format Rich Text
Creates formatted text for Notion.

**Inputs:**
- `text` - Plain text content
- `bold`, `italic`, `strikethrough`, `underline`, `code` - Formatting options
- `color` - Text or background color
- `link` - URL to link to

#### Parse Properties
Extracts and transforms Notion properties.

**Inputs:**
- `properties` - Raw Notion properties object
- `includeFormulas` - Include computed formula values
- `includeRollups` - Include rollup calculations

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Flows CLI (`@useflows/flowctl`)

### Scripts

```bash
# Install dependencies
npm install

# Type checking
npm run typecheck

# Format code
npm run format

# Bundle the app
npm run bundle
```

### Project Structure

```
notion/
├── blocks/                   # Block implementations
│   ├── pages.ts             # Page management blocks
│   ├── databases.ts         # Database operation blocks
│   ├── content.ts           # Content manipulation blocks
│   ├── search.ts            # Search and discovery blocks
│   ├── comments.ts          # Comment management blocks
│   ├── users.ts             # User management blocks
│   ├── utility.ts           # Utility blocks
│   └── index.ts             # Block registry
├── utils/                   # Shared utilities
│   └── notionClient.ts      # Notion API client wrapper
├── main.ts                  # App definition and configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Best Practices

### Performance Optimization

- Use pagination for large datasets (max 100 items per request)
- Cache frequently accessed database schemas
- Batch operations when possible
- Use filters to reduce API calls

### Error Handling

The app includes comprehensive error handling for:

- Invalid API tokens
- Permission errors (page/database not shared)
- Rate limiting (automatic retry with backoff)
- Network timeouts
- Invalid block types or properties

### Security Considerations

- Store Integration Tokens securely (marked as sensitive)
- Share integration only with necessary pages/databases
- Use read-only integrations when write access isn't needed
- Regularly rotate integration tokens
- Monitor integration activity in Notion settings

### Common Patterns

#### Database Automation
```
1. Query Database → Filter results
2. Process each item → Update properties
3. Create summary page with results
```

#### Content Generation
```
1. Create Page with template
2. Append Block Children with content
3. Format Rich Text for styling
4. Add Comments for collaboration
```

#### Workspace Sync
```
1. Search for existing pages
2. Compare with external data
3. Update or Create as needed
4. Validate Connection periodically
```

## Troubleshooting

### "Unauthorized" Error
- Verify your Integration Token is correct
- Check token hasn't been revoked
- Ensure token has required permissions

### "Object not found" Error
- Confirm the page/database is shared with your integration
- Check the ID is correct (use dashes or no dashes consistently)
- Verify the object hasn't been deleted

### "Rate limited" Error
- The app automatically retries with exponential backoff
- Reduce request frequency if persistent
- Consider caching frequently accessed data

### Empty Results
- Check your filter conditions
- Verify the integration has access to the content
- Ensure properties exist in the database schema

## API Limitations

- **Rate Limits**: 3 requests per second average
- **Pagination**: Maximum 100 results per page
- **Block Children**: Maximum 100 blocks per append
- **Property Limits**: Some property types have character limits
- **Search Delay**: Recently created content may not appear immediately

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure type checking passes
5. Submit a pull request

## Support

For issues and feature requests, please open an issue in the repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
