import { defineApp } from "@slflows/sdk/v1";
import { blocks } from "./blocks/index";

export const app = defineApp({
  name: "Notion",
  installationInstructions:
    "Connect your Notion workspace to automate page creation, database management, and content operations.\n\nTo install:\n1. Create a Notion integration at https://www.notion.so/my-integrations\n2. Copy the Internal Integration Token\n3. Add the integration token below\n4. Share the integration with pages/databases you want to access\n5. Start using Notion blocks in your flows",

  blocks,

  config: {
    notionApiKey: {
      name: "Notion Integration Token",
      description:
        "Internal Integration Token from your Notion integration (starts with 'secret_')",
      type: "string",
      required: true,
      sensitive: true,
    },
    defaultWorkspaceName: {
      name: "Default Workspace Name",
      description: "Optional workspace name for reference and logging",
      type: "string",
      required: false,
    },
    retryAttempts: {
      name: "Retry Attempts",
      description: "Number of retry attempts for failed API calls",
      type: "number",
      required: false,
      default: 3,
    },
    requestTimeout: {
      name: "Request Timeout (ms)",
      description: "Maximum time to wait for Notion API responses",
      type: "number",
      required: false,
      default: 30000,
    },
  },
});
