"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "../ui/button"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Emission = {
  date: string
  domain: string
  is_green: boolean;
  estimated_co2_grams: number
  total_bytes: number
  cups_of_coffee: number
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
    cell: ({ row }) => {
      const date = row.getValue<Date>("date"); // <-- Get the Date object directly
      return <div>{date}</div>; // <-- No need to format the date
    }
  },
  {
    accessorKey: "domain",
    cell: ({ row }) => {
      return <a href={`/site/${row.getValue("domain")}`} className="text-gradient_sky-emerald flex underline underline-offset-4 font-bold drop-shadow-lg">{row.getValue("domain")}<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right-from-square mt-1 ml-1"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg></a>
    },
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
    accessorKey: "is_green",
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
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue("is_green") ? "Yes" : "No"}</div>
    }
  },
  {
    accessorKey: "total_bytes",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total MB's Loaded
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      // If the total_bytes is `0` then we display `-` instead of `0`
      return <div className="text-center">{(row.getValue("total_bytes") !== 0) ? ((row.getValue("total_bytes") as number) / 1048576).toFixed(2) : '-'}</div>
    }
  },
  {
    accessorKey: "estimated_co2_grams",
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
    cell: ({ row }) => {
      return <div className="text-center">{(row.getValue("estimated_co2_grams") !== 0) ? row.getValue("estimated_co2_grams") : '-'}</div>
    }
  },
  {
    accessorKey: "cups_of_coffee",
    header: "Equivalent to ☕ Per 1k Pageviews",
    meta: { size: '150px' },
    cell: ({ row }) => {
      const estCO2 = parseFloat(row.getValue("estimated_co2_grams"))
      // Approx 0.021kg per cup of coffee
      // ((estimated_co2_grams * pageviews) / estCO2ForCoffee) = cups of coffee for 1k pageviews
      const estCO2ForCoffee = 21
      const pageviews = 1000
      const formatted = ((estCO2 * pageviews) / estCO2ForCoffee).toFixed(2)
 
      return <div className="text-center">{formatted}</div>
    },
  },
]
