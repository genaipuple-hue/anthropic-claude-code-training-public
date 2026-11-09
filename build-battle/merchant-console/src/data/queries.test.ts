import { describe, expect, it } from "vitest"
import { sortPayments } from "./queries"
import { store } from "./store"
import { Payment } from "./types"

/**
 * Amounts are integer minor units, so sorting by amount must compare them as
 * numbers. Compared as strings, "994" ($9.94) sorts above "9873" ($98.73) and
 * "48000" ($480.00) lands below both, which is what ops saw on
 * /payments?sort=amount&direction=desc.
 */

function payment(id: string, amount: number, createdAt: string): Payment {
  return {
    id,
    merchantId: "mch_01",
    amount,
    currency: "USD",
    status: "captured",
    method: "card",
    cardBrand: "visa",
    last4: "4242",
    createdAt,
    description: "Order",
  }
}

const rows = [
  payment("pay_a", 994, "2026-03-01T10:00:00.000Z"),
  payment("pay_b", 9873, "2026-03-02T10:00:00.000Z"),
  payment("pay_c", 48000, "2026-03-03T10:00:00.000Z"),
  payment("pay_d", 450, "2026-03-04T10:00:00.000Z"),
]

const amounts = (payments: Payment[]) => payments.map((p) => p.amount)

describe("sortPayments by amount", () => {
  it("puts the largest amount first when descending, not the one with the biggest leading digit", () => {
    expect(amounts(sortPayments(rows, "amount", "desc"))).toEqual([
      48000, 9873, 994, 450,
    ])
  })

  it("puts the smallest amount first when ascending", () => {
    expect(amounts(sortPayments(rows, "amount", "asc"))).toEqual([
      450, 994, 9873, 48000,
    ])
  })

  it("orders the whole seed data by numeric amount", () => {
    const sorted = amounts(sortPayments(store.payments, "amount", "desc"))
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1]).toBeGreaterThanOrEqual(sorted[i])
    }
  })

  it("does not reorder the input array", () => {
    const input = [...rows]
    sortPayments(input, "amount", "desc")
    expect(input.map((p) => p.id)).toEqual(["pay_a", "pay_b", "pay_c", "pay_d"])
  })
})

describe("sortPayments by date", () => {
  it("still sorts newest first by default", () => {
    expect(sortPayments(rows).map((p) => p.id)).toEqual([
      "pay_d",
      "pay_c",
      "pay_b",
      "pay_a",
    ])
  })
})
