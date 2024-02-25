"use client"

import * as React from "react"

import { columns, type Emission } from "../emission/columns"
import { DataTable } from "./data-table"

import emissionsResultsJSON from "public/data/emissions_results.json";

const data = emissionsResultsJSON;
 
// async function getData(): Promise<Emission[]> {
//   // Fetch data from your API here.
//   return [
//     {
//       id: "728ed52f",
//       amount: 100,
//       status: "success",
//       email: "m@example.com",
//     }, {
//       id: "728ed52f",
//       amount: 50,
//       status: "pending",
//       email: "a@example.com"
//     }, {
//       id: "728ed52f",
//       amount: 220,
//       status: "failed",
//       email: "f@example.com"
//     }
//     // ...
//   ]
// }

// const data = await getData();

interface WrapperProps {
  "client:load": boolean;
}

const TableWrapper = (props: WrapperProps) => {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}

export { TableWrapper }
