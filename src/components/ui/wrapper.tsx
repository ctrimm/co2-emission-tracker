"use client"

import * as React from "react"

import { columns, type Emission } from "../emission/columns"
import { DataTable } from "./data-table"

import emissionsResultsJSON from "public/data/emissions_results.json";

const data = emissionsResultsJSON;

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from "recharts";
 
// async function getData(): Promise<Payment[]> {
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

interface AreaWrapperProps {
  "client:load": boolean;
  "data": { name: string; uv: number; pv: number; amt: number; }[]
}

const TableWrapper = (props: WrapperProps) => {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}

const AreaChartWrapper = (props: AreaWrapperProps) => {
  return (
    <div className="container mx-auto h-[18rem]">
      <ResponsiveContainer  height="100%">

        <AreaChart
          data={props.data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0
          }}
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="pv" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPv)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { TableWrapper, AreaChartWrapper }
