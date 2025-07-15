import { getInventWithPurchase } from "../../action/action";
import DeletePurchase from "../components/DeletePurchase";
import Link from "next/link";
export default async function InventPage() {
  const invents = await getInventWithPurchase();

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Purchase Details
        </span>
      </h1>
      {invents.map((invent) => (
        <div key={invent.id} className="border p-4 mb-4 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p>
                <strong>Invoice No:</strong> {invent.invoice_no}
              </p>
              <p>
                <strong>Doc ID:-</strong> {invent.doc_id}
              </p>
              <p>
                <strong>Doc Type:-</strong> {invent.doc_type}
              </p>
              <p>
                <strong>Account:</strong> {invent.COA?.account_name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(invent.dated).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3 h-12">
              <Link
                href={`/purchase-edit/${invent.doc_id}`}
                className="p-2 bg-blue-700 text-white rounded"
              >
                Update Purchase
              </Link>
              <DeletePurchase doc_id={invent.doc_id} Sale={"Purchase"} />
            </div>
          </div>
          <div className="mt-2">
            <h2 className="font-bold text-xl text-blue-600 underline">
              Purchases:-
            </h2>
            <div className="grid grid-cols-5 text-green-500">
              <label className="font-bold">Product Name</label>
              <label className="font-bold">Quantity</label>
              <label className="font-bold">Price</label>
              <label className="font-bold">Remarks</label>
              <label className="font-bold">Amount</label>
            </div>
            {invent.Purchase.map((p) => (
              <div key={p.id} className=" ml-1 grid grid-cols-5 border-l  mt-2">
                <p>
                  {p.Product?.product_name} ({p.product_code})
                </p>

                <p>{p.quantity}</p>
                <p>{p.price}</p>
                <p>{p.remarks}</p>
                <p className="">{p.amount}</p>
              </div>
            ))}
            <div className="flex justify-end mr-12">
              <p className="font-bold mt-2">
                G-Total:{invent.Purchase[0]?.grandTotal}
              </p>
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-center mt-4 bg-blue-900">
        <Link href="/purchase-sheet" className="text-white p-2">
          Go To Purchase Sheet
        </Link>
      </div>
    </div>
  );
}
