// app/purchase/page.js
"use client";
import { useEffect, useState } from "react";
import { getDropdownData } from "../../../action/action";
import { createPurchaseSheet } from "../../../action/action";
import Link from "next/link";

export default function PurchasePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log("isSubmitting", isSubmitting);
  const [coaList, setCoaList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [items, setItems] = useState([]);
  const [dated, setDated] = useState(new Date().toISOString().split("T")[0]);
  const [purchase_code, setPurchaseCode] = useState("");

  useEffect(() => {
    async function fetchDropdownData() {
      const { coaList, productList } = await getDropdownData();
      setCoaList(coaList);
      setProductList(productList);
    }

    fetchDropdownData();
  }, []);

  function addItem() {
    setItems([
      ...items,
      { product_code: "", quantity: 0, price: 0, remarks: "" },
    ]);
  }

  function updateItem(index, field, value) {
    // console.log("field=", field);
    const newItems = [...items];
    if (field === "product_code") {
      const selectedProduct = productList.find((p) => p.product_code === value);
      newItems[index]["product_code"] = value;
      newItems[index]["price"] = selectedProduct?.purchase_price || 0;
    } else {
      newItems[index][field] = value;
    }

    setItems(newItems);
    // console.log("newItems=", items);
  }
  // console.log("items=", items);
  function removeItem(index) {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true); // Disable the button

    if (!purchase_code.trim() || !dated.trim() || !items.length) {
      alert("Input cannot be empty");
      setIsSubmitting(false); // allow retry
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
      console.error("Error saving purchase:", err);
      alert("Failed to save purchase. Please try again.");
    } finally {
      setIsSubmitting(false); // Re-enable the button
    }
  }

  useEffect(() => {
    // console.log("isSubmitting changed to:", isSubmitting);
  }, [isSubmitting]);

  const grandTotal = items.reduce((sum, p) => sum + p.quantity * p.price, 0);
  //   console.log("grandTotal", grandTotal);

  return (
    <form onSubmit={handleSubmit} className="  p-4 max-w-5xl space-y-4 mx-auto">
      <h1 className="text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Purchase Sheet
        </span>
      </h1>
      <div>
        <label className="block">Purchase Code:</label>
        <select
          onChange={(e) => setPurchaseCode(e.target.value)}
          className="border p-1"
        >
          <option value="">Select</option>
          {coaList.map((c) => (
            <option key={c.account_code} value={c.account_code}>
              {c.account_code} - {c.account_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block">Date:</label>
        <input
          type="date"
          value={dated}
          onChange={(e) => setDated(e.target.value)}
          className="border p-1"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={addItem}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          + Add Item
        </button>
        <div className="text-left grid grid-cols-6 pl-2 gap-2">
          <label>Product Name</label>
          <label>Qty</label>
          <label>Price</label>
          <label>Remarks</label>
          <label>Total</label>
        </div>
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 mt-2">
            <select
              value={item.product_code}
              onChange={(e) => updateItem(i, "product_code", e.target.value)}
              className="border p-1"
            >
              <option value="">Item</option>
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
              className="border p-1"
            />
            <input
              type="number"
              placeholder="Price"
              value={item.price}
              readOnly
              onChange={(e) => updateItem(i, "price", e.target.value)}
              className="border p-1"
            />
            <input
              type="text"
              placeholder="Remarks"
              value={item.remarks}
              onChange={(e) => updateItem(i, "remarks", e.target.value)}
              className="border p-1"
            />
            <div className="pl-4 bg-gray-200">
              {item.quantity * item.price || 0}
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="bg-red-500 text-white rounded px-2 py-1"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      <div className=" flex justify-end w-full  ">
        <div className="w-8 ">
          <label htmlFor="" className="block">
            GrandTotal
          </label>
          <span className="bg-gray-300 p-1 ">{grandTotal}</span>
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {isSubmitting ? "Saving..." : "Save Purchase"}
      </button>
      <div className="flex justify-center mt-4 bg-blue-900">
        <Link href="/sale-return-detail" className="text-white p-2">
          Go To Sale Return Details
        </Link>
      </div>
    </form>
  );
}
