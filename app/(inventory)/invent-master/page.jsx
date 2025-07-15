import { createInventMaster } from "../action/action";
import prisma from "../../utils/connection";
import { revalidatePath } from "next/cache";

export default async function InventForm() {
  const coaList = await prisma?.COA.findMany();
  const lastAccount = await prisma?.Invent_Master.findFirst({
    orderBy: {
      invoice_no: "desc",
    },
  });
  let newCode;
  if (!lastAccount) {
    newCode = 1;
  } else {
    const lastCodeNumber = lastAccount.invoice_no;
    newCode = lastCodeNumber + 1;
  }

  // const handleSubmit = async (formData) => {
  //   await createInventMaster(formData);

  //   revalidatePath("/invent-master");
  // };

  return (
    <>
      <h1 className="text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Purchase Form
        </span>
      </h1>
      <form
        action={createInventMaster}
        className="max-w-md mx-auto space-y-4 p-4"
      >
        <div className="space-y-3">
          <div>
            <label className="block">Invoice Number</label>
            <input
              name="invoice_no"
              placeholder="Invoice Number"
              className="border p-2 w-full"
              required
              value={newCode}
              readOnly
            />
          </div>
          <div>
            <label className="block">Purchase Code</label>
            <select
              name="purchase_code"
              className="border p-2 rounded w-full"
              required
            >
              {coaList.map((coa) => (
                <option key={coa.id} value={coa.account_code}>
                  {coa.account_code} - {coa.account_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block">Document Type</label>
            <input
              name="doc_type"
              placeholder="Document Type"
              value={"PV"}
              className="border p-2 w-full"
              readOnly
              required
            />
          </div>
          <div>
            <label className="block">Dated</label>
            <input
              name="dated"
              placeholder="Add Date"
              className="border p-2 w-full"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Invent Master
        </button>
      </form>
    </>
  );
}
