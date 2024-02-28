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
  estimatedCO2: number
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
    cell: ({ row }) => {
      return <a href={`/co2-emission-tracker/site/${row.getValue("domain")}`} className="text-gradient_sky-emerald flex underline underline-offset-4 font-bold drop-shadow-lg">{row.getValue("domain")}<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right-from-square mt-1 ml-1"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg></a>
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
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue("isGreen") ? "Yes" : "No"}</div>
    }
  },
  {
    accessorKey: "totalBytes",
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
      // If the totalBytes is `0` then we display `-` instead of `0`
      return <div className="text-center">{(row.getValue("totalBytes") !== 0) ? ((row.getValue("totalBytes") as number) / 1048576).toFixed(2) : '-'}</div>
    }
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
    cell: ({ row }) => {
      return <div className="text-center">{(row.getValue("estimatedCO2") !== 0) ? row.getValue("estimatedCO2") : '-'}</div>
    }
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
 
      return <div className="text-center">{formatted}</div>
    },
  },
]
