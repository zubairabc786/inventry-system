import { getInventWithPurchase } from "../../action/action";
import SearchablePurchaseList from "../components/SearchablePurchaseList";
import Link from "next/link";

export default async function InventPage() {
  const invents = await getInventWithPurchase();
  console.log(invents);
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Purchase Details
        </span>
      </h1>

      <SearchablePurchaseList invents={invents} />

      <div className="flex justify-center mt-4 bg-blue-900">
        <Link href="/purchase-sheet" className="text-white p-2">
          Go To Purchase Sheet
        </Link>
      </div>
    </div>
  );
}
