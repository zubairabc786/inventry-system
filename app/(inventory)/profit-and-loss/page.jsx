"use client";
import { useEffect, useState, useRef } from "react";
import { getProfitAndLoss } from "../../action/action";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ProfitAndLoss() {
  const [profitLossData, setProfitLossData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const componentRef = useRef();

  const fetchProfitLoss = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getProfitAndLoss();

      if (result.success) {
        setProfitLossData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch profit and loss statement");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, []);

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `,
  });

  // PDF export functionality
  const exportToPDF = () => {
    if (!profitLossData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("PROFIT AND LOSS STATEMENT", pageWidth / 2, 20, {
      align: "center",
    });

    // Add date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `As of: ${profitLossData.generated_date.toLocaleDateString()}`,
      pageWidth / 2,
      30,
      { align: "center" }
    );

    let startY = 45;

    // Revenues Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94); // Green
    doc.text("REVENUES", 20, startY);

    if (profitLossData.revenues.length > 0) {
      const revenueRows = profitLossData.revenues.map((acc) => [
        acc.account_name,
        formatCurrency(acc.amount),
      ]);

      // Add total revenue
      revenueRows.push([
        "TOTAL REVENUE",
        formatCurrency(profitLossData.summary.total_revenue),
      ]);

      autoTable(doc, {
        head: [["Revenue Account", "Amount"]],
        body: revenueRows,
        startY: startY + 5,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          1: { halign: "right" },
        },
        didParseCell: (data) => {
          if (data.row.index === profitLossData.revenues.length) {
            data.cell.styles.fillColor = [240, 253, 244];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [34, 197, 94];
          }
        },
      });

      startY = doc.lastAutoTable.finalY + 10;
    }

    // Expenses Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(239, 68, 68); // Red
    doc.text("EXPENSES", 20, startY);

    if (profitLossData.expenses.length > 0) {
      const expenseRows = profitLossData.expenses.map((acc) => [
        acc.account_name,
        formatCurrency(acc.amount),
      ]);

      // Add total expenses
      expenseRows.push([
        "TOTAL EXPENSES",
        formatCurrency(profitLossData.summary.total_expenses),
      ]);

      autoTable(doc, {
        head: [["Expense Account", "Amount"]],
        body: expenseRows,
        startY: startY + 5,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [239, 68, 68],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          1: { halign: "right" },
        },
        didParseCell: (data) => {
          if (data.row.index === profitLossData.expenses.length) {
            data.cell.styles.fillColor = [254, 242, 242];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [239, 68, 68];
          }
        },
      });

      startY = doc.lastAutoTable.finalY + 15;
    }

    // Net Profit/Loss Section
    const netAmount = profitLossData.summary.net_profit;
    const isProfit = netAmount >= 0;
    const titleText = isProfit ? "NET PROFIT" : "NET LOST";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    // doc.setTextColor([239, 68, 68]);
    doc.text(
      `${titleText}: ${formatCurrency(netAmount)}`,
      pageWidth / 2,
      startY + 10,
      { align: "center" }
    );

    doc.save("profit_loss_statement.pdf");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to get net profit/loss display
  const getNetProfitDisplay = () => {
    if (!profitLossData) return { title: "", amount: 0, isProfit: true };

    const netAmount = profitLossData.summary.net_profit;
    const isProfit = netAmount >= 0;
    const title = isProfit ? "NET PROFIT" : "NET LOST";

    return { title, amount: netAmount, isProfit };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading profit and loss statement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button
              onClick={fetchProfitLoss}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const netDisplay = getNetProfitDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Profit and Loss Statement
          </h1>
          <p className="text-gray-600 mt-2">
            As of {profitLossData.generated_date.toLocaleDateString()}
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={fetchProfitLoss}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Data
          </button>
        </div>

        {/* Profit and Loss Statement */}
        <div
          ref={componentRef}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Revenues Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-green-600 mb-4">REVENUES</h2>
            <div className="space-y-3">
              {profitLossData.revenues.length > 0 ? (
                <>
                  {profitLossData.revenues.map((revenue, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-gray-100"
                    >
                      <span className="text-gray-700">
                        {revenue.account_name}
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(revenue.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-3 border-t-2 border-green-200 mt-2">
                    <span className="font-bold text-lg">Total Revenue</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(profitLossData.summary.total_revenue)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No revenue data available
                </p>
              )}
            </div>
          </div>

          {/* Expenses Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-red-600 mb-4">EXPENSES</h2>
            <div className="space-y-3">
              {profitLossData.expenses.length > 0 ? (
                <>
                  {profitLossData.expenses.map((expense, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-gray-100"
                    >
                      <span className="text-gray-700">
                        {expense.account_name}
                      </span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-3 border-t-2 border-red-200 mt-2">
                    <span className="font-bold text-lg">Total Expenses</span>
                    <span className="font-bold text-lg text-red-600">
                      {formatCurrency(profitLossData.summary.total_expenses)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No expense data available
                </p>
              )}
            </div>
          </div>

          {/* Net Profit/Loss Section */}
          <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
            <div
              className={`text-center p-6 rounded-lg border-2 ${
                netDisplay.isProfit
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }`}
            >
              <div className="text-2xl font-bold mb-2">{netDisplay.title}</div>
              <div
                className={`text-4xl font-bold ${
                  netDisplay.isProfit ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(netDisplay.amount)}
              </div>
              <div className="text-sm mt-2 opacity-75">
                Calculated using direct method from account balances
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
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
            Print Report
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
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
        </div>
      </div>
    </div>
  );
}
