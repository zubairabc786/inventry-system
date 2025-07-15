"use client";
import { createCOA, lastCOA } from "../../action/action";
import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
export default function CreateCOAForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef();
  const router = useRouter();

  const handleSubmit = (formData) => {
    startTransition(async () => {
      const newCode = await lastCOA();
      const result = await createCOA(formData);
      if (result.success) {
        alert(`✅ Create account Successfully!${newCode} `);
        if (formRef.current) {
          formRef.current.reset();
        }
      } else {
        alert("Error: " + result.error);
      }
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border-3  border-white outline outline-1 outline-gray-200 shadow-lg rounded-xl">
      {/* Heading for chart of account */}
      <h1 className="text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Chart of Accounts
        </span>
      </h1>

      <form ref={formRef} action={handleSubmit} className="space-y-4 mt-6 p-2">
        <input
          name="account_name"
          placeholder="Account Name"
          className="border p-2 w-full"
          required
        />
        <input
          name="contact_no"
          placeholder="Contact No"
          type="number"
          className="border p-2 w-full"
          required
        />
        <input
          name="address"
          placeholder="Address"
          className="border p-2 w-full"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save Account"}
        </button>
      </form>
      <button
        onClick={() => router.push("/coa-detail")}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded"
      >
        Chart of Accounts Details
      </button>
    </div>
  );
}
