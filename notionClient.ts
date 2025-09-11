interface NotionApiError {
  object: "error";
  status: number;
  code: string;
  message: string;
}

interface NotionApiResponse {
  object?: string;
  status?: number;
  code?: string;
  message?: string;
}

export async function callNotionApi(
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body: any,
  apiKey: string,
  retryAttempts = 3,
  timeout = 30000,
): Promise<any> {
  const baseUrl = "https://api.notion.com/v1";
  const url = `${baseUrl}${endpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: method !== "GET" ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData: NotionApiResponse = await response.json();

      if (!response.ok) {
        const error = responseData as NotionApiError;

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const waitTime = retryAfter
            ? parseInt(retryAfter) * 1000
            : Math.pow(2, attempt) * 1000;

          if (attempt < retryAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // Don't retry on client errors (except rate limiting)
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          throw new Error(`Notion API error (${error.code}): ${error.message}`);
        }

        lastError = new Error(
          `Notion API error (${response.status}): ${error.message || "Unknown error"}`,
        );

        // Retry on server errors
        if (response.status >= 500 && attempt < retryAttempts - 1) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        throw lastError;
      }

      return responseData;
    } catch (error: any) {
      if (error.name === "AbortError") {
        lastError = new Error(`Notion API request timeout after ${timeout}ms`);
      } else {
        lastError = error;
      }

      // If we have retries left and it's a retriable error, continue
      if (attempt < retryAttempts - 1 && error.name === "AbortError") {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }

  throw lastError || new Error("Failed to call Notion API");
}

// Helper function to parse Notion page/database IDs from URLs
export function parseNotionId(idOrUrl: string): string {
  // Remove any hyphens from the ID (Notion IDs can be formatted with or without them)
  const cleanId = (id: string) => id.replace(/-/g, "");

  // If it's a URL, extract the ID
  if (idOrUrl.startsWith("http")) {
    const urlParts = idOrUrl.split("/");
    const lastPart = urlParts[urlParts.length - 1];

    // Handle URLs with query parameters
    const idPart = lastPart.split("?")[0];

    // The ID is either the full last part or after the last dash
    const parts = idPart.split("-");
    const possibleId = parts[parts.length - 1];

    // Notion IDs are 32 characters (without hyphens)
    if (cleanId(possibleId).length === 32) {
      return cleanId(possibleId);
    }

    // Try the whole last part
    if (cleanId(idPart).length === 32) {
      return cleanId(idPart);
    }
  }

  // Return cleaned ID
  return cleanId(idOrUrl);
}

// Helper to format rich text for Notion API
export function formatRichText(
  text: string,
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  },
  url?: string,
): any[] {
  return [
    {
      type: "text",
      text: {
        content: text,
        link: url ? { url } : null,
      },
      annotations: {
        bold: annotations?.bold || false,
        italic: annotations?.italic || false,
        strikethrough: annotations?.strikethrough || false,
        underline: annotations?.underline || false,
        code: annotations?.code || false,
        color: annotations?.color || "default",
      },
    },
  ];
}

// Helper to convert simple text to Notion block format
export function createTextBlock(
  text: string,
  type: "paragraph" | "heading_1" | "heading_2" | "heading_3" = "paragraph",
): any {
  return {
    type,
    [type]: {
      rich_text: formatRichText(text),
    },
  };
}

// Helper to convert emoji shortcodes to Unicode
export function parseEmoji(emoji: string): string {
  const emojiMap: Record<string, string> = {
    ":rocket:": "🚀",
    ":star:": "⭐",
    ":fire:": "🔥",
    ":check:": "✅",
    ":x:": "❌",
    ":warning:": "⚠️",
    ":bulb:": "💡",
    ":book:": "📚",
    ":folder:": "📁",
    ":calendar:": "📅",
    ":clock:": "🕐",
    ":email:": "📧",
    ":phone:": "📞",
    ":globe:": "🌍",
    ":heart:": "❤️",
    ":thumbsup:": "👍",
    ":thumbsdown:": "👎",
    ":smile:": "😊",
    ":tada:": "🎉",
    ":sparkles:": "✨",
  };

  return emojiMap[emoji] || emoji;
}
