"use client";
import { useEffect, useState, useRef } from "react";
import { getJournalEntries1 } from "../../action/action";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function JournalPage() {
  // State management
  const [journal, setJournal] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const componentRef = useRef();

  // Fetch journal entries with debounce
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getJournalEntries1(search, fromDate, toDate);
        setJournal(result);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, fromDate, toDate]);

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        table {
          width: 100% !important;
        }
        th {
          background-color: #2563eb !important;
          color: white !important;
        }
      }
    `,
  });

  // PDF export functionality
  const exportToPDF = () => {
    // Create new PDF document
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
    });

    // Add title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Account Statement", 40, 40);

    // Add filter information
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let filterText = "Showing all records";
    if (fromDate && toDate) {
      filterText = `Period: ${new Date(
        fromDate
      ).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`;
    }
    doc.text(filterText, 40, 60);

    // Prepare table columns
    const columns = [
      { header: "Account Code", dataKey: "account_code" },
      { header: "Account Name", dataKey: "account_name" },
      { header: "Date", dataKey: "date" },
      { header: "Doc Type", dataKey: "doc_type" },
      { header: "Debit", dataKey: "debit" },
      { header: "Credit", dataKey: "credit" },
      { header: "Balance", dataKey: "balance" },
    ];

    // Prepare table data
    const rows = journal.map((entry) => ({
      account_code: entry.account_code,
      account_name: entry.account_name,
      date: entry.isOpeningBalance
        ? "Opening"
        : new Date(entry.date).toLocaleDateString(),
      doc_type: entry.doc_type,
      debit: entry.debit > 0 ? entry.debit.toLocaleString() : "-",
      credit: entry.credit > 0 ? entry.credit.toLocaleString() : "-",
      balance: entry.balance.toLocaleString(),
    }));

    // Add the table to PDF
    autoTable(doc, {
      columns: columns,
      body: rows,
      startY: 80,
      styles: {
        fontSize: 8,
        cellPadding: 6,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: "auto" },
        2: { cellWidth: "auto" },
        3: { cellWidth: "auto" },
        4: { cellWidth: "auto", halign: "right" },
        5: { cellWidth: "auto", halign: "right" },
        6: { cellWidth: "auto", halign: "right" },
      },
      didParseCell: (data) => {
        // Color coding for balances
        if (data.column.dataKey === "balance") {
          const value = data.cell.raw;
          const numValue = parseFloat(value.replace(/,/g, ""));
          data.cell.styles.textColor =
            numValue < 0 ? [220, 53, 69] : [25, 135, 84];
        }
        // Color coding for debit/credit
        else if (data.column.dataKey === "debit" && data.cell.raw !== "-") {
          data.cell.styles.textColor = [220, 53, 69];
        } else if (data.column.dataKey === "credit" && data.cell.raw !== "-") {
          data.cell.styles.textColor = [25, 135, 84];
        }
      },
    });

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 60,
        doc.internal.pageSize.height - 40
      );
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()}`,
        40,
        doc.internal.pageSize.height - 40
      );
    }

    // Save the PDF
    doc.save("account_statement.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight animate-fade-in">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-green-500 to-purple-600">
              Account Statement
            </span>
          </h1>
          <p className="text-gray-600">
            View and filter your financial transactions
          </p>
        </div>

        {/* Filter Controls */}

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Account code or name..."
                  className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Date Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row gap-2 sm:items-end">
              <button
                onClick={() => {
                  setSearch("");
                  setFromDate("");
                  setToDate("");
                }}
                className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition hover:shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear
              </button>

              {journal.length > 0 && (
                <>
                  <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition hover:shadow-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition hover:shadow-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div
          ref={componentRef}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-600">Loading journal entries...</p>
              </div>
            ) : journal.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No journal entries found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                  <tr>
                    <th className="p-4 text-left font-semibold rounded-tl-lg">
                      Account Code
                    </th>
                    <th className="p-4 text-left font-semibold">
                      Account Name
                    </th>
                    <th className="p-4 text-left font-semibold">Date</th>
                    <th className="p-4 text-left font-semibold">Doc Type</th>
                    <th className="p-4 text-right font-semibold">Debit</th>
                    <th className="p-4 text-right font-semibold">Credit</th>
                    <th className="p-4 text-right font-semibold rounded-tr-lg">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {journal.map((entry, index) => {
                    const prevEntry = journal[index - 1];
                    const isNewAccount =
                      index === 0 ||
                      entry.account_code !== prevEntry.account_code;
                    const isDebit = entry.debit > 0;
                    const isCredit = entry.credit > 0;
                    const isOpeningBalance = entry.isOpeningBalance;

                    return (
                      <>
                        {isNewAccount && index !== 0 && (
                          <tr key={`gap-${index}`} className="h-12">
                            <td
                              colSpan="7"
                              className="border-b-4 border-gray-300"
                            ></td>
                          </tr>
                        )}
                        <tr
                          key={index}
                          className={`
                            ${
                              isOpeningBalance
                                ? "bg-blue-50 border-t-2 border-blue-200 font-semibold"
                                : ""
                            }
                            ${
                              isNewAccount && !isOpeningBalance
                                ? "border-t-2 border-gray-200 bg-gray-50"
                                : ""
                            }
                            ${
                              !isNewAccount && !isOpeningBalance
                                ? index % 2 === 0
                                  ? "bg-white"
                                  : "bg-gray-50"
                                : ""
                            }
                            border-t border-gray-100 hover:bg-blue-50 transition
                          `}
                        >
                          <td className="p-4 font-medium text-gray-900">
                            {entry.account_code}
                          </td>
                          <td className="p-4 text-gray-700">
                            {entry.account_name}
                          </td>
                          <td className="p-4 text-gray-600">
                            {isOpeningBalance
                              ? "Opening"
                              : new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 ${
                                isOpeningBalance
                                  ? "bg-blue-200 text-blue-800"
                                  : entry.doc_type === "PV" ||
                                    entry.doc_type === "PR"
                                  ? "bg-purple-100 text-purple-800"
                                  : entry.doc_type === "SV" ||
                                    entry.doc_type === "SR"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              } text-xs font-medium rounded`}
                            >
                              {entry.doc_type}
                            </span>
                          </td>
                          <td className="p-4 text-right font-medium">
                            {isDebit ? (
                              <span className="text-red-600">
                                {entry.debit.toLocaleString()}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-4 text-right font-medium">
                            {isCredit ? (
                              <span className="text-green-600">
                                {entry.credit.toLocaleString()}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-4 text-right font-medium">
                            <span
                              className={`${
                                entry.balance < 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {entry.balance.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {journal.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold text-gray-600">
                  Showing {journal.length} entries
                </div>
                <div className="text-sm text-gray-500">
                  {fromDate && toDate
                    ? `Period: ${new Date(
                        fromDate
                      ).toLocaleDateString()} to ${new Date(
                        toDate
                      ).toLocaleDateString()}`
                    : "Showing all records"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
