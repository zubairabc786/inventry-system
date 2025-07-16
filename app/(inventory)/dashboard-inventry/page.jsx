import { Suspense } from "react";
import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";
import { getDashboardData } from "../../action/action";
import { getStockTableLessFive } from "../../action/action";
import Loading from "../components/Loading";

async function DashboardContent() {
  const { sale, purchase, product } = await getDashboardData();
  const stocks = await getStockTableLessFive();

  return (
    <main className="ml-64 p-6 w-full">
      <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Inventory Dashboard
        </span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Total Products" value={product} icon="📦" />
        <DashboardCard title="Total Sales" value={sale} icon="💰" />
        <div className="bg-white p-4 rounded-2xl shadow-md flex items-center space-x-4">
          <div className="flex flex-col gap-2 ">
            <h2 className="font-bold text-center ">Stock Alert</h2>
            {stocks.map((item, i) => {
              return (
                <p className="border-b-2 border-gray-500" key={i}>
                  <span className="text-green-500">{item.item_name}</span>
                  <span className="text-red-500"> Stock:-({item.Stock})</span>
                  <span className="text-green-500"> Less than 5</span>
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <Suspense fallback={<Loading />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
