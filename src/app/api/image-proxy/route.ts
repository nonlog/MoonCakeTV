import { NextResponse } from "next/server";

export const runtime = "edge";

const IMAGE_FETCH_TIMEOUT = 10000; // 10 seconds timeout
const MAX_RETRIES = 2;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchImageWithRetry(
  imageUrl: string,
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const imageResponse = await fetchWithTimeout(
        imageUrl,
        {
          headers: {
            Referer: "https://movie.douban.com/",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
            "Cache-Control": "no-cache",
          },
        },
        IMAGE_FETCH_TIMEOUT,
      );

      if (imageResponse.ok) {
        return imageResponse;
      }

      // If it's the last attempt or a non-retryable error, throw
      if (attempt === retries || imageResponse.status < 500) {
        throw new Error(
          `HTTP ${imageResponse.status}: ${imageResponse.statusText}`,
        );
      }
    } catch (error) {
      // If it's the last attempt, re-throw the error
      if (attempt === retries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );
    }
  }

  throw new Error("Max retries exceeded");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  try {
    const imageResponse = await fetchImageWithRetry(imageUrl);

    const contentType = imageResponse.headers.get("content-type");

    if (!imageResponse.body) {
      return NextResponse.json(
        { error: "Image response has no body" },
        { status: 500 },
      );
    }

    // 创建响应头
    const headers = new Headers();
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    // 设置缓存头
    headers.set("Cache-Control", "public, max-age=15720000"); // 缓存半年

    // Add CORS headers if needed
    headers.set("Access-Control-Allow-Origin", "*");

    // 直接返回图片流
    return new Response(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Image proxy error:", error);

    // Provide more detailed error information
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isTimeout =
      errorMessage.includes("aborted") || errorMessage.includes("timeout");

    return NextResponse.json(
      {
        error: isTimeout
          ? "Image fetch timeout"
          : `Error fetching image: ${errorMessage}`,
        url: imageUrl, // Include the URL for debugging
      },
      { status: isTimeout ? 408 : 500 },
    );
  }
}
