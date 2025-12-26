"use client";
import { useEffect, useState } from "react";
import {
  getSaleBillData,
  getInventMasterSaleData,
  getJournalEntries1,
  deletePurchaseSheet,
} from "../../action/action";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useRouter } from "next/navigation";
import SaleIdList from "../components/SaleIdList";

export default function SaleDetail() {
  const router = useRouter();
  const [showBill, setShowBill] = useState(false);
  const [saleBillData, setSaleBillData] = useState(null);
  const [searchDocId, setSearchDocId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [partyBalance, setPartyBalance] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inventMasterSaleData, setInventMasterSaleData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getInventMasterSaleData();
        setInventMasterSaleData(result);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchData();
  }, []);

  // console.log("InventMasterSaleData=", inventMasterSaleData);

  const handleSearch = async () => {
    if (!searchDocId) {
      setError("Please enter a Document ID");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const billData = await getSaleBillData(searchDocId);

      if (billData.error) {
        setError(billData.error);
        setShowBill(false);
      } else {
        setSaleBillData(billData);
        setShowBill(true);

        // Get party balance information
        try {
          const journalData = await getJournalEntries1(
            billData.purchase_code,
            null,
            billData.dated
          );

          if (journalData.partyBalances && billData.purchase_code) {
            setPartyBalance(
              journalData.partyBalances[billData.purchase_code] || 0
            );
          }
        } catch (err) {
          setPartyBalance(0);
        }
      }
    } catch (err) {
      setError("Failed to fetch Sale data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    if (!saleBillData || !saleBillData.doc_id) {
      setError("No document selected for update");
      return;
    }
    router.push(`/sale-edit/${saleBillData.doc_id}`);
  };

  const handleDelete = async () => {
    if (!saleBillData || !saleBillData.doc_id) {
      setError("No document selected for deletion");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this sale sheet? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePurchaseSheet(saleBillData.doc_id);

      if (result.success) {
        alert("Sale sheet deleted successfully!");
        setShowBill(false);
        setSaleBillData(null);
        setSearchDocId("");
      } else {
        alert("Failed to delete sale sheet: " + result.error);
      }
    } catch (error) {
      alert("Something went wrong while deleting the sale sheet.");
    } finally {
      setIsDeleting(false);
    }
  };

  //   // Thermal Printer Bill (80mm width)
  // Thermal Printer Bill (80mm width)
  const generateThermalBill = () => {
    if (!saleBillData) return;

    let billContent = `
    ================================
            NAVEED FABRICS
    ================================
    Shop #8, Near Saqib Center
    Factory Area, Faisalabad
    Phone: 0320-2211010
    ================================
    SALE INVOICE
    ================================
    Invoice #: ${saleBillData.doc_id}
    Date: ${new Date(saleBillData.dated).toLocaleDateString()}
    Customer: ${saleBillData.coa?.account_name || saleBillData.purchase_code}
    Salesperson: ${saleBillData.sale_man || "N/A"}
    ================================
    ITEMS
    ================================
    `;

    // Add column headers with proper spacing
    billContent += `
Sr# Name                Price    Qty    Total
--------------------------------------------------
`;

    // Add items with formatted columns
    saleBillData.items.forEach((item, index) => {
      const itemName = item.Product?.product_name || item.product_code || "N/A";
      // Truncate name to fit column width
      const truncatedName =
        itemName.length > 15
          ? itemName.substring(0, 12) + "..."
          : itemName.padEnd(15, " ");

      const sr = (index + 1).toString().padEnd(3, " ");
      const price = `Rs.${item.price.toFixed(2)}`.padEnd(10, " ");
      const quantity = item.quantity.toString().padStart(3, " ");
      const total = `Rs.${(item.quantity * item.price).toFixed(2)}`.padStart(
        10,
        " "
      );

      billContent += `${sr} ${truncatedName} ${price} ${quantity} ${total}\n`;
    });

    // Calculations
    const subtotal = saleBillData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const discountAmount = saleBillData.calculated_discount || 0;
    const cashAmount = saleBillData.cash || 0;
    const jazzCashAmount = saleBillData.jazz_cash || 0;
    const totalPayments = cashAmount + jazzCashAmount;
    const balanceDue =
      subtotal + Math.abs(partyBalance || 0) - discountAmount - totalPayments;

    billContent += `
    ================================
    SUBTOTAL:      Rs.${subtotal.toFixed(2).padStart(10, " ")}
    DISCOUNT:      -Rs.${discountAmount.toFixed(2).padStart(10, " ")}
    `;

    if (partyBalance !== null) {
      billContent += `PARTY BALANCE: Rs.${Math.abs(partyBalance)
        .toFixed(2)
        .padStart(8, " ")} ${partyBalance >= 0 ? "(Cr)" : "(Dr)"}
    `;
    }

    billContent += `
    ================================
    TOTAL AMOUNT:  Rs.${(
      subtotal -
      discountAmount +
      Math.abs(partyBalance || 0)
    )
      .toFixed(2)
      .padStart(8, " ")}
    `;

    if (cashAmount > 0) {
      billContent += `CASH PAYMENT:  -Rs.${cashAmount
        .toFixed(2)
        .padStart(10, " ")}
    `;
    }

    if (jazzCashAmount > 0) {
      billContent += `JAZZ CASH:     -Rs.${jazzCashAmount
        .toFixed(2)
        .padStart(10, " ")}
    `;
    }

    billContent += `
    ================================
    BALANCE DUE:   Rs.${balanceDue.toFixed(2).padStart(10, " ")}
    ================================
    Thank you for your business!
    --------------------------------
    `;

    // Open print window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sale Bill - ${saleBillData.doc_id}</title>
        <style>
          @media print {
            body {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              width: 80mm;
              margin: 0;
              padding: 5px;
            }
            .thermal-bill {
              width: 100%;
              max-width: 80mm;
              line-height: 1.2;
              white-space: pre;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-bold { font-weight: bold; }
            .border-top { border-top: 1px dashed #000; }
            .border-bottom { border-bottom: 1px dashed #000; }
          }
        </style>
      </head>
      <body onload="window.print();window.close()">
        <div class="thermal-bill">
          <pre>${billContent}</pre>
        </div>
      </body>
      </html>
    `);
      printWindow.document.close();
    }
  };

  // Regular PDF for download
  const downloadPDF = () => {
    if (!saleBillData) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(46, 125, 50); // Green color
    doc.text("NAVEED FABRICS", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text("Shop #8, Near Saqib Center", 105, 22, { align: "center" });
    doc.text("Factory Area, Faisalabad | Phone: 0320-2211010", 105, 27, {
      align: "center",
    });

    // Invoice Details
    doc.setDrawColor(46, 125, 50);
    doc.line(10, 32, 200, 32);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SALE INVOICE", 105, 40, { align: "center" });

    // Bill Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #: ${saleBillData.doc_id}`, 20, 50);
    doc.text(
      `Date: ${new Date(saleBillData.dated).toLocaleDateString()}`,
      20,
      56
    );
    doc.text(
      `Customer: ${
        saleBillData.coa?.account_name || saleBillData.purchase_code
      }`,
      20,
      62
    );
    if (saleBillData.sale_man) {
      doc.text(`Salesperson: ${saleBillData.sale_man}`, 20, 68);
    }

    // Table
    const tableColumn = ["Sr#", "Product", "Qty", "Price", "Total"];
    const tableRows = [];

    saleBillData.items.forEach((item, index) => {
      const itemName = item.Product?.product_name || item.product_code || "N/A";
      tableRows.push([
        index + 1,
        itemName,
        item.quantity,
        `Rs.${item.price.toFixed(2)}`,
        `Rs.${(item.quantity * item.price).toFixed(2)}`,
      ]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: "grid",
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 80, halign: "left" },
        2: { cellWidth: 20 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Calculations
    const subtotal = saleBillData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const discountAmount = saleBillData.calculated_discount || 0;
    const cashAmount = saleBillData.cash || 0;
    const jazzCashAmount = saleBillData.jazz_cash || 0;
    const balanceDue =
      subtotal +
      Math.abs(partyBalance || 0) -
      discountAmount -
      (cashAmount + jazzCashAmount);

    // Summary
    doc.setFontSize(11);
    let summaryY = finalY;

    doc.text("Subtotal:", 140, summaryY);
    doc.text(`Rs.${subtotal.toFixed(2)}`, 180, summaryY, { align: "right" });
    summaryY += 7;

    if (discountAmount > 0) {
      doc.text("Discount:", 140, summaryY);
      doc.text(`-Rs.${discountAmount.toFixed(2)}`, 180, summaryY, {
        align: "right",
      });
      summaryY += 7;
    }

    if (partyBalance !== null) {
      doc.text("Party Balance:", 140, summaryY);
      doc.text(
        `Rs.${Math.abs(partyBalance).toFixed(2)} ${
          partyBalance >= 0 ? "(Cr)" : "(Dr)"
        }`,
        180,
        summaryY,
        { align: "right" }
      );
      summaryY += 7;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(140, summaryY, 200, summaryY);
    summaryY += 10;

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL AMOUNT:", 140, summaryY);
    doc.text(
      `Rs.${(subtotal - discountAmount + Math.abs(partyBalance || 0)).toFixed(
        2
      )}`,
      180,
      summaryY,
      { align: "right" }
    );
    summaryY += 10;

    if (cashAmount > 0 || jazzCashAmount > 0) {
      doc.setFont("helvetica", "normal");
      if (cashAmount > 0) {
        doc.text("Cash Payment:", 140, summaryY);
        doc.text(`-Rs.${cashAmount.toFixed(2)}`, 180, summaryY, {
          align: "right",
        });
        summaryY += 7;
      }
      if (jazzCashAmount > 0) {
        doc.text("JazzCash:", 140, summaryY);
        doc.text(`-Rs.${jazzCashAmount.toFixed(2)}`, 180, summaryY, {
          align: "right",
        });
        summaryY += 7;
      }
      doc.line(140, summaryY, 200, summaryY);
      summaryY += 10;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(46, 125, 50);
    doc.text("BALANCE DUE:", 140, summaryY);
    doc.text(`Rs.${balanceDue.toFixed(2)}`, 180, summaryY, { align: "right" });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for your business!", 105, 280, { align: "center" });

    doc.save(`Sale-Bill-${saleBillData.doc_id}.pdf`);
  };

  const calculateBillValues = () => {
    if (!saleBillData) return {};

    const subtotal = saleBillData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const discountAmount = saleBillData.calculated_discount || 0;
    const cashAmount = saleBillData.cash || 0;
    const jazzCashAmount = saleBillData.jazz_cash || 0;
    const totalPayments = cashAmount + jazzCashAmount;
    const balanceDue =
      subtotal + Math.abs(partyBalance || 0) - discountAmount - totalPayments;

    return {
      subtotal,
      discountAmount,
      cashAmount,
      jazzCashAmount,
      totalPayments,
      balanceDue,
    };
  };

  const billValues = saleBillData ? calculateBillValues() : {};

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Search Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl shadow-xl p-8 mb-8 border border-emerald-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-xl mr-4">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Sale Details</h1>
              <p className="text-gray-600 mt-1">
                Find and manage your sale records
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sale Document ID
              </label>
              <SaleIdList
                coaList={inventMasterSaleData}
                onAccountSelect={(account) => setSearchDocId(account.doc_id)}
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Search Sale Bill
                  </span>
                )}
              </button>
            </div>
          </div>

          {showBill && saleBillData && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleUpdate}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Update Bill
                </button>

                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 flex items-center"
                >
                  {isDeleting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
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
                      Delete Bill
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bill Display */}
      {showBill && saleBillData && (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 text-white p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">NAVEED FABRICS</h1>
                <p className="text-emerald-100 text-lg">
                  Shop #8, Near Saqib Center, Factory Area, Faisalabad
                </p>
                <p className="text-emerald-100">
                  Phone: 0320-2211010 | Email: info@naveedfabrics.com
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center min-w-[200px]">
                <p className="text-emerald-100 text-sm mb-1">SALE INVOICE</p>
                <p className="text-2xl font-bold font-mono">
                  {saleBillData.doc_id}
                </p>
                <p className="text-emerald-100 text-sm mt-2">
                  {new Date(saleBillData.dated).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                Seller Information
              </h2>
              <div className="space-y-2">
                <p className="font-semibold text-blue-800 text-lg">
                  Naveed Fabrics
                </p>
                <p className="text-gray-600">M. Shakeel (Proprietor)</p>
                <p className="text-gray-600">Faisalabad, Pakistan</p>
                <p className="text-gray-600">GST: N/A</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                Customer Information
              </h2>
              <div className="space-y-2">
                <p className="font-semibold text-purple-800 text-lg">
                  {saleBillData.coa?.account_name || saleBillData.purchase_code}
                </p>
                {saleBillData.coa?.city && (
                  <p className="text-gray-600">City: {saleBillData.coa.city}</p>
                )}
                {saleBillData.coa?.contact_no && (
                  <p className="text-gray-600">
                    Contact: {saleBillData.coa.contact_no}
                  </p>
                )}
                {saleBillData.sale_man && (
                  <p className="text-gray-600">
                    Salesperson: {saleBillData.sale_man}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8">
            <div className="rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Sr#
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Qty
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Ext Price
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {saleBillData.items.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-t border-gray-100 hover:bg-emerald-50/50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-800 rounded-lg font-semibold">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.Product?.product_name || item.product_code}
                          </p>
                          {item.Product?.product_type && (
                            <p className="text-sm text-gray-500">
                              {item.Product.product_type}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-1">
                            Rs.
                          </span>
                          <span className="font-medium text-gray-800">
                            {item.price.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-1">
                            Rs.
                          </span>
                          <span className="font-medium text-gray-800">
                            {item.Product?.ext_price || item.ext_price}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-1">
                            Rs.
                          </span>
                          <span className="font-semibold text-emerald-700">
                            {(item.quantity * item.price).toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="p-8">
            <div className="max-w-md ml-auto">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">
                  Invoice Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-800">
                      Rs.{billValues.subtotal?.toFixed(2)}
                    </span>
                  </div>

                  {billValues.discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-semibold text-red-600">
                        -Rs.{billValues.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {partyBalance !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Party Balance</span>
                      <span
                        className={`font-semibold ${
                          partyBalance >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        Rs.{Math.abs(partyBalance).toFixed(2)}{" "}
                        {partyBalance >= 0 ? "(Cr)" : "(Dr)"}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold text-gray-700">
                        Total Amount
                      </span>
                      <span className="font-bold text-blue-700">
                        Rs.
                        {(
                          billValues.subtotal -
                          billValues.discountAmount +
                          Math.abs(partyBalance || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {(billValues.cashAmount > 0 ||
                    billValues.jazzCashAmount > 0) && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold text-gray-700 mb-3">
                        Payments
                      </h4>
                      {billValues.cashAmount > 0 && (
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-gray-600">Cash</span>
                          <span className="font-medium text-green-700">
                            -Rs.{billValues.cashAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {billValues.jazzCashAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">JazzCash</span>
                          <span className="font-medium text-green-700">
                            -Rs.{billValues.jazzCashAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t-2 border-gray-300 pt-6 mt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-800">
                        Balance Due
                      </span>
                      <span className="text-2xl font-bold text-emerald-700">
                        Rs.{billValues.balanceDue?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-8 bg-gradient-to-r from-emerald-50 to-green-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center text-gray-600">
                <svg
                  className="w-6 h-6 mr-2 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="font-medium">
                  Thank you for choosing Naveed Fabrics!
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={generateThermalBill}
                  className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z"
                    />
                  </svg>
                  Print Thermal Bill
                </button>

                <button
                  onClick={downloadPDF}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </button>

                <button
                  onClick={() => setShowBill(false)}
                  className="px-6 py-3 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
