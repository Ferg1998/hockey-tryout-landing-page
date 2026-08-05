import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/admin-auth"
import { processSource, type ProcessResult } from "@/lib/import/process-source"

type SourceCheckResponse = Pick<
  ProcessResult,
  "ok" | "status" | "message" | "failureCategory" | "retryable"
>

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { ok: false, status: "error", message: "Unauthorized." } satisfies SourceCheckResponse,
      { status: 401 },
    )
  }

  try {
    const body = (await request.json()) as { sourceId?: unknown }
    const sourceId = typeof body.sourceId === "string" ? body.sourceId.trim() : ""
    if (!sourceId) {
      return NextResponse.json(
        { ok: false, status: "error", message: "Missing source id." } satisfies SourceCheckResponse,
        { status: 400 },
      )
    }

    const result = await processSource(sourceId)
    return NextResponse.json({
      ok: result.ok,
      status: result.status,
      message: result.message,
      failureCategory: result.failureCategory,
      retryable: result.retryable,
    } satisfies SourceCheckResponse)
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: error instanceof Error ? error.message : "Source check failed.",
      } satisfies SourceCheckResponse,
      { status: 500 },
    )
  }
}
