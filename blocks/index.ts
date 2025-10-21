/**
 * Block Registry for Notion App
 *
 * This file exports all blocks as a dictionary for easy registration.
 * Blocks are organized by category directories for better maintainability.
 */

// Page Management
import { createPage } from "./pages/createPage";
import { getPage } from "./pages/getPage";
import { updatePage } from "./pages/updatePage";
import { deletePage } from "./pages/deletePage";

// Database Operations
import { queryDatabase } from "./databases/queryDatabase";
import { createDatabase } from "./databases/createDatabase";
import { updateDatabase } from "./databases/updateDatabase";
import { getDatabaseSchema } from "./databases/getDatabaseSchema";

// Content Management
import { appendBlockChildren } from "./content/appendBlockChildren";
import { updateBlock } from "./content/updateBlock";
import { deleteBlock } from "./content/deleteBlock";
import { getBlockChildren } from "./content/getBlockChildren";

// Search and Discovery
import { search } from "./search/search";
import { listDatabases } from "./search/listDatabases";

// Comments
import { createComment } from "./comments/createComment";
import { getComments } from "./comments/getComments";

// User Management
import { getUser } from "./users/getUser";
import { listUsers } from "./users/listUsers";
import { getBotUser } from "./users/getBotUser";

// Utility
import { formatRichTextBlock } from "./utility/formatRichText";
import { parseProperties } from "./utility/parseProperties";

// Webhook Subscriptions
import { pageSubscription } from "./subscriptions/pageSubscription";
import { databaseSubscription } from "./subscriptions/databaseSubscription";
import { dataSourceSubscription } from "./subscriptions/dataSourceSubscription";
import { commentSubscription } from "./subscriptions/commentSubscription";

/**
 * Dictionary of all available blocks
 * Organized by functionality for easy discovery
 */
export const blocks = {
  // Pages
  createPage,
  getPage,
  updatePage,
  deletePage,

  // Databases
  queryDatabase,
  createDatabase,
  updateDatabase,
  getDatabaseSchema,

  // Content
  appendBlockChildren,
  updateBlock,
  deleteBlock,
  getBlockChildren,

  // Search
  search,
  listDatabases,

  // Comments
  createComment,
  getComments,

  // Users
  getUser,
  listUsers,
  getBotUser,

  // Utility
  formatRichText: formatRichTextBlock,
  parseProperties,

  // Webhook Subscriptions
  pageSubscription,
  databaseSubscription,
  dataSourceSubscription,
  commentSubscription,
} as const;

// Named exports for individual blocks (optional, for external imports)
export {
  // Pages
  createPage,
  getPage,
  updatePage,
  deletePage,
  // Databases
  queryDatabase,
  createDatabase,
  updateDatabase,
  getDatabaseSchema,
  // Content
  appendBlockChildren,
  updateBlock,
  deleteBlock,
  getBlockChildren,
  // Search
  search,
  listDatabases,
  // Comments
  createComment,
  getComments,
  // Users
  getUser,
  listUsers,
  getBotUser,
  // Utility
  formatRichTextBlock,
  parseProperties,
  // Webhook Subscriptions
  pageSubscription,
  databaseSubscription,
  dataSourceSubscription,
  commentSubscription,
};
