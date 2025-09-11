/**
 * Block Registry for Notion App
 *
 * This file exports all blocks as a dictionary for easy registration.
 * Blocks are organized by category for better maintainability.
 */

// Page Management
import { createPage, getPage, updatePage, deletePage } from "./pages";

// Database Operations
import {
  queryDatabase,
  createDatabase,
  updateDatabase,
  getDatabaseSchema,
} from "./databases";

// Content Management
import {
  appendBlockChildren,
  updateBlock,
  deleteBlock,
  getBlockChildren,
} from "./content";

// Search and Discovery
import { search, listDatabases } from "./search";

// Comments
import { createComment, getComments } from "./comments";

// User Management
import { getUser, listUsers, getBotUser } from "./users";

// Utility
import {
  validateConnection,
  formatRichTextBlock,
  parseProperties,
} from "./utility";

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
  validateConnection,
  formatRichText: formatRichTextBlock,
  parseProperties,
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
  validateConnection,
  formatRichTextBlock,
  parseProperties,
};
