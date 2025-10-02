"use client";
import { useEffect, useState } from "react";
import {
  getPurchaseReturnBillData,
  getInventMasterPurchaseReturnId,
  getJournalEntries1,
  deletePurchaseSheet,
} from "../../action/action";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useRouter } from "next/navigation";
import PurchaseReturnIdList from "../components/PurchaseReturnIdList";

export default function PurchaseBillManager() {
  const router = useRouter();
  const [showBill, setShowBill] = useState(false);
  const [purchaseBillData, setPurchaseBillData] = useState(null);
  const [searchDocId, setSearchDocId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [partyBalance, setPartyBalance] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inventMasterPurchaseReturnData, setInventMasterPurchaseReturnData] =
    useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data...");
        const result = await getInventMasterPurchaseReturnId(); // Direct assignment
        console.log("Server result:", result);
        setInventMasterPurchaseReturnData(result);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      }
    };

    fetchData();
  }, []);
  // console.log("inventMasterData=", inventMasterData);

  const handleSearch = async () => {
    if (!searchDocId) {
      setError("Please enter a Document ID");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const billData = await getPurchaseReturnBillData(searchDocId);

      if (billData.error) {
        setError(billData.error);
        setShowBill(false);
      } else {
        setPurchaseBillData(billData);
        setShowBill(true);

        // Get party balance information
        try {
          // Get journal entries to find party balance
          const journalData = await getJournalEntries1(
            billData.purchase_code,
            null,
            billData.dated
          );

          // Find the party balance
          if (journalData.partyBalances && billData.purchase_code) {
            setPartyBalance(
              journalData.partyBalances[billData.purchase_code] || 0
            );
          }
        } catch (err) {
          console.error("Error fetching party balance:", err);
          setPartyBalance(0);
        }
      }
    } catch (err) {
      setError("Failed to fetch purchase return data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    if (!purchaseBillData || !purchaseBillData.doc_id) {
      setError("No document selected for update");
      return;
    }
    router.push(`/purchase-return-edit/${purchaseBillData.doc_id}`);
  };

  const handleDelete = async () => {
    if (!purchaseBillData || !purchaseBillData.doc_id) {
      setError("No document selected for deletion");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this purchase return sheet? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePurchaseSheet(purchaseBillData.doc_id);

      if (result.success) {
        alert("Purchase return sheet deleted successfully!");
        setShowBill(false);
        setPurchaseBillData(null);
        setSearchDocId("");
      } else {
        alert("Failed to delete purchase return sheet: " + result.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting the purchase return sheet.");
    } finally {
      setIsDeleting(false);
    }
  };

  ////////////////////////// Pdf bill generator for print

  const generatePDF = (shouldPrint = false) => {
    if (!purchaseBillData) return;

    const doc = new jsPDF();

    // Set document properties
    doc.setProperties({
      title: `Naveed Fabrics - ${purchaseBillData.doc_id}`,
      subject: "Purchase Return Invoice",
      author: "Naveed Fabrics",
      keywords: "purchase return, bill, invoice",
      creator: "Naveed Fabrics",
    });

    // Add company header with attractive styling
    doc.setFillColor(37, 99, 235); // Blue background
    doc.rect(0, 0, 210, 45, "F"); // Header background

    // Main heading
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont("helvetica", "bold");
    doc.text("Naveed Fabrics", 105, 18, { align: "center" });

    // Subheading
    doc.setFontSize(16);
    doc.text("Purchase Return BILL", 105, 28, { align: "center" });

    // Company details
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255); // Semi-transparent white
    doc.setFont("helvetica", "normal");
    doc.text(
      "Shop # 8. Near Saqib Center Factory Area Faisalabad. (041-2618884)",
      105,
      36,
      {
        align: "center",
      }
    );
    doc.setFontSize(12);
    doc.text(
      "M. Shakeel | 0320-2211010 | Email: info@naveedfabrics.com",
      105,
      42,
      {
        align: "center",
      }
    );

    // Document info section with background
    doc.setFillColor(245, 245, 245); // Light gray background
    doc.rect(10, 48, 190, 50, "F");

    doc.setDrawColor(200, 200, 200);
    doc.rect(10, 48, 190, 50); // Border around info section

    // Section title
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235); // Blue text
    doc.setFont("helvetica", "bold");
    doc.text("Bill Information", 15, 58);

    // Document details
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Document ID:", 20, 68);
    doc.text("Date:", 20, 75);
    doc.text("Supplier:", 20, 82);

    doc.setFont("helvetica", "normal");
    doc.text(`${purchaseBillData.doc_id}`, 60, 68);
    doc.text(
      `${new Date(purchaseBillData.dated).toLocaleDateString()}`,
      60,
      75
    );

    const supplierName =
      purchaseBillData.coa?.account_name || purchaseBillData.purchase_code;
    doc.text(`${supplierName}`, 60, 82);

    if (purchaseBillData.sale_man) {
      doc.setFont("helvetica", "bold");
      doc.text("Salesperson:", 20, 89);
      doc.setFont("helvetica", "normal");
      doc.text(`${purchaseBillData.sale_man}`, 60, 89);
    }

    // Prepare table data - match the display columns exactly
    const tableColumn = [
      "Sr #",
      "Product",
      "Design #",
      "Qty",
      "Price",
      "Total",
      "Remarks",
    ];
    const tableRows = [];

    purchaseBillData.items.forEach((item, index) => {
      const itemData = [
        index + 1,
        item.Product?.product_name || item.product_code,
        item.Product?.design_number || "-",
        item.quantity,
        `Rs.${item.price.toFixed(2)}`,
        `Rs.${(item.quantity * item.price).toFixed(2)}`,
        item.remarks || "-",
      ];
      tableRows.push(itemData);
    });

    // Add items table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 105,
      theme: "grid",
      styles: {
        fontSize: 8, // Smaller font to fit all columns
        cellPadding: 3,
        lineColor: [66, 139, 202],
        lineWidth: 0.1,
        valign: "middle",
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        halign: "center",
      },
      alternate极RowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 10 }, // Sr #
        1: { cellWidth: 30, halign: "left" }, // Product
        2: { cellWidth: 30 }, // Design #
        3: { cellWidth: 13 }, // Quantity
        4: { cellWidth: 25 }, // Price
        5: { cellWidth: 30 }, // Total
        6: { cellWidth: 52, halign: "left" }, // Remarks
      },
      margin: { left: 10, right: 10 },
    });

    // Calculate final Y position after the table
    const finalY = doc.lastAutoTable.finalY + 15;

    // Calculate values
    const subtotal = purchaseBillData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const discountAmount = purchaseBillData.calculated_discount || 0;
    const cashAmount = purchaseBillData.cash || 0;
    const jazzCashAmount = purchaseBillData.jazz_cash || 0;
    const totalPayments = cashAmount + jazzCashAmount;
    const balanceDue =
      subtotal + Math.abs(partyBalance || 0) - discountAmount - totalPayments;

    // Create a summary box with background
    doc.setFillColor(240, 240, 240);
    doc.rect(120, finalY, 80, 100, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(120, finalY, 80, 100);

    // Add totals section with proper spacing
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    let currentY = finalY + 5;

    // Subtotal
    doc.setFont("helvetica", "bold");
    doc.text("Subtotal:", 125, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`Rs.${subtotal.toFixed(2)}`, 185, currentY, { align: "right" });
    currentY += 8;

    // Discount
    if (discountAmount > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Discount:", 125, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(`-Rs.${discountAmount.toFixed(2)}`, 185, currentY, {
        align: "right",
      });
      currentY += 8;
    }

    // Party Balance
    if (partyBalance !== null) {
      doc.setFont("helvetica", "bold");
      doc.text("Party Balance:", 125, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Rs.${Math.abs(partyBalance).toFixed(2)} ${
          partyBalance >= 0 ? "(Cr)" : "(Dr)"
        }`,
        185,
        currentY,
        { align: "right" }
      );
      currentY += 8;
    }

    // Total before payments
    const totalBeforePayments =
      subtotal - discountAmount + Math.abs(partyBalance || 0);
    doc.setDrawColor(150, 150, 150);
    doc.line(125, currentY - 2, 195, currentY - 2);

    doc.setFont("helvetica", "bold");
    doc.text("Total Amount:", 125, currentY + 5);
    doc.text(`Rs.${totalBeforePayments.toFixed(2)}`, 185, currentY + 5, {
      align: "right",
    });
    currentY += 15;

    // Payments section
    doc.setDrawColor(150, 150, 150);
    doc.line(125, currentY, 195, currentY);
    currentY += 5;

    doc.setFont("helvetica", "bold");
    doc.text("Payments:", 125, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    if (cashAmount > 0) {
      doc.text("Cash:", 125, currentY);
      doc.text(`-Rs.${cashAmount.toFixed(2)}`, 185, currentY, {
        align: "right",
      });
      currentY += 8;
    }

    if (jazzCashAmount > 0) {
      doc.text("JazzCash:", 125, currentY);
      doc.text(`-Rs.${jazzCashAmount.toFixed(2)}`, 185, currentY, {
        align: "right",
      });
      currentY += 8;
    }

    // Balance Due
    doc.setDrawColor(150, 150, 150);
    doc.line(125, currentY, 195, currentY);
    currentY += 8;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235); // Blue text
    doc.text("Balance Due:", 125, currentY);
    doc.text(`Rs.${balanceDue.toFixed(2)}`, 185, currentY, { align: "right" });

    // Add footer with company name
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text("Naveed Fabrics - Thank you for your business!", 105, 280, {
      align: "center",
    });

    // Add page border
    doc.setDrawColor(200, 200, 200);
    doc.rect(10, 10, 190, 280);

    if (shouldPrint) {
      // Open PDF in new tab for printing
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl);

      // Auto-print after a short delay
      setTimeout(() => {
        if (printWindow) {
          printWindow.print();
        }
      }, 500);
    } else {
      // Download the PDF
      doc.save(`Naveed-Fabrics-Purchase-Bill-${purchaseBillData.doc_id}.pdf`);
    }
  };

  const downloadPDF = () => {
    generatePDF(false);
  };

  const printBill = () => {
    generatePDF(true);
  };

  // Calculate values for display
  const calculateBillValues = () => {
    if (!purchaseBillData) return {};

    const subtotal = purchaseBillData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const discountAmount = purchaseBillData.calculated_discount || 0;
    const cashAmount = purchaseBillData.cash || 0;
    const jazzCashAmount = purchaseBillData.jazz_cash || 0;
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

  const billValues = purchaseBillData ? calculateBillValues() : {};

  return (
    <div className="w-3/4 mx-auto p-4">
      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Search Purchase Return Bill
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <label
              htmlFor="docId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Document ID
            </label>
            <PurchaseReturnIdList
              coaList={inventMasterPurchaseReturnData}
              onAccountSelect={(account) => setSearchDocId(account.doc_id)}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Searching...
                </>
              ) : (
                <>
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 极 7 0 0114 0z"
                    />
                  </svg>
                  Search Bill
                </>
              )}
            </button>
          </div>
        </div>

        {/* Update and Delete Buttons */}
        {showBill && purchaseBillData && (
          <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center transition-colors duration-200 shadow-md hover:shadow-lg"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Update Bill
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Deleting...
                </>
              ) : (
                <>
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Bill
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bill Display */}
      {showBill && purchaseBillData && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold">Naveed Fabrics</h1>
                <p className="text-blue-100 mt-1">
                  Shop # 8. Near Saqib Center Factory Area Faisalabad.
                  (041-2618884)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Document ID</p>
                <p className="font-mono text-lg font-semibold bg-white bg-opacity-10 px-3 py-1 rounded-md">
                  {purchaseBillData.doc_id}
                </p>
              </div>
            </div>
          </div>

          {/* Company & Client Info */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semib极 text-gray-800 mb-2 flex items-center">
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2极16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9"
                  />
                </svg>
                From
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="font-bold text-blue-800">
                  Naveed Fabrics Faisalabad
                </p>
                <p className="text-sm text-gray-600 mt-1">M. Shakeel</p>
                <p className="text-sm text-gray-600">City:- Faisalabad</p>
                <p className="text-sm text-gray-600">Phone: (0320) 221-1010</p>
                <p className="text-sm text-gray-600">
                  Email: company@example.com
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-purple-600"
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
                Bill To
              </h2>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="font-bold text-purple-800">
                  {purchaseBillData.coa?.account_name ||
                    purchaseBillData.purchase_code}
                </p>
                {purchaseBillData.coa?.city && (
                  <p className="text-sm text-gray-600 mt-1">
                    City: {purchaseBillData.coa.city}
                  </p>
                )}
                {purchaseBillData.coa?.contact_no && (
                  <p className="text-sm text-gray-600">
                    Contact: {purchaseBillData.coa.contact_no}
                  </p>
                )}
                {purchaseBillData.coa?.address && (
                  <p className="text-sm text-gray-600">
                    Address: {purchaseBillData.coa.address}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  Date: {new Date(purchaseBillData.dated).toLocaleDateString()}
                </p>
                {purchaseBillData.sale_man && (
                  <p className="text-sm text-gray-600">
                    Salesperson: {purchaseBillData.sale_man}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-6">
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Sr #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Design #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseBillData.items.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 transition-colors duration-150 hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 border-r border-gray-100">
                        <div>
                          <p className="font-medium text-gray-800">{++index}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.Product?.product_name || item.product_code}
                          </p>
                          {item.Product?.product_code && (
                            <p className="text-xs text-gray-500 mt-1">
                              Code: {item.Product?.product_code}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.Product?.design_number}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-100">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-medium">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-1">
                            Rs.
                          </span>
                          <span className="font-medium text-gray-800">
                            {item.price.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-100">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-1">
                            Rs.
                          </span>
                          <span className="font-semibold text-blue-700">
                            {(item.quantity * item.price).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                          {item.remarks || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
            <div className="max-w-md ml-auto space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Subtotal:</span>
                <span className="font-semibold text-gray-800">
                  Rs.{billValues.subtotal?.toFixed(2) || "0.00"}
                </span>
              </div>

              {/* Party Balance */}
              {partyBalance !== null && (
                <div className="flex justify-between items-center py-2 border-t border-gray-200 pt-3">
                  <span className="text-gray-600 font-medium">
                    {partyBalance >= 0
                      ? "Party Credit Balance:"
                      : "Party Debit Balance:"}
                  </span>
                  <span
                    className={`font-semibold ${
                      partyBalance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {partyBalance >= 0 ? "Rs." : "-Rs."}
                    {Math.abs(partyBalance).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Total Amount */}
              <div className="flex justify-between items-center py-2 border-t border-gray-200 pt-3">
                <span className="text-lg font-semibold text-gray-800">
                  Total Amount:
                </span>
                <span className="text-lg font-bold text-blue-700">
                  Rs.
                  {(billValues.subtotal + Math.abs(partyBalance || 0)).toFixed(
                    2
                  )}
                </span>
              </div>

              {/* Payments Section */}
              {(billValues.cashAmount > 0 || billValues.jazzCashAmount > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Payments
                  </h3>

                  {billValues.cashAmount > 0 && (
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-600">Cash Payment:</span>
                      <span className="font-medium text-green-700">
                        -Rs.{billValues.cashAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {billValues.jazzCashAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">JazzCash Payment:</span>
                      <span className="font-medium text-green-700">
                        -Rs.{billValues.jazzCashAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Balance Due */}
              <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 pt-4 mt-2">
                <span className="text-xl font-bold text-gray-800">
                  Balance Due:
                </span>
                <span className="text-xl font-bold text-blue-700 bg-blue-100 px-4 py-2 rounded-lg">
                  Rs.{billValues.balanceDue?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200 flex flex-wrap gap-4 justify-between items-center">
            <p className="text-sm text-gray-600 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0极"
                />
              </svg>
              Thank you for your business!
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadPDF}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center transition-colors duration-200 shadow-md hover:shadow-lg"
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
                onClick={printBill}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors duration-200 shadow-md hover:shadow-lg"
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
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2极2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z"
                  />
                </svg>
                Print Bill
              </button>
              <button
                onClick={() => setShowBill(false)}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
