"use client";
import {
  getPurchaseByDocId,
  updatePurchaseByDocId,
} from "../../../action/action";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UpdatePurchaseForm({ params }) {
  const { doc_id } = params;
  const [data, setData] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [deletedItems, setDeletedItems] = useState([]);

  const router = useRouter();

  function handleDeleteItem(id) {
    setDeletedItems([...deletedItems, id]);
    const updatedItems = purchaseItems.filter((item) => item.id !== id);
    setPurchaseItems(updatedItems);
    calculateTotals(updatedItems); // recalculate totals
  }

  useEffect(() => {
    async function fetchData() {
      const result = await getPurchaseByDocId(doc_id);
      setData(result);
      setPurchaseItems(result.Purchase || []);
      calculateTotals(result.Purchase || []);
    }
    fetchData();
  }, [doc_id]);

  function calculateTotals(items) {
    const totalQty = items.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );
    const totalItems = items.length;
    const grandTotal = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    setTotalQty(totalQty);
    setTotalItems(totalItems);
    setGrandTotal(grandTotal);
  }

  function handleItemChange(index, field, value) {
    const updatedItems = [...purchaseItems];
    updatedItems[index][field] = value;

    // Update amount
    updatedItems[index].amount =
      updatedItems[index].quantity * updatedItems[index].price;

    setPurchaseItems(updatedItems);
    calculateTotals(updatedItems);
  }

  async function handleSubmit(formData) {
    formData.set("grandTotal", grandTotal);
    formData.set("totalQty", totalQty);
    formData.set("totalItems", totalItems);
    formData.set("items", JSON.stringify(purchaseItems));
    formData.set("deletedItems", JSON.stringify(deletedItems));

    await updatePurchaseByDocId(formData);
    router.push("/sale-return-detail");
  }

  return (
    <form action={handleSubmit} className="space-y-2 max-w-3xl mx-auto ">
      <h1 className="my-4 text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Edit Sale Return
        </span>
      </h1>
      <div className="flex flex-col">
        <div className="flex">
          <label className="font-bold p-2">Doc Id:-</label>
          <input
            className="border p-2"
            name="doc_id"
            defaultValue={data.doc_id}
            readOnly
          />
        </div>
        <div className="flex">
          <label className="font-bold p-2">Invoice No:-</label>
          <input
            name="invoice_no"
            className="border p-2"
            defaultValue={data.invoice_no}
          />
        </div>
        <div className="flex">
          <label className="font-bold p-2">Purchase Code:-</label>
          <input
            name="purchase_code"
            className="border p-2"
            defaultValue={data.COA?.account_code}
          />
        </div>
        <div className="flex">
          <label className="font-bold p-2">Date:-</label>
          <input
            type="date"
            name="dated"
            className="border p-2"
            defaultValue={
              data.dated ? new Date(data.dated).toISOString().slice(0, 10) : ""
            }
          />
        </div>
      </div>

      <div className=" max-w-3xl mx-auto grid grid-cols-6 gap-1">
        <label className="font-bold">Product Code</label>
        <label className="font-bold">Quantity</label>
        <label className="font-bold">Price</label>
        <label className="font-bold">Remarks</label>
        <label className="font-bold">Amount</label>
      </div>
      {purchaseItems.map((item, index) => (
        <div
          key={item.id}
          className=" max-w-3xl mx-auto grid grid-cols-6 gap-2 "
        >
          <input
            className="border p-2"
            name={`product_code_${index}`}
            value={item.product_code}
            onChange={(e) =>
              handleItemChange(index, "product_code", e.target.value)
            }
          />
          <input
            className="border"
            name={`quantity_${index}`}
            value={item.quantity}
            type="number"
            onChange={(e) =>
              handleItemChange(index, "quantity", e.target.value)
            }
          />
          <input
            className="border"
            name={`price_${index}`}
            value={item.price}
            type="number"
            onChange={(e) => handleItemChange(index, "price", e.target.value)}
          />
          <input
            className="border p-2"
            name={`remarks_${index}`}
            value={item.remarks}
            onChange={(e) => handleItemChange(index, "remarks", e.target.value)}
          />
          <input
            className="border p-2"
            name={`amount_${index}`}
            value={item.amount}
            readOnly
          />

          <button
            type="button"
            onClick={() => handleDeleteItem(item.id)}
            className="bg-red-500 text-white rounded p-2"
          >
            Delete
          </button>
        </div>
      ))}

      <div>Grand Total:-{grandTotal}</div>
      <div className="flex justify-center">
        <button
          type="submit"
          className="bg-blue-700  text-white px-4 py-2 rounded mt-4 flex justify-center"
        >
          Update Sale Return
        </button>
      </div>
    </form>
  );
}
