"use client";
import { useEffect, useState } from "react";
import { createPurchaseSheet, getDropdownData } from "../../action/action";
import Link from "next/link";

export default function SalePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [items, setItems] = useState([
    {
      product_code: "",
      quantity: 0,
      price: 0,
      remarks: "",
      discount: { type: "percentage", value: 0 },
    },
  ]);
  const [dated, setDated] = useState(new Date().toISOString().split("T")[0]);
  const [purchase_code, setPurchaseCode] = useState("");

  useEffect(() => {
    getDropdownData().then(({ coaList, productList }) => {
      setCoaList(coaList);
      setProductList(productList);
    });
  }, []);

  function addItem() {
    setItems([
      ...items,
      {
        product_code: "",
        quantity: 0,
        price: 0,
        remarks: "",
        discount: { type: "percentage", value: 0 },
      },
    ]);
  }

  function removeItem(index) {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  }

  function updateItem(index, field, value) {
    const newItems = [...items];

    if (field === "discount_type") {
      newItems[index].discount.type = value;
    } else if (field === "discount_value") {
      newItems[index].discount.value = parseFloat(value) || 0;
    } else {
      newItems[index][field] = value;
    }

    if (field === "product_code") {
      const product = productList.find((p) => p.product_code === value);
      if (product) {
        newItems[index].price = product.price || 0;
      }
    }

    setItems(newItems);
  }

  function calculateItemTotal(item) {
    const subtotal = item.quantity * item.price;
    let calculatedDiscount = 0;

    if (item.discount.type === "percentage") {
      calculatedDiscount = subtotal * (item.discount.value / 100);
    } else {
      calculatedDiscount = Math.min(item.discount.value, subtotal);
    }

    return subtotal - calculatedDiscount;
  }

  function Total(item) {
    return item.quantity * item.price;
  }

  function calculateItemDiscount(item) {
    const subtotal = item.quantity * item.price;
    if (item.discount.type === "percentage") {
      return subtotal * (item.discount.value / 100);
    }
    return Math.min(item.discount.value, subtotal);
  }

  function calculateTotal() {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  }

  function calculateDiscountTotal() {
    return items.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!purchase_code.trim() || !dated.trim() || !items.length) {
      alert("Input cannot be empty");
      setIsSubmitting(false);
      return;
    }

    const grandTotal = calculateTotal();
    const discountTotal = calculateDiscountTotal();

    const formData = new FormData();
    formData.append("doc_type", "SR");
    formData.append("purchase_code", purchase_code);
    formData.append("dated", dated);
    formData.append("items", JSON.stringify(items));
    formData.append("grand_total", grandTotal);
    formData.append("calculated_discount", discountTotal);

    try {
      const { doc_id } = await createPurchaseSheet(formData);

      if (doc_id) {
        alert("Saved with doc_id: " + doc_id);
        setItems([]);
        setCoaList([]);
        setDated(new Date().toISOString().split("T")[0]);
        setPurchaseCode("");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 max-w-6xl mx-auto bg-gradient-to-br from-blue-200 to-blue-300 mt-8 rounded-xl shadow-xl border border-blue-100"
    >
      <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500">
        Sale Return Sheet
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Purchase Code:
          </label>
          <select
            onChange={(e) => setPurchaseCode(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-700 shadow-sm"
            value={purchase_code}
          >
            <option value="">Select Sale Return Code</option>
            {coaList.map((c) => (
              <option key={c.account_code} value={c.account_code}>
                {c.account_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Date:
          </label>
          <input
            type="date"
            value={dated}
            onChange={(e) => setDated(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-700 shadow-sm"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Items</h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>Add Item</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      value={item.product_code}
                      onChange={(e) =>
                        updateItem(i, "product_code", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Select Product Code</option>
                      {productList.map((p) => (
                        <option key={p.product_code} value={p.product_code}>
                          {p.product_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      placeholder="0"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(i, "quantity", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={item.price}
                      onChange={(e) => updateItem(i, "price", e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="Remarks"
                      value={item.remarks}
                      onChange={(e) => updateItem(i, "remarks", e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      value={item.discount.type}
                      onChange={(e) =>
                        updateItem(i, "discount_type", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      placeholder={
                        item.discount.type === "percentage" ? "0%" : "0.00"
                      }
                      value={item.discount.value}
                      onChange={(e) =>
                        updateItem(i, "discount_value", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="0"
                      step={item.discount.type === "percentage" ? "1" : "0.01"}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                    {Total(item).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-50"
                      title="Remove item"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
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
      </div>

      {/* Totals Section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-8">
        <div className="max-w-md ml-auto space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Subtotal:</span>
            <span className="font-semibold">
              {(calculateTotal() + calculateDiscountTotal()).toLocaleString(
                "en-US",
                {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Discount:</span>
            <span className="text-red-600 font-semibold">
              -
              {calculateDiscountTotal().toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-3 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">
                Grand Total:
              </span>
              <span className="text-2xl font-extrabold text-blue-600">
                {calculateTotal().toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
        <Link
          href="/sale-return-detail"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        >
          View Sale Return Details
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
            isSubmitting ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Processing...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Save Sale Return
            </>
          )}
        </button>
      </div>
    </form>
  );
}
