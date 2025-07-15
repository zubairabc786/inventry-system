"use client";
import { useEffect, useState } from "react";
import { getDropdownData } from "../../action/action";
import { createPurchaseSheet } from "../../action/action";
import Link from "next/link";

export default function PurchasePage() {
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
      { product_code: "", quantity: 0, price: 0, remarks: "" },
    ]);
  }

  function removeItem(index) {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  }

  function updateItem(index, field, value) {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "product_code") {
      const product = productList.find((p) => p.product_code === value);
      if (product) {
        newItems[index].price = product.price || 0;
      }
    }

    setItems(newItems);
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

    const formData = new FormData();
    formData.append("doc_type", "PV");
    formData.append("purchase_code", purchase_code);
    formData.append("dated", dated);
    formData.append("items", JSON.stringify(items));

    try {
      const { doc_id } = await createPurchaseSheet(formData);

      if (doc_id) {
        alert("Saved with doc_id: " + doc_id);
        setItems([]);
        setCoaList([]);
        setDated(new Date().toISOString().split("T")[0]);
      }
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const grandTotal = items.reduce((sum, p) => sum + p.quantity * p.price, 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 p-4 max-w-5xl space-y-4 mx-auto 
      bg-gradient-to-l from-gray-100 via-gray-200 to-gray-300
      rounded-lg shadow-lg"
    >
      <h1 className="text-xl md:text-xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Purchase Sheet
        </span>
      </h1>

      <div className="space-y-6">
        {/* Purchase Code Dropdown */}
        <div className="space-y-1 w-1/2">
          <label className="block text-sm font-medium text-gray-700">
            Purchase Code:
          </label>
          <select
            onChange={(e) => setPurchaseCode(e.target.value)}
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
          >
            <option value="">Select Purchase Code</option>
            {coaList.map((c) => (
              <option key={c.account_code} value={c.account_code}>
                {c.account_code} - {c.account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Input */}
        <div className="space-y-1 w-1/2">
          <label className="block text-sm font-medium text-gray-700">
            Date:
          </label>
          <input
            type="date"
            value={dated}
            onChange={(e) => setDated(e.target.value)}
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
          />
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={addItem}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Item
          </button>

          <div className="grid grid-cols-6 pl-2 gap-2 font-medium text-gray-700">
            <span>Product Name</span>
            <span>Qty</span>
            <span>Price</span>
            <span>Remarks</span>
            <span>Total</span>
            <span>Action</span>
          </div>

          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-6 gap-3 items-center">
              <select
                value={item.product_code}
                onChange={(e) => updateItem(i, "product_code", e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              >
                <option value="">Select Item</option>
                {productList.map((p) => (
                  <option key={p.product_code} value={p.product_code}>
                    {p.product_code} - {p.product_name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              />

              <input
                type="number"
                placeholder="Price"
                value={item.price}
                onChange={(e) => updateItem(i, "price", e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              />

              <input
                type="text"
                placeholder="Remarks"
                value={item.remarks}
                onChange={(e) => updateItem(i, "remarks", e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              />

              <div className="px-3 py-2 bg-gray-100 rounded-md font-medium text-gray-700">
                {item.quantity * item.price || 0}
              </div>

              <button
                type="button"
                onClick={() => removeItem(i)}
                className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="flex justify-end pr-16 w-full items-center mt-6">
          <div className="flex flex-col items-end gap-2">
            <label className="text-lg font-bold text-gray-700 pr-20">
              Grand Total
            </label>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg shadow-lg transform transition-all hover:scale-105">
              {grandTotal.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center justify-center px-6 py-3 rounded-md shadow-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500"
            }`}
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
                Save Purchase
              </>
            )}
          </button>

          <Link
            href="/purchase-detail"
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white font-medium rounded-md shadow-sm hover:from-blue-800 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path
                fillRule="evenodd"
                d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                clipRule="evenodd"
              />
            </svg>
            View Purchase Details
          </Link>
        </div>
      </div>
    </form>
  );
}
