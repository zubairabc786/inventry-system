"use client";
import { getDropdownDataJornal } from "../../action/action";
import { useEffect, useState } from "react";
import { createJournal } from "../../action/action";
import Link from "next/link";

export default function JournalForm() {
  const [coaList, setCoaList] = useState([]);
  // console.log(coaList[1]);
  useEffect(() => {
    getDropdownDataJornal().then(({ coaList }) => {
      setCoaList(coaList);
    });
  }, []);

  const [form, setForm] = useState({
    doc_type: "JV",
    dated: "",
    remarks: "",
    details: [{ account_code: "", debit: 0, credit: 0, remarks: "" }],
  });

  const addRow = () => {
    setForm({
      ...form,
      details: [
        ...form.details,
        { account_code: "", debit: 0, credit: 0, remarks: "" },
      ],
    });
  };

  const handleDetailChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index][field] = value;
    setForm({ ...form, details: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createJournal(form);
    alert(`Saved Doc ID: ${result.doc_id}`);
    setForm({
      doc_type: "JV",
      dated: "",
      remarks: "",
      details: [{ account_code: "", debit: 0, credit: 0, remarks: "" }],
    });
  };

  const removeRow = (index) => {
    const updated = [...form.details];
    updated.splice(index, 1);
    setForm({ ...form, details: updated });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
              Create Journal Voucher
            </span>
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Fill in the details below to create a new journal entry
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-xl rounded-lg p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Document Type
              </label>
              <input
                type="text"
                value={form.doc_type}
                onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100 text-gray-600 p-2"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={form.dated}
                onChange={(e) => setForm({ ...form, dated: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              />
            </div>
            {/* <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <input
                type="text"
                placeholder="Enter remarks"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              />
            </div> */}
          </div>

          <div className="mb-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Account Code
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Debit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Credit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Remarks
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {form.details.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        onChange={(e) =>
                          handleDetailChange(
                            idx,
                            "account_code",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
                        value={row.account_code}
                      >
                        <option value="">Select Account</option>
                        {coaList.map((c) => (
                          <option key={c.account_code} value={c.account_code}>
                            {c.account_code} - {c.account_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={row.debit}
                        onChange={(e) =>
                          handleDetailChange(idx, "debit", e.target.value)
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={row.credit}
                        onChange={(e) =>
                          handleDetailChange(idx, "credit", e.target.value)
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) =>
                          handleDetailChange(idx, "remarks", e.target.value)
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
                        placeholder="Row remarks"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-600 hover:text-red-900"
                        title="Remove row"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Row
            </button>

            <div className="flex gap-4">
              <Link
                href="/jornal-md-detail"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Journal Details
              </Link>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Submit Journal
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
