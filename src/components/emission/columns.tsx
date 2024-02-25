"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "../ui/button"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Emission = {
  date: string
  domain: string
  isGreen: boolean;
  estimatedCO2: string
  totalBytes: number
  cupsOfCoffee: number
}

export const columns: ColumnDef<Emission>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Scan Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "domain",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Domain
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "isGreen",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Is Green Hosted?
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "totalBytes",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Bytes Loaded
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "estimatedCO2",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estimated CO2 (grams)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "cupsOfCoffee",
    header: "Equivalent to X Cups of Coffee Per 1k Pageviews",
    meta: { size: '150px' },
    cell: ({ row }) => {
      const estCO2 = parseFloat(row.getValue("estimatedCO2"))
      // Approx 0.4kg per cup of coffee (400g)
      // ((estimatedCO2 * pageviews) / estCO2ForCoffee) = cups of coffee for 1k pageviews
      const estCO2ForCoffee = 400
      const pageviews = 1000
      const formatted = ((estCO2 * pageviews) / estCO2ForCoffee).toFixed(2)
 
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
]
