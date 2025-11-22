import { NextRequest, NextResponse } from "next/server";

import { HTTP_STATUS } from "@/config/constants";
import {
  addToWatchHistory,
  clearWatchHistory,
  getWatchHistory,
  updateProgress,
} from "@/lib/file-storage";

// Force Node.js runtime for file system access
export const runtime = "nodejs";

/**
 * GET /api/history
 * Get watch history
 */
export async function GET() {
  try {
    const history = await getWatchHistory();
    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: history,
      message: "成功",
    });
  } catch (error) {
    console.error("Failed to get watch history:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: null,
        message: "获取观看历史失败",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

/**
 * POST /api/history
 * Add to watch history
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, thumbnail, url, progress } = body;

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

    await addToWatchHistory({ id, title, thumbnail, url, progress });

    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: null,
      message: "添加观看记录成功",
    });
  } catch (error) {
    console.error("Failed to add to watch history:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: null,
        message: "添加观看记录失败",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

/**
 * DELETE /api/history
 * Clear all watch history
 */
export async function DELETE() {
  try {
    await clearWatchHistory();

    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: null,
      message: "清空观看历史成功",
    });
  } catch (error) {
    console.error("Failed to clear watch history:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: null,
        message: "清空观看历史失败",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

/**
 * PATCH /api/history/progress
 * Update playback progress
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, progress } = body;

    if (!id || progress === undefined) {
      return NextResponse.json(
        {
          code: HTTP_STATUS.BAD_REQUEST,
          data: null,
          message: "缺少必要参数",
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    await updateProgress(id, progress);

    return NextResponse.json({
      code: HTTP_STATUS.OK,
      data: null,
      message: "更新进度成功",
    });
  } catch (error) {
    console.error("Failed to update progress:", error);
    return NextResponse.json(
      {
        code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        data: null,
        message: "更新进度失败",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
