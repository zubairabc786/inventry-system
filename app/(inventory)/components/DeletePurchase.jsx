"use client";

import { deleteInventMasterPurchase } from "../../action/action"; // adjust if needed
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ doc_id, Sale }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteInventMasterPurchase(doc_id);
      if (res.success) {
        alert("Deleted successfully!");
        router.refresh();
        // Optionally refresh or redirect
      } else {
        alert("Error: " + res.error);
      }
    });
  };

  return (
    <button
      className="p-2 bg-red-700 w-18 text-white rounded"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? "Deleting..." : `Delete ${Sale}`}
    </button>
  );
}
