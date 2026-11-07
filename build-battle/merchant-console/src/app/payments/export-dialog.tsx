"use client"

import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import type { ExportColumn, ExportScope } from "@/lib/csv"
import { Download } from "lucide-react"
import { useState } from "react"

const COLUMN_LABELS: Record<ExportColumn, string> = {
  id: "Payment ID",
  created_at: "Created (UTC)",
  merchant: "Merchant",
  description: "Description",
  status: "Status",
  method: "Method",
  card_brand: "Card brand",
  last4: "Card last four",
  amount: "Amount",
  currency: "Currency",
}

/**
 * Options for the payments CSV export. The selection here is a convenience:
 * the route re-validates columns and scope against its own allowlist.
 */
export function ExportDialog({
  query,
  columns,
  defaultColumns,
  currentCount,
  allCount,
}: {
  /** The page's active filters, as a query string. */
  query: string
  columns: readonly ExportColumn[]
  defaultColumns: readonly ExportColumn[]
  currentCount: number
  allCount: number
}) {
  const [scope, setScope] = useState<ExportScope>("current")
  const [selected, setSelected] = useState<ExportColumn[]>([...defaultColumns])

  // Keep the canonical column order, whatever order boxes were ticked in.
  const ordered = columns.filter((column) => selected.includes(column))
  const rowCount = scope === "all" ? allCount : currentCount

  const toggle = (column: ExportColumn, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, column] : current.filter((c) => c !== column),
    )

  const params = new URLSearchParams(query)
  params.set("scope", scope)
  params.set("columns", ordered.join(","))
  const href = `/api/payments/export?${params.toString()}`

  const scopes: { value: ExportScope; label: string; count: number }[] = [
    { value: "current", label: "Current filter", count: currentCount },
    { value: "all", label: "All payments", count: allCount },
  ]

  // Start from the defaults every time, so last four never carries over
  // from a previous export into one headed for a merchant.
  const onOpenChange = (open: boolean) => {
    if (open) {
      setScope("current")
      setSelected([...defaultColumns])
    }
  }

  return (
    <Drawer onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full gap-2 py-1.5 sm:w-fit">
          <Download
            className="-ml-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
          Export
        </Button>
      </DrawerTrigger>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Export payments</DrawerTitle>
          <DrawerDescription className="text-sm">
            Choose which payments and columns go into the CSV.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Scope
            </legend>
            <div className="mt-2 space-y-2">
              {scopes.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="radio"
                    name="export-scope"
                    value={option.value}
                    checked={scope === option.value}
                    onChange={() => setScope(option.value)}
                    className="size-4 accent-blue-500"
                  />
                  {option.label}
                  <span className="text-gray-500">
                    · {option.count.toLocaleString("en-US")} payments
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <div className="flex items-center justify-between">
              <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
                Columns
              </legend>
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  className="text-blue-600 hover:underline dark:text-blue-500"
                  onClick={() => setSelected([...columns])}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="text-blue-600 hover:underline dark:text-blue-500"
                  onClick={() => setSelected([])}
                >
                  None
                </button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {columns.map((column) => (
                <label
                  key={column}
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(column)}
                    onChange={(event) => toggle(column, event.target.checked)}
                    className="size-4 accent-blue-500"
                  />
                  {COLUMN_LABELS[column]}
                </label>
              ))}
            </div>
            {selected.includes("last4") && (
              <p className="mt-3 text-sm text-orange-600 dark:text-orange-500">
                Card last four is included. Check before sending this file to a
                merchant.
              </p>
            )}
          </fieldset>
        </DrawerBody>

        <DrawerFooter className="items-center gap-2">
          <p className="mr-auto text-sm text-gray-500" aria-live="polite">
            {ordered.length === 0
              ? "Choose at least one column."
              : `${rowCount.toLocaleString("en-US")} rows · ${ordered.length} columns`}
          </p>
          <DrawerClose asChild>
            <Button variant="secondary" className="w-full sm:w-fit">
              Cancel
            </Button>
          </DrawerClose>
          {ordered.length === 0 ? (
            <Button disabled className="w-full sm:w-fit">
              Download
            </Button>
          ) : (
            <Button asChild className="w-full sm:w-fit">
              <a href={href} download>
                Download
              </a>
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
