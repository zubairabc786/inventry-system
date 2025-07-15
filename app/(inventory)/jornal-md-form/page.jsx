"use client";
import { getDropdownDataJornal } from "../../action/action";
import { useEffect, useState } from "react";
import { createJournal } from "../../action/action";
import Link from "next/link";

export default function JournalForm() {
  const [coaList, setCoaList] = useState([]);

  useEffect(() => {
    getDropdownDataJornal().then(({ coaList }) => {
      setCoaList(coaList);
    });
  }, []);

  const [form, setForm] = useState({
    doc_type: "DV",
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
      doc_type: "DV",
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
    <form
      onSubmit={handleSubmit}
      className="h-screen p-4 max-w-7xl space-y-1 mx-auto"
    >
      <h1 className="text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Create Jornal
        </span>
      </h1>
      <div className="flex flex-col gap-2 ">
        <div>
          <label className="font-bold p-2">Doc Type:-</label>
          <input
            type="text"
            placeholder="Doc Type"
            value={form.doc_type}
            readOnly
            onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
            className="border p-1"
          />
        </div>
        <div>
          <label className="font-bold p-2">Dated:-</label>
          <input
            type="date"
            value={form.dated}
            onChange={(e) => setForm({ ...form, dated: e.target.value })}
            className="border p-1"
          />
        </div>
        <div>
          <label className="font-bold p-2">Remarks:-</label>
          <input
            type="text"
            placeholder="Remarks"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            className="border p-1"
          />
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className=" grid grid-cols-5 gap-3 text-left pt-5">
            <th>Account Code</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {form.details.map((row, idx) => (
            <tr key={idx} className=" grid grid-cols-5 gap-3">
              <td>
                <select
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
              <td className="border">
                <input
                  type="number"
                  value={row.debit}
                  onChange={(e) =>
                    handleDetailChange(idx, "debit", e.target.value)
                  }
                />
              </td>
              <td className="border">
                <input
                  type="number"
                  value={row.credit}
                  onChange={(e) =>
                    handleDetailChange(idx, "credit", e.target.value)
                  }
                />
              </td>
              <td className="border">
                <input
                  value={row.remarks}
                  onChange={(e) =>
                    handleDetailChange(idx, "remarks", e.target.value)
                  }
                />
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-center gap-3 pt-5 ">
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
          Submit Now
        </button>
      </div>
      <div className="flex justify-center pt-4">
        <Link
          href="/jornal-md-detail"
          className="bg-blue-800 px-4 py-2 text-white rounded"
        >
          Go To Jornal Detail
        </Link>
      </div>
    </form>
  );
}
