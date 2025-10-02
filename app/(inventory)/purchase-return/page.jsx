"use client";
import { useEffect, useState } from "react";
import { getDropdownData } from "../../action/action";
import { createPurchaseSheet } from "../../action/action";
import Link from "next/link";
import COAList from "../components/COAList";
import ProductList from "../components/ProductList";

export default function PurchasePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [items, setItems] = useState([
    {
      product_code: "",
      quantity: 0,
      purchase_price: 0,
      remarks: "",
      discount: { type: "percentage", value: 0 },
    },
  ]);
  const [dated, setDated] = useState(new Date().toISOString().split("T")[0]);
  const [purchase_code, setPurchaseCode] = useState("");
  const [bill_amount, setBillAmount] = useState(0);
  const [sale_man, setSaleMan] = useState("");
  const [cash, setCash] = useState("");
  const [jazz_cash, setJazzCash] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");

  useEffect(() => {
    getDropdownData().then(({ coaList, productList }) => {
      setCoaList(coaList);
      setProductList(productList);
    });
  }, []);

  // Calculate discount and update bill amount
  useEffect(() => {
    const total = items.reduce(
      (sum, p) => sum + p.quantity * p.purchase_price,
      0
    );
    let discountedTotal = total;

    if (discountValue) {
      const discount = parseFloat(discountValue);
      if (!isNaN(discount)) {
        if (discountType === "percentage") {
          discountedTotal = total - (total * discount) / 100;
        } else {
          discountedTotal = total - discount;
        }
        discountedTotal = Math.max(0, discountedTotal);
      }
    }

    setBillAmount(discountedTotal);
  }, [items, discountType, discountValue]);

  function addItem() {
    setItems([
      ...items,
      { product_code: "", quantity: 0, purchase_price: 0, remarks: "" },
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
        newItems[index].purchase_price = product.purchase_price || 0;
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
    formData.append("doc_type", "PR");
    formData.append("purchase_or_sale_account", "20010003");
    formData.append("purchase_code", purchase_code);
    formData.append("dated", dated);
    formData.append("bill_amount", bill_amount.toString());
    formData.append("sale_man", sale_man);
    formData.append("cash", cash);
    formData.append("jazz_cash", jazz_cash);
    formData.append("discount_type", discountType);
    formData.append("discount_value", discountValue);
    formData.append("items", JSON.stringify(items));

    try {
      const { doc_id } = await createPurchaseSheet(formData);

      if (doc_id) {
        alert("Saved with doc_id: " + doc_id);

        setItems([
          {
            product_code: "",
            quantity: 0,
            purchase_price: 0,
            remarks: "",
            discount: { type: "percentage", value: 0 },
          },
        ]);
        setCoaList([]);
        setDated(new Date().toISOString().split("T")[0]);
        setSaleMan("");
        setCash("");
        setJazzCash("");
        setDiscountType("percentage");
        setDiscountValue("");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const grandTotal = items.reduce(
    (sum, p) => sum + p.quantity * p.purchase_price,
    0
  );
  const discountAmount = discountValue
    ? discountType === "percentage"
      ? (grandTotal * parseFloat(discountValue)) / 100
      : parseFloat(discountValue)
    : 0;
  const finalAmount = Math.max(0, grandTotal - discountAmount);

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 p-6 w-3/4 mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="relative inline-block">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500 bg-clip-text text-transparent drop-shadow-lg">
            Purchase Return
          </h1>
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full transform scale-x-75"></div>
        </div>
        <p className="text-gray-600 mt-4 text-lg font-light">
          Craft beautiful sale orders with effortless precision
        </p>

        {/* Decorative elements */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-150"></div>
          <div className="w-3 h-3 bg-lime-400 rounded-full animate-pulse delay-300"></div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 8a2 2 0 114 0 2 2 0 01-4 0zm2 6a6 6 0 01-6-6h12a6 6 0 01-6 6z"
                clipRule="evenodd"
              />
            </svg>
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purchase Code */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Purchase Code *
              </label>
              <COAList
                coaList={coaList}
                onAccountSelect={(account) =>
                  setPurchaseCode(account.account_code)
                }
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Date *
              </label>
              <input
                type="date"
                value={dated}
                onChange={(e) => setDated(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* {purchase_code && ( */}
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={
                      coaList.find((c) => c.account_code === purchase_code)
                        ?.city || ""
                    }
                    readOnly
                    className="w-full bg-transparent border-none text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 极 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={
                      coaList.find((c) => c.account_code === purchase_code)
                        ?.contact_no || ""
                    }
                    readOnly
                    className="w-full bg-transparent border-none text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* )} */}
        </div>

        {/* Items Section */}

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-1 rounded-xl border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-green-800 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 极 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Items
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-green-100/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-green-800">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-green-800">
                    Design
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-green-800">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-green-800">
                    Purchase Price
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-green-800">
                    Remarks
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-green-800">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-green-800">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const selectedProduct = productList.find(
                    (p) => p.product_code === item.product_code
                  );
                  const designNumber = selectedProduct?.design_number || "";

                  return (
                    <tr
                      key={i}
                      className="border-b border-green-100 hover:bg-green-50/50 transition-colors"
                    >
                      <td className="p-1">
                        <ProductList
                          handleProductValue={(product) => {
                            updateItem(i, "product_code", product.product_code);
                          }}
                          productList={productList}
                          index={i}
                          updateItem={updateItem}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={designNumber}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(i, "quantity", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={item.purchase_price}
                          onChange={(e) =>
                            updateItem(i, "purchase_price", e.target.value)
                          }
                          className="w-full px-3 py-2 border border极gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          placeholder="Remarks"
                          value={item.remarks}
                          onChange={(e) =>
                            updateItem(i, "remarks", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </td>
                      <td className="p-1">
                        <div className="px-3 py-2 bg-gray-100 rounded-md font-medium text-gray-700 text-sm">
                          Rs.{(item.quantity * item.purchase_price).toFixed(2)}
                        </div>
                      </td>
                      <td className="p-1">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={addItem}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center transition-colors duration-200"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="currentColor"
                              viewBox="0 极 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Item
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200 text-sm flex items-center"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment & Discount Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Sale Man & Discount */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
            <h2 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Sales & Discount
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sale Man
                </label>
                <input
                  type="text"
                  value={sale_man}
                  onChange={(e) => setSaleMan(e.target.value)}
                  placeholder="Enter sale man name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="discountType"
                      value="percentage"
                      checked={discountType === "percentage"}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Percentage (%)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="discountType"
                      value="cash"
                      checked={discountType === "cash"}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Cash</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={
                    discountType === "percentage"
                      ? "Discount %"
                      : "Discount amount"
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Right Side - Payment Information */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100">
            <h2 className="text-xl font-semibold text-orange-800 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path
                  fillRule="evenodd"
                  d="M18 9H2v5a2 2 极 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
              </svg>
              Payment Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill Amount
                </label>
                <input
                  type="text"
                  value={`Rs.${finalAmount.toFixed(2)}`}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-lg font-semibold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Payment
                </label>
                <input
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="Enter cash amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jazz Cash
                </label>
                <input
                  type="number"
                  value={jazz_cash}
                  onChange={(e) => setJazzCash(e.target.value)}
                  placeholder="Enter Jazz cash amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Order Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                Rs.{grandTotal.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Subtotal</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">
                Rs.{discountAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Discount</div>
            </div>
            <div className="text-center p-4 bg-blue-100 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-800">
                Rs.{finalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-blue-600">Total Amount</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
          <Link
            href="/purchase-return-detail"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            Purchase Return Details
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
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
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Save Purchase Return
              </div>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
