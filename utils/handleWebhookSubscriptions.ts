import { blocks, messaging } from "@slflows/sdk/v1";

/**
 * Handle incoming webhook events from Notion and route them to subscription blocks
 *
 * This function examines the event type and filters blocks based on their configuration
 * to avoid sending unnecessary internal messages to blocks that will ignore them.
 */
export async function handleWebhookSubscriptions(event: any) {
  if (!event?.type) {
    console.warn("Received webhook event without type field:", event);
    return;
  }

  const eventType = event.type;

  // Route based on event category
  if (eventType.startsWith("page.")) {
    // Page events
    const pageSubscriptionBlocks = await blocks.list({
      typeIds: ["pageSubscription"],
    });

    // Filter blocks based on their configuration
    const relevantBlocks = pageSubscriptionBlocks.blocks.filter((block) => {
      // Filter by event type if configured
      if (block.config.eventTypes) {
        const allowedTypes = block.config.eventTypes as string[];

        if (allowedTypes.length > 0 && !allowedTypes.includes(eventType)) {
          return false;
        }
      }

      // Filter by page ID if configured
      if (block.config.pageId) {
        const targetPageId = block.config.pageId as string;
        const eventPageId = event.data?.id || event.entity?.id;

        if (eventPageId && eventPageId !== targetPageId) {
          return false;
        }
      }

      return true;
    });

    if (relevantBlocks.length > 0) {
      await messaging.sendToBlocks({
        blockIds: relevantBlocks.map((b) => b.id),
        body: event,
      });
    }
  } else if (eventType.startsWith("database.")) {
    // Database events (deprecated but still supported)
    const databaseSubscriptionBlocks = await blocks.list({
      typeIds: ["databaseSubscription"],
    });

    // Filter blocks based on their configuration
    const relevantBlocks = databaseSubscriptionBlocks.blocks.filter((block) => {
      // Filter by event type if configured
      if (block.config.eventTypes) {
        const allowedTypes = block.config.eventTypes as string[];

        if (allowedTypes.length > 0 && !allowedTypes.includes(eventType)) {
          return false;
        }
      }

      // Filter by database ID if configured
      if (block.config.databaseId) {
        const targetDatabaseId = block.config.databaseId as string;
        const eventDatabaseId = event.data?.id || event.entity?.id;

        if (eventDatabaseId && eventDatabaseId !== targetDatabaseId) {
          return false;
        }
      }

      return true;
    });

    if (relevantBlocks.length > 0) {
      await messaging.sendToBlocks({
        blockIds: relevantBlocks.map((b) => b.id),
        body: event,
      });
    }
  } else if (eventType.startsWith("data_source.")) {
    // Data source events (new in 2025-09-03)
    const dataSourceSubscriptionBlocks = await blocks.list({
      typeIds: ["dataSourceSubscription"],
    });

    // Filter blocks based on their configuration
    const relevantBlocks = dataSourceSubscriptionBlocks.blocks.filter(
      (block) => {
        // Filter by event type if configured
        if (block.config.eventTypes) {
          const allowedTypes = block.config.eventTypes as string[];

          if (allowedTypes.length > 0 && !allowedTypes.includes(eventType)) {
            return false;
          }
        }

        // Filter by data source ID if configured
        if (block.config.dataSourceId) {
          const targetDataSourceId = block.config.dataSourceId as string;
          const eventDataSourceId = event.data?.id || event.entity?.id;

          if (eventDataSourceId && eventDataSourceId !== targetDataSourceId) {
            return false;
          }
        }

        return true;
      },
    );

    if (relevantBlocks.length > 0) {
      await messaging.sendToBlocks({
        blockIds: relevantBlocks.map((b) => b.id),
        body: event,
      });
    }
  } else if (eventType.startsWith("comment.")) {
    // Comment events
    const commentSubscriptionBlocks = await blocks.list({
      typeIds: ["commentSubscription"],
    });

    // Filter blocks based on their configuration
    const relevantBlocks = commentSubscriptionBlocks.blocks.filter((block) => {
      // Filter by event type if configured
      if (block.config.eventTypes) {
        const allowedTypes = block.config.eventTypes as string[];

        if (allowedTypes.length > 0 && !allowedTypes.includes(eventType)) {
          return false;
        }
      }

      // Filter by page ID if configured
      if (block.config.pageId) {
        const targetPageId = block.config.pageId as string;
        const eventPageId = event.data?.parent?.page_id || event.entity?.id;

        if (eventPageId && eventPageId !== targetPageId) {
          return false;
        }
      }

      return true;
    });

    if (relevantBlocks.length > 0) {
      await messaging.sendToBlocks({
        blockIds: relevantBlocks.map((b) => b.id),
        body: event,
      });
    }
  } else {
    console.warn(`Received unknown webhook event type: ${eventType}`);
  }
}
