import { getStockTable } from "../../action/action";

export default async function StockPage() {
  const stockList = await getStockTable();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight animate-fade-in">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-green-500 to-purple-600">
            Stock Inventory
          </span>
        </h1>
        <p className=" font-bold mt-2 text-gray-500 dark:text-gray-400">
          Current stock levels and item details
        </p>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider rounded-tl-xl">
                  Code
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">
                  Purchase
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider">
                  Sale
                </th>
                <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider rounded-tr-xl">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stockList.map((item, i) => (
                <tr
                  key={i}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    i % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-800/50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-blue-600 dark:text-blue-400 text-lg font-bold">
                    {item.item_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg">
                    {item.item_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600 dark:text-green-400 text-lg">
                    {item.Purchase}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600 dark:text-red-400 text-lg">
                    {item.Sale}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg">
                    <span
                      className={`px-3 py-1 rounded-full text-lg  ${
                        item.Stock > 50
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : item.Stock > 10
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {item.Stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {stockList.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 text-right rounded-b-xl border-t border-gray-200 dark:border-gray-700">
            <p className="text-lg text-gray-600 dark:text-gray-400 font-bold">
              Showing <span className="font-bold">{stockList.length}</span>{" "}
              items
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
