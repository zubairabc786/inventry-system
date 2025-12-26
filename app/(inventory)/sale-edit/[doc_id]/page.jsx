"use client";

import { useEffect, useRef, useState } from "react";
import {
  getDropdownStockData,
  getSaleByDocId,
  updateSaleSheet,
} from "../../../action/action";
import COAList from "../../components/COAList";

export default function UpdateSalePage({ params }) {
  const barcodeInputRef = useRef(null);

  const [coaList, setCoaList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [items, setItems] = useState([]);
  const [dated, setDated] = useState("");
  const [purchase_code, setPurchaseCode] = useState("");
  const [sale_man, setSaleMan] = useState("");
  const [cash, setCash] = useState("");
  const [jazz_cash, setJazzCash] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ============================
     LOAD INITIAL DATA
  ============================ */
  useEffect(() => {
    getDropdownStockData().then(({ coaList, productList }) => {
      setCoaList(coaList);
      setProductList(productList);
    });

    async function loadSale() {
      const sale = await getSaleByDocId(params.doc_id);

      setPurchaseCode(sale.purchase_code);
      setSaleMan(sale.sale_man || "");
      setCash(sale.cash || "");
      setJazzCash(sale.jazz_cash || "");
      setDated(sale.dated.toISOString().split("T")[0]);

      setItems(
        sale.Purchase.map((p) => ({
          product_code: p.product_code,
          product_name: p.Product?.product_name || "",
          product_type: p.Product?.product_type || "",
          quantity: p.quantity,
          price: p.price,
          ext_price: p.ext_price || p.Product?.ext_price || 0,
          remarks: p.remarks || "",
        }))
      );
    }

    loadSale();
  }, []);

  /* ============================
     TOTALS
  ============================ */
  const subtotal = items.reduce((s, p) => s + p.quantity * p.price, 0);

  const discountAmount =
    discountValue && discountType === "percentage"
      ? (subtotal * parseFloat(discountValue)) / 100
      : parseFloat(discountValue || 0);

  const finalAmount = Math.max(0, subtotal - discountAmount);
  const totalPaid = (parseFloat(cash) || 0) + (parseFloat(jazz_cash) || 0);
  const balanceDue = finalAmount - totalPaid;

  /* ============================
     ITEM UPDATE
  ============================ */
  function updateItem(index, field, value) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems([
      ...items,
      {
        product_code: "",
        product_name: "",
        product_type: "",
        quantity: 1,
        price: 0,
        remarks: "",
      },
    ]);
  }

  /* ============================
     UPDATE SUBMIT
  ============================ */
  async function handleUpdate(e) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("doc_id", params.doc_id);
    formData.append("purchase_or_sale_account", "20010004");
    formData.append("purchase_code", purchase_code);
    formData.append("dated", dated);
    formData.append("bill_amount", finalAmount.toString());
    formData.append("sale_man", sale_man);
    formData.append("cash", cash);
    formData.append("jazz_cash", jazz_cash);
    formData.append("calculated_discount", discountValue || "0");
    formData.append("items", JSON.stringify(items));

    const result = await updateSaleSheet(formData);

    if (result.success) {
      alert("Sale updated successfully");
    } else {
      alert(result.message);
    }

    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <form
        onSubmit={handleUpdate}
        className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Update Sales Invoice</h1>
              <p className="text-emerald-100 opacity-90">
                Document ID:{" "}
                <span className="font-mono font-semibold">{params.doc_id}</span>
              </p>
            </div>
            <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <p className="text-sm text-emerald-50">Total Amount</p>
              <p className="text-2xl font-bold">Rs. {finalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Invoice Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Customer *
                </label>
                <div className="relative">
                  <COAList
                    coaList={coaList}
                    value={purchase_code}
                    onAccountSelect={(acc) => setPurchaseCode(acc.account_code)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  value={dated}
                  onChange={(e) => setDated(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Salesperson
                </label>
                <input
                  type="text"
                  value={sale_man}
                  onChange={(e) => setSaleMan(e.target.value)}
                  placeholder="Enter salesperson name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Discount
                </label>
                <div className="flex space-x-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Rs.</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                Products & Items
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="mt-4 md:mt-0 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center transition-colors duration-200 shadow-sm"
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
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Type/Size
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Ext_Price
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {item.product_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            Code: {item.product_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          value={item.product_type}
                          onChange={(e) =>
                            updateItem(i, "product_type", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Type/Size"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              i,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="1"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1">
                          {/* <span className="text-gray-500">Rs.</span> */}
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(
                                i,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            step="0.01"
                            min="0"
                            className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1">
                          {/* <span className="text-gray-500">Rs.</span> */}
                          <input
                            type="number"
                            value={item.ext_price}
                            onChange={(e) =>
                              updateItem(
                                i,
                                "ext_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            step="0.01"
                            min="0"
                            className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-emerald-700">
                          Rs. {(item.quantity * item.price).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors duration-200 flex items-center space-x-1"
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
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="mt-4 text-gray-500">
                  No items added. Click "Add Item" to start.
                </p>
              </div>
            )}
          </div>

          {/* Payment & Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Information */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Payment Details
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Cash Payment (Rs.)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">
                      Rs.
                    </span>
                    <input
                      type="number"
                      value={cash}
                      onChange={(e) => setCash(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    JazzCash Payment (Rs.)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">
                      Rs.
                    </span>
                    <input
                      type="number"
                      value={jazz_cash}
                      onChange={(e) => setJazzCash(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-purple-200">
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                    <span className="text-gray-700">Total Paid:</span>
                    <span className="text-xl font-bold text-purple-700">
                      Rs. {totalPaid.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Invoice Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 px-4 bg-white/50 rounded-lg">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-800">
                    Rs. {subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 px-4 bg-white/50 rounded-lg">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-semibold text-red-600">
                    - Rs. {discountAmount.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-gray-300 pt-4 mt-4">
                  <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold">
                      Rs. {finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <div
                    className={`flex justify-between items-center py-4 px-4 rounded-lg ${
                      balanceDue > 0
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-emerald-50 border border-emerald-200"
                    }`}
                  >
                    <span
                      className={`text-lg font-semibold ${
                        balanceDue > 0 ? "text-yellow-800" : "text-emerald-800"
                      }`}
                    >
                      {balanceDue > 0 ? "Balance Due" : "Fully Paid"}
                    </span>
                    <span
                      className={`text-2xl font-bold ${
                        balanceDue > 0 ? "text-yellow-700" : "text-emerald-700"
                      }`}
                    >
                      Rs. {Math.abs(balanceDue).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
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
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full sm:w-auto px-10 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Updating Invoice...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Update Sales Invoice</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
