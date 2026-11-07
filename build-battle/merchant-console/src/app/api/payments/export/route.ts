import { filterPayments, parseFilters, sortPayments } from "@/data/queries"
import {
  exportFilename,
  parseExportColumns,
  parseExportScope,
  toCsv,
} from "@/lib/csv"
import { NextRequest, NextResponse } from "next/server"

/**
 * Exports the payments table as CSV (NWP-101).
 *
 * `columns` and `scope` come from the client and are parsed against an
 * allowlist in `src/lib/csv.ts`. Rows come from the one query builder and are
 * never paginated: "current" is every row matching the active filters, "all"
 * is every payment.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const columns = parseExportColumns(params.get("columns"))
  if (columns.length === 0) {
    return NextResponse.json(
      { message: "Choose at least one column to export." },
      { status: 400 },
    )
  }

  const scope = parseExportScope(params.get("scope"))
  const filters = parseFilters(params)
  const matching =
    scope === "all" ? filterPayments({ status: "all" }) : filterPayments(filters)
  const rows = sortPayments(matching, filters.sort, filters.direction)

  // Label only ever comes from allowlisted values: the scope or a validated status.
  const label =
    scope === "all"
      ? "all"
      : filters.status && filters.status !== "all"
        ? filters.status
        : "filtered"

  return new Response(toCsv(rows, columns), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(new Date(), label)}"`,
    },
  })
}
