"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDropdownDataJornal,
  getJournalById,
  updateJournal,
} from "../../action/action";

export default function EditJournalForm({ params }) {
  const { doc_id } = params;

  const [coaList, setCoaList] = useState([]);
  const [form, setForm] = useState({
    doc_type: "DV",
    dated: "",
    remarks: "",
    details: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      const [dropdown, journal] = await Promise.all([
        getDropdownDataJornal(),
        getJournalById(doc_id),
      ]);

      setCoaList(dropdown.coaList);
      setForm({
        doc_type: journal.doc_type,
        dated: journal.dated.toLocaleDateString(),
        remarks: journal.remarks,
        details: journal.JornalDtl.map((row) => ({
          account_code: row.account_code,
          debit: row.debit,
          credit: row.credit,
          remarks: row.remarks,
        })),
      });
    };
    fetchData();
  }, [doc_id]);

  const handleDetailChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index][field] = value;
    setForm({ ...form, details: updated });
  };

  const addRow = () => {
    setForm({
      ...form,
      details: [
        ...form.details,
        { account_code: "", debit: 0, credit: 0, remarks: "" },
      ],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateJournal(doc_id, form);
    if (result.success) {
      alert("Journal updated successfully!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-7xl space-y-1 mx-auto">
      <h1 className="my-4 text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Edit Jornal
        </span>
      </h1>
      <div className="flex flex-col gap-2 w-1/4">
        <div>
          <label className="font-bold p-1">Doc Type:</label>
          <input
            type="text"
            placeholder="Doc Type"
            readOnly
            value={form.doc_type}
            onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
            className="border p-1"
          />
        </div>
        <div>
          <label className="font-bold p-1">Dated:</label>
          <input
            type="date"
            value={
              form.dated ? new Date(form.dated).toISOString().slice(0, 10) : ""
            }
            onChange={(e) => setForm({ ...form, dated: e.target.value })}
            className="border p-1"
          />
        </div>
        <div>
          <label className="font-bold p-1">Remarks:</label>
          <input
            type="text"
            placeholder="Remarks"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            className="border p-1"
          />
        </div>
      </div>

      <table className="w-full mt-4">
        <thead>
          <tr className="grid grid-cols-4 gap-3 text-left mt-3">
            <th>Account Code</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {form.details.map((row, idx) => (
            <tr key={idx} className="grid grid-cols-4 gap-3 p-1 ">
              <td>
                <select
                  value={row.account_code}
                  readOnly
                  onChange={(e) =>
                    handleDetailChange(idx, "account_code", e.target.value)
                  }
                  className="border p-1"
                >
                  <option value="">Select</option>
                  {coaList.map((c) => (
                    <option key={c.account_code} value={c.account_code}>
                      {c.account_code} - {c.account_name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={row.debit}
                  onChange={(e) =>
                    handleDetailChange(idx, "debit", e.target.value)
                  }
                  className="border p-1"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={row.credit}
                  onChange={(e) =>
                    handleDetailChange(idx, "credit", e.target.value)
                  }
                  className="border p-1"
                />
              </td>
              <td>
                <input
                  value={row.remarks}
                  onChange={(e) =>
                    handleDetailChange(idx, "remarks", e.target.value)
                  }
                  className="border p-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center gap-3 pt-5">
        <button
          type="button"
          onClick={addRow}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          + Add Row
        </button>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Update Now
        </button>
      </div>
      <div className="flex justify-center pt-4">
        <Link
          href="/jornal-md-detail"
          className="bg-blue-800 px-4 py-2 text-white rounded"
        >
          Go To Jornal JV Detail
        </Link>
      </div>
      <div className="flex justify-center pt-4">
        <Link
          href="/jornal-dv-detail"
          className="bg-blue-800 px-4 py-2 text-white rounded"
        >
          Go To Jornal DV Detail
        </Link>
      </div>
    </form>
  );
}
