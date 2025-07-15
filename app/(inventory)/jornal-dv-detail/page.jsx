"use client";
import { useEffect, useState } from "react";
import { getAllJournalsDV } from "../action/action";
import Link from "next/link";
import DeleteJornal from "../components/DeleteJornal";

export default function JournalList() {
  const [journals, setJournals] = useState([]);

  useEffect(() => {
    getAllJournalsDV().then(setJournals);
  }, []);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift py-4">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Jornal Details Of DV
        </span>
      </h1>
      {journals.map((j) => (
        <div key={j.doc_id} className="border mb-4 p-2 rounded shadow">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold">Doc ID: {j.doc_id}</h3>
              <p>Doc Type: {j.doc_type}</p>
              <p>Dated: {new Date(j.dated).toLocaleDateString()}</p>
              <p>Remarks: {j.remarks}</p>
            </div>
            <div className="flex gap-3 h-12">
              <Link
                href={`/jornal-edit/${j.doc_id}`}
                className="p-2 bg-blue-700 text-white rounded"
              >
                Update Jornal
              </Link>
              <DeleteJornal doc_id={j.doc_id} Sale={"Jornal"} />
            </div>
          </div>
          <table className="w-full mt-2 border">
            <thead>
              <tr className="grid grid-cols-4 gap-2 text-left font-semibold">
                <th>Account Code</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {j.JornalDtl.map((d, index) => (
                <tr key={index} className="grid grid-cols-4 gap-2">
                  <td>{d.COA?.account_name}</td>
                  <td>{d.debit}</td>
                  <td>{d.credit}</td>
                  <td>{d.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
