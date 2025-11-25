import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Douban API URLs
const MOVIE_URL =
  "https://movie.douban.com/j/search_subjects?type=show&tag=%E7%83%AD%E9%97%A8&page_limit=50&page_start=0";
const TV_URL = "https://m.douban.com/rexxar/api/v2/subject/recent_hot/tv";

// Simple in-memory cache
let cache: {
  movies: unknown[];
  tv: unknown[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET() {
  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({
      code: 200,
      message: "Success",
      data: {
        movies: cache.movies,
        tv: cache.tv,
      },
    });
  }

  try {
    // Fetch movies and TV in parallel
    const [moviesRes, tvRes] = await Promise.all([
      fetch(MOVIE_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }),
      fetch(TV_URL, {
        headers: {
          Referer: "https://movie.douban.com/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }),
    ]);

    const moviesData = (await moviesRes.json()) as { subjects?: unknown[] };
    const tvData = (await tvRes.json()) as { items?: unknown[] };

    const movies = moviesData.subjects || [];
    const tv = tvData.items || [];

    // Update cache
    cache = {
      movies,
      tv,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      code: 200,
      message: "Success",
      data: {
        movies,
        tv,
      },
    });
  } catch (error) {
    console.error("Douban fetch error:", error);

    // Return stale cache if available
    if (cache) {
      return NextResponse.json({
        code: 200,
        message: "Success (stale cache)",
        data: {
          movies: cache.movies,
          tv: cache.tv,
        },
      });
    }

    return NextResponse.json(
      {
        code: 500,
        message: "Failed to fetch Douban data",
        data: { movies: [], tv: [] },
      },
      { status: 500 }
    );
  }
}
