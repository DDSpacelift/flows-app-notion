import { HTTPRequest } from "@slflows/sdk/v1";
import { handleWebhookSubscriptions } from "./handleWebhookSubscriptions";

/**
 * Verify Notion webhook request using HMAC-SHA256 signature
 *
 * Notion signs webhook payloads with HMAC-SHA256 and includes the signature
 * in the X-Notion-Signature header. We need to compute the same signature
 * and compare it using a timing-safe comparison to prevent timing attacks.
 *
 * @see https://developers.notion.com/reference/webhooks#step-3-validating-event-payloads-recommended
 */
export async function verifyNotionWebhook(
  request: HTTPRequest,
  webhookSecret: string,
): Promise<boolean> {
  // Headers are case-sensitive - Notion sends X-Notion-Signature
  const signature = request.headers["X-Notion-Signature"];
  const body = request.rawBody;

  if (!signature) {
    console.warn("Missing X-Notion-Signature header.");
    return false;
  }

  if (!body) {
    console.warn("Missing request body for signature verification.");
    return false;
  }

  try {
    const encoder = new TextEncoder();

    // Import the webhook secret as a signing key
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Compute HMAC-SHA256 signature of the raw body
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));

    // Convert to hex string
    const hexMac = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Notion prefixes the signature with "sha256="
    const expectedSignature = `sha256=${hexMac}`;

    // Timing-safe comparison
    // Use a simple byte-by-byte comparison since we don't have access to timingSafeEqual
    // in all environments
    if (expectedSignature.length !== signature.length) {
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      mismatch |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
    }

    return mismatch === 0;
  } catch (e) {
    console.error("Error during Notion webhook signature verification:", e);
    return false;
  }
}

/**
 * Handle incoming webhook events from Notion
 *
 * Routes webhook events to the appropriate subscription blocks based on event type.
 * Supports page events, database events, data source events, and comment events.
 *
 * @see https://developers.notion.com/reference/webhooks-events-delivery
 */
export async function handleWebhookEndpoint(
  payload: any,
): Promise<{ statusCode: number; body?: any }> {
  // Notion doesn't have a URL verification challenge like Slack,
  // but we should handle any unknown payload types gracefully

  if (!payload || !payload.type) {
    console.warn("Received webhook payload without type field:", payload);
    return {
      statusCode: 400,
      body: { error: "Invalid payload: missing type" },
    };
  }

  // Route webhook events to subscription blocks
  console.log(`Received Notion webhook event: ${payload.type}`);

  try {
    await handleWebhookSubscriptions(payload);
    return { statusCode: 200 };
  } catch (error: any) {
    console.error("Error handling webhook event:", error);
    return {
      statusCode: 500,
      body: { error: "Internal error processing webhook" },
    };
  }
}
