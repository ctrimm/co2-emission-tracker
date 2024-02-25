"use client"

import * as React from "react"

import { columns, type Payment } from "../payments/columns"
import { DataTable } from "./data-table"
 
async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "success",
      email: "m@example.com",
    }, {
      id: "728ed52f",
      amount: 50,
      status: "pending",
      email: "a@example.com"
    }, {
      id: "728ed52f",
      amount: 220,
      status: "failed",
      email: "f@example.com"
    },
    {
      id: "728ed52f",
      amount: 100,
      status: "success",
      email: "m@example.com",
    }, {
      id: "728ed52f",
      amount: 50,
      status: "pending",
      email: "a@example.com"
    }, {
      id: "728ed52f",
      amount: 220,
      status: "failed",
      email: "f@example.com"
    },
    {
      id: "728ed52f",
      amount: 100,
      status: "success",
      email: "m@example.com",
    }, {
      id: "728ed52f",
      amount: 50,
      status: "pending",
      email: "a@example.com"
    }, {
      id: "728ed52f",
      amount: 220,
      status: "failed",
      email: "f@example.com"
    },
    {
      id: "728ed52f",
      amount: 100,
      status: "success",
      email: "m@example.com",
    }, {
      id: "728ed52f",
      amount: 50,
      status: "pending",
      email: "a@example.com"
    }, {
      id: "728ed52f",
      amount: 220,
      status: "failed",
      email: "f@example.com"
    }
    // ...
  ]
}

const data = await getData();

// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "./dialog"

// interface WrapperProps {
//   children: React.ReactNode;
// }

// const DialogWrapper = (props: WrapperProps) => {
//   return (
//     <div className="container">
//       <Dialog>
//           <DialogTrigger>Open</DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Are you absolutely sure?</DialogTitle>
//               <DialogDescription>
//                 This action cannot be undone. This will permanently delete your account
//                 and remove your data from our servers.
//               </DialogDescription>
//             </DialogHeader>
//           </DialogContent>
//         </Dialog>
//     </div>
//   );
// }

// export { DialogWrapper }


interface WrapperProps {
  children: React.ReactNode;
}

// export default async function DemoPage() {
//   const data = await getData()
 
//   return (
//     <div className="container mx-auto py-10">
//       <DataTable columns={columns} data={data} />
//     </div>
//   )
// }

const TableWrapper = (props: WrapperProps) => {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}

export { TableWrapper }
