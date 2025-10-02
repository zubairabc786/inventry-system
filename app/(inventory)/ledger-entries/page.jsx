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
  const [selectedItem, setSelectedItem] = useState(null);
  const componentRef = useRef();

  // Fetch journal entries with debounce
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getJournalEntries1(search, fromDate, toDate);
        // Make sure we're using the correct property from the response
        setJournal(result.entries || result.result || []);
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

  // Handle click for item details
  const handleItemClick = (entry) => {
    if (entry.item_details && entry.item_details !== "-") {
      setSelectedItem(entry);
    }
  };
  console.log("selectedItem=", selectedItem);
  // Close modal
  const closeModal = () => {
    setSelectedItem(null);
  };

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
          font-size: 10px;
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
      { header: "Doc ID", dataKey: "doc_id" },
      { header: "Account Code", dataKey: "account_code" },
      { header: "Account Name", dataKey: "account_name" },
      { header: "Date", dataKey: "date" },
      { header: "Doc Type", dataKey: "doc_type" },
      { header: "Items", dataKey: "item_details" },
      { header: "Remarks", dataKey: "remarks" },
      { header: "Debit", dataKey: "debit" },
      { header: "Credit", dataKey: "credit" },
      { header: "Balance", dataKey: "balance" },
      { header: "Type", dataKey: "type" },
    ];

    // Prepare table data
    const rows = journal.map((entry) => ({
      doc_id: entry.doc_id || "-",
      account_code: entry.account_code,
      account_name: entry.account_name,
      date: entry.isOpeningBalance
        ? "Opening"
        : new Date(entry.date).toLocaleDateString(),
      doc_type: entry.doc_type,
      item_details: entry.item_details || "-",
      remarks: entry.remarks || "",
      debit: entry.debit > 0 ? entry.debit.toLocaleString() : "-",
      credit: entry.credit > 0 ? entry.credit.toLocaleString() : "-",
      balance: entry.balance.toLocaleString(),
      type: entry.balance < 0 ? "CR" : "DB",
    }));

    // Add the table to PDF
    autoTable(doc, {
      columns: columns,
      body: rows,
      startY: 80,
      styles: {
        fontSize: 7,
        cellPadding: 4,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 40, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: "auto" },
        3: { cellWidth: "auto" },
        4: { cellWidth: "auto" },
        5: { cellWidth: 100, halign: "left" },
        6: { cellWidth: "auto" },
        7: { cellWidth: "auto", halign: "right" },
        8: { cellWidth: "auto", halign: "right" },
        9: { cellWidth: "auto", halign: "right" },
        10: { cellWidth: "auto", halign: "center" },
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
        // Color coding for type column
        else if (data.column.dataKey === "type") {
          data.cell.styles.textColor =
            data.cell.raw === "CR" ? [220, 53, 69] : [25, 135, 84];
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
            Account Statement
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            View and filter your financial transactions
          </p>
        </div>
        {/* Filter Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 极 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-极.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="lg:极-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      d="M21 21l-6-6m2-5a7 7 极 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Account code, name, or items..."
                  className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                />
              </div>
            </div>

            {/* Date Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row gap-3 sm:items-end">
              <button
                onClick={() => {
                  setSearch("");
                  setFromDate("");
                  setToDate("");
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all hover:shadow-md"
              >
                <svg
                  className="w-5 h-5"
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
                    className="flex-极 flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-4 rounded-xl transition-all hover:shadow-md"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2极4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-3 px-4 rounded-xl transition-all hover:shadow-md"
                  >
                    <svg
                      className="w-5 h-5"
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
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        >
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-极 text-lg">
                  Loading journal entries...
                </p>
              </div>
            ) : journal.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 极 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-600 text-lg">
                  No journal entries found
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <tr>
                    <th className="p-3 text-left font-semibold rounded-tl-lg">
                      Doc ID
                    </th>
                    <th className="p-3 text-left font-semibold">
                      Account Code
                    </th>
                    <th className="p-3 text-left font-semibold">
                      Account Name
                    </th>
                    <th className="p-3 text-left font-semibold">Date</th>
                    <th className="p-3 text-left font-semibold">Doc Type</th>
                    <th className="p-3 text-left font-semibold">Items</th>
                    <th className="p-3 text-left font-semibold">Remarks</th>
                    <th className="p-3 text-right font-semibold">Debit</th>
                    <th className="p-3 text-right font-semibold">Credit</th>
                    <th className="p-3 text-right font-semibold">Balance</th>
                    <th className="p-3 text-center font-semibold rounded-tr-lg">
                      Type
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
                    const type = entry.balance < 0 ? "CR" : "DB";

                    return (
                      <>
                        {isNewAccount && index !== 0 && (
                          <tr key={`gap-${index}`} className="h-4">
                            <td
                              colSpan="11"
                              className="border-b-4 border-gray-700"
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
                            border-t border-gray-100 hover:bg-blue-50 transition-all duration-200
                          `}
                        >
                          <td className="p-3 font-medium text-gray-900 text-center">
                            {entry.doc_id || "-"}
                          </td>
                          <td className="p-3 font-medium text-gray-900">
                            {entry.account_code}
                          </td>
                          <td className="p-3 text-gray-700">
                            {entry.account_name}
                          </td>
                          <td className="p-3 text-gray-600">
                            {isOpeningBalance
                              ? "Opening"
                              : new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
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
                              } text-xs font-medium rounded-full`}
                            >
                              {entry.doc_type}
                            </span>
                          </td>
                          <td
                            className="p-3 text-gray-600 text-xs max-w-xs truncate cursor-pointer transition-all hover:text-blue-600"
                            onClick={() => handleItemClick(entry)}
                          >
                            {entry.item_details || "-"}
                            {entry.item_details &&
                              entry.item_details !== "-" && (
                                <span className="ml-1 text-blue-500 inline-flex items-center">
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
                                      d="M15 12a3 3 0 11-6 极 3 3 0 016 0z"
                                    />
                                    <path
                                      stroke极cap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                </span>
                              )}
                          </td>
                          <td className="p-3 text-gray-600">{entry.remarks}</td>
                          <td className="p-3 text-right font-medium">
                            {isDebit ? (
                              <span className="text-red-600 font-semibold">
                                {entry.debit.toLocaleString()}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {isCredit ? (
                              <span className="text-green-600 font-semibold">
                                {entry.credit.toLocaleString()}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3 text-right font-medium">
                            <span
                              className={`${
                                entry.balance < 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              } font-semibold`}
                            >
                              {entry.balance.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3 text-center font-medium">
                            <span
                              className={`${
                                type === "CR"
                                  ? "text-red-600"
                                  : "text-green-600"
                              } font-bold`}
                            >
                              {type}
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
            <div className="px-6 py-4 bg-gray-50 border-t-4 border-red-700 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold text-gray-600">
                  Showing {journal.length} entries
                </div>
                <div className="text-sm text极-500">
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

        {/* Modal Popup for Item Details */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-4">
            <div className="bg-white rounded-2xl shadow-2xl w-11/12 max-w-4xl animate-fade-in-down">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Bill Details</h2>
                  <p className="text-blue-100 mt-1">
                    Document ID: {selectedItem.doc_id}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-10"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">
                      ACCOUNT INFORMATION
                    </h3>
                    <p className="text-lg font-medium">
                      {selectedItem.account_name}
                    </p>
                    <p className="text-gray-600">{selectedItem.account_code}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">
                      TRANSACTION DETAILS
                    </h3>
                    <p className="text-lg font-medium">
                      {new Date(selectedItem.date).toLocaleDateString()}
                    </p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        selectedItem.doc_type === "PV" ||
                        selectedItem.doc_type === "PR"
                          ? "bg-purple-100 text-purple-800"
                          : selectedItem.doc_type === "SV" ||
                            selectedItem.doc_type === "SR"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedItem.doc_type}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Items List
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                            Sr #
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                            Product Name
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                            Design Number
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.item_details &&
                        selectedItem.item_details !== "-" ? (
                          // Parse the item_details string to extract product name and design number
                          selectedItem.item_details
                            .split(", ")
                            .map((item, idx) => {
                              // Extract product name and design number from the item string
                              // Format: "Product Name - Design Number (Qty: X Price: Y Total: Z)"
                              const itemMatch = item.match(
                                /^([^-]+)(?:\s*-\s*([^(]+))?/
                              );
                              const productName = itemMatch
                                ? itemMatch[1].trim()
                                : item;
                              const designNumber =
                                itemMatch && itemMatch[2]
                                  ? itemMatch[2].trim()
                                  : "N/A";

                              return (
                                <tr
                                  key={idx}
                                  className="border-b border-gray-100 hover:bg-blue-50"
                                >
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {productName}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {designNumber}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td
                              colSpan="3"
                              className="px-4 py-8 text-center text-gray-500"
                            >
                              No item details available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">
                      REMARKS
                    </h3>
                    <p className="text-gray-700">
                      {selectedItem.remarks || "No remarks provided"}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">
                      AMOUNT SUMMARY
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Debit Amount:</span>
                        <span
                          className={
                            selectedItem.debit > 0
                              ? "text-red-600 font-bold text-lg"
                              : "text-gray-500"
                          }
                        >
                          {selectedItem.debit > 0
                            ? `Rs. ${selectedItem.debit.toLocaleString()}`
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Credit Amount:</span>
                        <span
                          className={
                            selectedItem.credit > 0
                              ? "text-green-600 font-bold text-lg"
                              : "text-gray-500"
                          }
                        >
                          {selectedItem.credit > 0
                            ? `Rs. ${selectedItem.credit.toLocaleString()}`
                            : "-"}
                        </span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-800 font-semibold">
                            Current Balance:
                          </span>
                          <span
                            className={
                              selectedItem.balance < 0
                                ? "text-red-600 font-bold text-xl"
                                : "text-green-600 font-bold text-xl"
                            }
                          >
                            Rs.{" "}
                            {Math.abs(selectedItem.balance).toLocaleString()}
                            <span className="text-sm ml-1">
                              ({selectedItem.balance < 0 ? "CR" : "DR"})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
                <button
                  onClick={() => {
                    // Print functionality for this specific bill
                    const printContent = document.createElement("div");
                    printContent.innerHTML = `
              <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="text-align: center; color: #2563eb; margin-bottom: 20px;">Bill Details - Document ID: ${
                  selectedItem.doc_id
                }</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                  <div>
                    <h3 style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">ACCOUNT INFORMATION</h3>
                    <p style="font-size: 16px; font-weight: bold; margin: 0;">${
                      selectedItem.account_name
                    }</p>
                    <p style="color: #6b7280; margin: 0;">${
                      selectedItem.account_code
                    }</p>
                  </div>
                  <div>
                    <h3 style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">TRANSACTION DETAILS</h3>
                    <p style="font-size: 16px; font-weight: bold; margin: 0;">${new Date(
                      selectedItem.date
                    ).toLocaleDateString()}</p>
                    <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${
                      selectedItem.doc_type
                    }</span>
                  </div>
                </div>
                ${
                  selectedItem.item_details && selectedItem.item_details !== "-"
                    ? `
                <h3 style="color: #374151; margin-bottom: 10px;">Items List</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <thead>
                    <tr style="background: #f3f4f6;">
                      <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Sr #</th>
                      <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Product Name</th>
                      <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Design Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${selectedItem.item_details
                      .split(", ")
                      .map((item, idx) => {
                        const itemMatch = item.match(
                          /^([^-]+)(?:\s*-\s*([^(]+))?/
                        );
                        const productName = itemMatch
                          ? itemMatch[1].trim()
                          : item;
                        const designNumber =
                          itemMatch && itemMatch[2]
                            ? itemMatch[2].trim()
                            : "N/A";
                        return `
                        <tr>
                          <td style="padding: 8px; border: 1px solid #d1d5db;">${
                            idx + 1
                          }</td>
                          <td style="padding: 8px; border: 1px solid #d1d5db;">${productName}</td>
                          <td style="padding: 8px; border: 1px solid #d1d5db;">${designNumber}</td>
                        </tr>
                      `;
                      })
                      .join("")}
                  </tbody>
                </table>
                `
                    : "<p>No item details available</p>"
                }
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div>
                    <h3 style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">REMARKS</h3>
                    <p>${selectedItem.remarks || "No remarks provided"}</p>
                  </div>
                  <div>
                    <h3 style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">AMOUNT SUMMARY</h3>
                    <p>Debit: ${
                      selectedItem.debit > 0
                        ? `Rs. ${selectedItem.debit.toLocaleString()}`
                        : "-"
                    }</p>
                    <p>Credit: ${
                      selectedItem.credit > 0
                        ? `Rs. ${selectedItem.credit.toLocaleString()}`
                        : "-"
                    }</p>
                    <p style="font-weight: bold; border-top: 1px solid #d1d5db; padding-top: 5px;">
                      Balance: Rs. ${Math.abs(
                        selectedItem.balance
                      ).toLocaleString()} (${
                      selectedItem.balance < 0 ? "CR" : "DR"
                    })
                    </p>
                  </div>
                </div>
              </div>
            `;
                    const printWindow = window.open("", "_blank");
                    printWindow.document.write(`
              <html>
                <head>
                  <title>Bill Details - ${selectedItem.doc_id}</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                  </style>
                </head>
                <body>${printContent.innerHTML}</body>
              </html>
            `);
                    printWindow.document.close();
                    printWindow.print();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Print Bill
                </button>
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
