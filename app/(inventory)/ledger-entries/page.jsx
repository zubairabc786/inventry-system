// "use client";
// import { useEffect, useState } from "react";
// import { getJournalEntries1 } from "../../action/action";

// export default function JournalPage() {
//   const [journal, setJournal] = useState([]);
//   const [search, setSearch] = useState("");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       setIsLoading(true);
//       try {
//         const result = await getJournalEntries1(search, fromDate, toDate);
//         setJournal(result);
//       } catch (error) {
//         console.error("Error fetching journal entries:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     const debounceTimer = setTimeout(() => {
//       fetchData();
//     }, 300);

//     return () => clearTimeout(debounceTimer);
//   }, [search, fromDate, toDate]);

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight animate-fade-in">
//             <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-green-500 to-purple-600">
//               Account Statement
//             </span>
//           </h1>
//           <p className="text-gray-600">
//             View and filter your financial transactions
//           </p>
//         </div>

//         {/* Filter Controls */}
//         <div className="bg-white rounded-xl shadow-md p-6 mb-8">
//           <h2 className="text-xl font-semibold text-gray-700 mb-4">Filters</h2>
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Search
//               </label>
//               <input
//                 type="text"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Account code or name..."
//                 className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 From Date
//               </label>
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 To Date
//               </label>
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
//               />
//             </div>
//             <div className="flex items-end">
//               <button
//                 onClick={() => {
//                   setSearch("");
//                   setFromDate("");
//                   setToDate("");
//                 }}
//                 className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
//               >
//                 Clear Filters
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Results Section */}
//         <div className="bg-white rounded-xl shadow-md overflow-hidden">
//           <div className="overflow-x-auto">
//             {isLoading ? (
//               <div className="p-8 text-center">
//                 <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
//                 <p className="text-gray-600">Loading journal entries...</p>
//               </div>
//             ) : journal.length === 0 ? (
//               <div className="p-8 text-center">
//                 <p className="text-gray-600">No journal entries found</p>
//               </div>
//             ) : (
//               <table className="w-full">
//                 <thead className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
//                   <tr>
//                     <th className="p-4 text-left font-semibold rounded-tl-lg">
//                       Account Code
//                     </th>
//                     <th className="p-4 text-left font-semibold">
//                       Account Name
//                     </th>
//                     <th className="p-4 text-left font-semibold">Date</th>
//                     <th className="p-4 text-left font-semibold">Doc Type</th>
//                     <th className="p-4 text-right font-semibold">Debit</th>
//                     <th className="p-4 text-right font-semibold">Credit</th>
//                     <th className="p-4 text-right font-semibold rounded-tr-lg">
//                       Balance
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {journal.map((j, i) => {
//                     const prev = journal[i - 1];
//                     const isNewAccount =
//                       i === 0 || j.account_code !== prev.account_code;
//                     const isDebit = j.debit > 0;
//                     const isCredit = j.credit > 0;

//                     return (
//                       <>
//                         {isNewAccount && i !== 0 && (
//                           <tr key={`gap-${i}`} className="h-12">
//                             <td
//                               colSpan="7"
//                               className="border-b-4 border-gray-300"
//                             ></td>
//                           </tr>
//                         )}
//                         <tr
//                           key={i}
//                           className={`${
//                             isNewAccount
//                               ? "border-t-2 border-gray-200 bg-gray-50"
//                               : "border-t border-gray-100"
//                           } ${
//                             i % 2 === 0 ? "bg-white" : "bg-gray-50"
//                           } hover:bg-blue-50 transition`}
//                         >
//                           <td className="p-4 font-medium text-gray-900">
//                             {j.account_code}
//                           </td>
//                           <td className="p-4 text-gray-700">
//                             {j.account_name}
//                           </td>
//                           <td className="p-4 text-gray-600">
//                             {new Date(j.date).toLocaleDateString()}
//                           </td>
//                           <td className="p-4">
//                             <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
//                               {j.doc_type}
//                             </span>
//                           </td>
//                           <td className="p-4 text-right font-medium">
//                             {isDebit ? (
//                               <span className="text-red-600">
//                                 {j.debit.toLocaleString()}
//                               </span>
//                             ) : (
//                               "-"
//                             )}
//                           </td>
//                           <td className="p-4 text-right font-medium">
//                             {isCredit ? (
//                               <span className="text-green-600">
//                                 {j.credit.toLocaleString()}
//                               </span>
//                             ) : (
//                               "-"
//                             )}
//                           </td>
//                           <td className="p-4 text-right font-medium">
//                             <span
//                               className={`${
//                                 j.balance < 0
//                                   ? "text-red-600"
//                                   : "text-green-600"
//                               }`}
//                             >
//                               {j.balance.toLocaleString()}
//                             </span>
//                           </td>
//                         </tr>
//                       </>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             )}
//           </div>

//           {journal.length > 0 && (
//             <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
//               <div className="flex justify-between items-center">
//                 <div className="text-lg font-bold text-gray-600">
//                   Showing {journal.length} entries
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { getJournalEntries1 } from "../../action/action";

export default function JournalPage() {
  const [journal, setJournal] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getJournalEntries1(search, fromDate, toDate);
        setJournal(result);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, fromDate, toDate]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight animate-fade-in">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-green-500 to-purple-600">
              Account Statement
            </span>
          </h1>
          <p className="text-gray-600">
            View and filter your financial transactions
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Account code or name..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch("");
                  setFromDate("");
                  setToDate("");
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-600">Loading journal entries...</p>
              </div>
            ) : journal.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No journal entries found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                  <tr>
                    <th className="p-4 text-left font-semibold rounded-tl-lg">
                      Account Code
                    </th>
                    <th className="p-4 text-left font-semibold">
                      Account Name
                    </th>
                    <th className="p-4 text-left font-semibold">Date</th>
                    <th className="p-4 text-left font-semibold">Doc Type</th>
                    <th className="p-4 text-right font-semibold">Debit</th>
                    <th className="p-4 text-right font-semibold">Credit</th>
                    <th className="p-4 text-right font-semibold rounded-tr-lg">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {journal.map((j, i) => {
                    const prev = journal[i - 1];
                    const isNewAccount =
                      i === 0 || j.account_code !== prev.account_code;
                    const isDebit = j.debit > 0;
                    const isCredit = j.credit > 0;
                    const isOpeningBalance = j.isOpeningBalance;

                    return (
                      <>
                        {isNewAccount && i !== 0 && (
                          <tr key={`gap-${i}`} className="h-12">
                            <td
                              colSpan="7"
                              className="border-b-4 border-gray-300"
                            ></td>
                          </tr>
                        )}
                        <tr
                          key={i}
                          className={`${
                            isOpeningBalance
                              ? "bg-blue-50 border-t-2 border-blue-200 font-semibold"
                              : isNewAccount
                              ? "border-t-2 border-gray-200 bg-gray-50"
                              : "border-t border-gray-100"
                          } ${
                            i % 2 === 0 && !isOpeningBalance
                              ? "bg-white"
                              : "bg-gray-50"
                          } hover:bg-blue-50 transition`}
                        >
                          <td className="p-4 font-medium text-gray-900">
                            {j.account_code}
                          </td>
                          <td className="p-4 text-gray-700">
                            {j.account_name}
                          </td>
                          <td className="p-4 text-gray-600">
                            {isOpeningBalance
                              ? "Opening"
                              : new Date(j.date).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 ${
                                isOpeningBalance
                                  ? "bg-blue-200 text-blue-800"
                                  : j.doc_type === "PV" || j.doc_type === "PR"
                                  ? "bg-purple-100 text-purple-800"
                                  : j.doc_type === "SV" || j.doc_type === "SR"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              } text-xs font-medium rounded`}
                            >
                              {j.doc_type}
                            </span>
                          </td>
                          <td className="p-4 text-right font-medium">
                            {isDebit ? (
                              <span className="text-red-600">
                                {j.debit.toLocaleString()}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-4 text-right font-medium">
                            {isCredit ? (
                              <span className="text-green-600">
                                {j.credit.toLocaleString()}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-4 text-right font-medium">
                            <span
                              className={`${
                                j.balance < 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {j.balance.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {journal.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold text-gray-600">
                  Showing {journal.length} entries
                </div>
                <div className="text-sm text-gray-500">
                  {fromDate && toDate
                    ? `Period: ${new Date(
                        fromDate
                      ).toLocaleDateString()} to ${new Date(
                        toDate
                      ).toLocaleDateString()}`
                    : "Showing all records"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
