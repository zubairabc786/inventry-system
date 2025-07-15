"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CoaDetail } from "../../../action/action";
const CoaDetailPage = () => {
  const router = useRouter();
  const [coa, setCoa] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await CoaDetail();
      setCoa(data);
    }
    fetchData();
  }, []);
  console.log(coa);

  return (
    <div className="p-6">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Chart of Accounts
        </span>
      </h1>
      <table className="min-w-full border mt-6 border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Account Code</th>
            <th className="border px-4 py-2">Account Name</th>
            <th className="border px-4 py-2">Contact No</th>
            <th className="border px-4 py-2">Address</th>
          </tr>
        </thead>
        <tbody>
          {coa.map((record) => (
            <tr key={record.id}>
              <td className="border px-4 py-2 text-center">{record.id}</td>
              <td className="border px-4 py-2 text-center">
                {record.account_code}
              </td>
              <td className="border px-4 py-2 text-center">
                {record.account_name}
              </td>
              <td className="border px-4 py-2 text-center">
                {record.contact_No}
              </td>
              <td className="border px-4 py-2 text-center">{record.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => router.push("/coa")}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded"
      >
        Chart of Accounts Create
      </button>
    </div>
  );
};

export default CoaDetailPage;
