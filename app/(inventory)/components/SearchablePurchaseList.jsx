"use client";

import { useState } from "react";
import DeletePurchase from "./DeletePurchase";
import Link from "next/link";

export default function SearchablePurchaseList({ invents }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInvents = invents.filter((invent) =>
    invent.doc_id.toString().includes(searchTerm)
  );

  return (
    <>
      {/* Search Input Box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Document ID..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Purchase List */}
      {filteredInvents.map((invent) => (
        <div key={invent.id} className="border p-4 mb-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p>
                <strong>Invoice No:</strong> {invent.invoice_no}
              </p>
              <p>
                <strong>Doc ID:-</strong> {invent.doc_id}
              </p>
              <p>
                <strong>Doc Type:-</strong> {invent.doc_type}
              </p>
              <p>
                <strong>Account:</strong> {invent.COA?.account_name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(invent.dated).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3 h-12">
              <Link
                href={`/purchase-edit/${invent.doc_id}`}
                className="p-2 bg-blue-700 text-white rounded"
              >
                Update Purchase
              </Link>
              <DeletePurchase doc_id={invent.doc_id} Sale={"Purchase"} />
            </div>
          </div>
          <div className="mt-2">
            <h2 className="font-bold text-xl text-blue-600 underline">
              Purchases:-
            </h2>
            <div className="grid grid-cols-5 text-green-500">
              <label className="font-bold">Product Name</label>
              <label className="font-bold">Quantity</label>
              <label className="font-bold">Price</label>
              <label className="font-bold">Remarks</label>
              <label className="font-bold">Amount</label>
            </div>
            {invent.Purchase.map((p) => (
              <div key={p.id} className="ml-1 grid grid-cols-5 border-l mt-2">
                <p>
                  {p.Product?.product_name} ({p.product_code})
                </p>
                <p>{p.quantity}</p>
                <p>{p.price}</p>
                <p>{p.remarks}</p>
                <p className="">{p.amount}</p>
              </div>
            ))}
            <div className="flex justify-end mr-12">
              <p className="font-bold mt-2">
                G-Total:{invent.Purchase[0]?.grandTotal}
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
