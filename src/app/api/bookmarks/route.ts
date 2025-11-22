import { NextRequest, NextResponse } from "next/server";

import { HTTP_STATUS } from "@/config/constants";
import {
  addBookmark,
  getBookmarks,
  isBookmarked,
  removeBookmark,
} from "@/lib/file-storage";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

/**
 * GET /api/bookmarks
 * Get all bookmarks
 */
export async function GET() {
  try {
    const bookmarks = await getBookmarks();
    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: bookmarks,
      message: "成功",
    });
  } catch (error) {
    console.error("Failed to get bookmarks:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: null,
        message: "获取收藏失败",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

/**
 * POST /api/bookmarks
 * Add a bookmark
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, thumbnail, url } = body;

    if (!id || !title) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          data: null,
          message: "缺少必要参数",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    await addBookmark({ id, title, thumbnail, url });

    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: null,
      message: "添加收藏成功",
    });
  } catch (error) {
    console.error("Failed to add bookmark:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: null,
        message: "添加收藏失败",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

/**
 * DELETE /api/bookmarks?id=xxx
 * Remove a bookmark
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          data: null,
          message: "缺少视频ID",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    await removeBookmark(id);

    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: null,
      message: "移除收藏成功",
    });
  } catch (error) {
    console.error("Failed to remove bookmark:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: null,
        message: "移除收藏失败",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

/**
 * GET /api/bookmarks/check?id=xxx
 * Check if a video is bookmarked
 */
export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          data: null,
          message: "缺少视频ID",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const bookmarked = await isBookmarked(id);

    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: { bookmarked },
      message: "成功",
    });
  } catch (error) {
    console.error("Failed to check bookmark:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: null,
        message: "检查收藏状态失败",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
