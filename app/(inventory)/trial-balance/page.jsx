"use client";
import { useEffect, useState, useRef } from "react";
import { getTrialBalance } from "../../action/action";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TrialBalance() {
  const [trialBalance, setTrialBalance] = useState([]);
  const [totals, setTotals] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const componentRef = useRef();

  const fetchTrialBalance = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getTrialBalance();

      if (result.success) {
        setTrialBalance(result.data);
        setTotals(result.totals);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch trial balance");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, []);

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
        .trial-balance-table {
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
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
    });

    // Add title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Trial Balance", 40, 40);

    // Add date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`As of: ${new Date().toLocaleDateString()}`, 40, 60);

    // Prepare table data
    const columns = [
      { header: "Account Code", dataKey: "account_code" },
      { header: "Account Name", dataKey: "account_name" },
      { header: "Nature", dataKey: "account_nature" },
      { header: "Debit", dataKey: "debit" },
      { header: "Credit", dataKey: "credit" },
      { header: "Closing Balance", dataKey: "closing_balance" },
      { header: "Balance Type", dataKey: "balance_type" },
    ];

    const rows = trialBalance.map((account) => ({
      account_code: account.account_code,
      account_name: account.account_name,
      account_nature: account.account_nature.toUpperCase(),
      debit: account.debit.toLocaleString(),
      credit: account.credit.toLocaleString(),
      closing_balance: account.closing_balance.toLocaleString(),
      balance_type: account.balance_type,
    }));

    // Add totals row
    if (totals) {
      rows.push({
        account_code: "TOTAL",
        account_name: "",
        account_nature: "",
        debit: totals.total_debit.toLocaleString(),
        credit: totals.total_credit.toLocaleString(),
        closing_balance: "",
        balance_type: "",
      });
    }

    // Add the table to PDF
    autoTable(doc, {
      columns: columns,
      body: rows,
      startY: 80,
      styles: {
        fontSize: 8,
        cellPadding: 4,
        valign: "middle",
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      didParseCell: (data) => {
        if (data.row.index === rows.length - 1) {
          // Totals row
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // Add footer
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

    doc.save("trial_balance.pdf");
  };

  const getNatureColor = (nature) => {
    switch (nature) {
      case "asset":
        return "bg-blue-100 text-blue-800";
      case "payable":
        return "bg-green-100 text-green-800";
      case "receiveable":
        return "bg-purple-100 text-purple-800";
      case "revenue":
        return "bg-yellow-100 text-yellow-800";
      case "expense":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNatureLabel = (nature) => {
    switch (nature) {
      case "asset":
        return "Asset";
      case "payable":
        return "Payable";
      case "receiveable":
        return "Receivable";
      case "revenue":
        return "Revenue";
      case "expense":
        return "Expense";
      default:
        return nature;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
            Trial Balance
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Summary of all account closing balances
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
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
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Account Balances
              </h2>
              <p className="text-gray-600 mt-1">
                As of {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all hover:shadow-md"
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
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all hover:shadow-md"
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
                Export PDF
              </button>

              <button
                onClick={fetchTrialBalance}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all hover:shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div
          ref={componentRef}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
        >
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 text-lg">Loading trial balance...</p>
            </div>
          ) : trialBalance.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 text-lg">No account data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full trial-balance-table">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <tr>
                    <th className="p-4 text-left font-semibold">
                      Account Code
                    </th>
                    <th className="p-4 text-left font-semibold">
                      Account Name
                    </th>
                    <th className="p-4 text-left font-semibold">Nature</th>
                    <th className="p-4 text-right font-semibold">
                      Total Debit
                    </th>
                    <th className="p-4 text-right font-semibold">
                      Total Credit
                    </th>
                    <th className="p-4 text-right font-semibold">
                      Closing Balance
                    </th>
                    <th className="p-4 text-center font-semibold">
                      Balance Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.map((account, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50 hover:bg-blue-50"
                      }
                    >
                      <td className="p-4 font-mono text-sm text-gray-900 font-medium">
                        {account.account_code}
                      </td>
                      <td className="p-4 text-gray-700">
                        {account.account_name}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNatureColor(
                            account.account_nature
                          )}`}
                        >
                          {getNatureLabel(account.account_nature)}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-sm">
                        {formatCurrency(account.debit)}
                      </td>
                      <td className="p-4 text-right font-mono text-sm">
                        {formatCurrency(account.credit)}
                      </td>
                      <td className="p-4 text-right font-mono text-sm font-bold">
                        {formatCurrency(account.closing_balance)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            account.balance_type === "Debit"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {account.balance_type}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  {totals && (
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold border-t-4 border-gray-300">
                      <td className="p-4 text-gray-900" colSpan="3">
                        TOTAL
                      </td>
                      <td className="p-4 text-right font-mono text-lg text-blue-700">
                        {formatCurrency(totals.total_debit)}
                      </td>
                      <td className="p-4 text-right font-mono text-lg text-blue-700">
                        {formatCurrency(totals.total_credit)}
                      </td>
                      <td
                        className="p-4 text-right font-mono text-lg text-purple-700"
                        colSpan="2"
                      >
                        {formatCurrency(totals.total_closing_debit)} (Debit) /{" "}
                        {formatCurrency(totals.total_closing_credit)} (Credit)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Balance Check */}
              {totals && (
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <div
                    className={`p-4 rounded-lg text-center ${
                      Math.abs(
                        totals.total_closing_debit - totals.total_closing_credit
                      ) < 0.01
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <span className="font-semibold text-lg">
                      {Math.abs(
                        totals.total_closing_debit - totals.total_closing_credit
                      ) < 0.01
                        ? "✓ Trial Balance is Balanced"
                        : "✗ Trial Balance is Not Balanced"}
                    </span>
                    <span className="ml-2 text-sm">
                      (Difference:{" "}
                      {formatCurrency(
                        Math.abs(
                          totals.total_closing_debit -
                            totals.total_closing_credit
                        )
                      )}
                      )
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
