"use client";

import { useState, useRef } from "react";
import DeletePurchase from "./DeletePurchase";
import Link from "next/link";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export default function SearchablePurchaseReturn({ invents }) {
  const [searchTerm, setSearchTerm] = useState("");
  const billRefs = useRef({});

  const filteredInvents = invents.filter((invent) =>
    invent.doc_id.toString().includes(searchTerm)
  );

  const downloadPdf = async (docId) => {
    const element = billRefs.current[docId];
    if (!element) return;

    try {
      const dataUrl = await toPng(element);
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`purchase-${docId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

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
          <div
            ref={(el) => (billRefs.current[invent.doc_id] = el)}
            className="p-4 bg-white"
          >
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
                  href={`/sale-edit/${invent.doc_id}`}
                  className="p-2 bg-blue-700 text-white rounded"
                >
                  Update Purchase Return
                </Link>
                <DeletePurchase doc_id={invent.doc_id} Sale={"Purchase"} />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="font-bold text-xl text-blue-600 underline">
                Purchase Return:-
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
                    {p.Product?.product_name}
                    {/* ({p.product_code}) */}
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
          <button
            onClick={() => downloadPdf(invent.doc_id)}
            className="mt-2 p-2 bg-red-600 text-white rounded"
          >
            Download as PDF
          </button>
        </div>
      ))}
    </>
  );
}
