// "use client";

// import { useEffect, useState } from "react";
// import { getTrialBalance } from "../../action/action";

// export default function TrialBalancePage() {
//   const [trialBalance, setTrialBalance] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function loadData() {
//       try {
//         const data = await getTrialBalance();
//         setTrialBalance(data);
//       } catch (error) {
//         console.error(error);
//       } finally {
//         setLoading(false);
//       }
//     }
//     loadData();
//   }, []);

//   if (loading)
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//         <span className="ml-4 text-gray-600">Loading trial balance...</span>
//       </div>
//     );

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-xl md:text-2xl lg:text-4xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
//         <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
//           Trial Balance
//         </span>
//       </h1>

//       <div className="bg-white rounded-lg shadow-md overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-lg font-medium text-gray-500 uppercase tracking-wider">
//                   Account Code
//                 </th>
//                 <th className="px-6 py-3 text-left text-lg font-medium text-gray-500 uppercase tracking-wider">
//                   Account Name
//                 </th>
//                 <th className="px-6 py-3 text-right text-lg font-medium text-gray-500 uppercase tracking-wider">
//                   Debit
//                 </th>
//                 <th className="px-6 py-3 text-right text-lg font-medium text-gray-500 uppercase tracking-wider">
//                   Credit
//                 </th>
//                 <th className="px-6 py-3 text-right text-lg font-medium text-gray-500 uppercase tracking-wider">
//                   Balance (Dr/Cr)
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {trialBalance.map((account, index) => (
//                 <tr
//                   key={index}
//                   className={
//                     account.account_code === "TOTAL"
//                       ? "bg-gray-100 font-bold"
//                       : "hover:bg-gray-50"
//                   }
//                 >
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {account.account_code}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {account.account_name}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
//                     {account.debit.toFixed(2)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
//                     {account.credit.toFixed(2)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
//                     {account.account_code === "TOTAL" ? (
//                       account.debit === account.credit ? (
//                         <span className="text-gray-600">0.00</span>
//                       ) : account.debit > account.credit ? (
//                         <span className="text-green-600">
//                           {(account.debit - account.credit).toFixed(2)} Dr
//                         </span>
//                       ) : (
//                         <span className="text-red-600">
//                           {(account.credit - account.debit).toFixed(2)} Cr
//                         </span>
//                       )
//                     ) : account.balance >= 0 ? (
//                       <span className="text-green-600">
//                         {account.balance.toFixed(2)} Dr
//                       </span>
//                     ) : (
//                       <span className="text-red-600">
//                         {Math.abs(account.balance).toFixed(2)} Cr
//                       </span>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState, useRef } from "react";
import { getTrialBalance } from "../../action/action";
import { usePDF } from "react-to-pdf";

export default function TrialBalancePage() {
  const [trialBalance, setTrialBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef();
  const { toPDF, targetRef } = usePDF({ filename: "trial-balance.pdf" });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTrialBalance();
        setTrialBalance(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">Loading trial balance...</span>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl lg:text-4xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
            Trial Balance
          </span>
        </h1>
        <button
          onClick={() => toPDF()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Export to PDF
        </button>
      </div>

      <div
        ref={targetRef}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-lg font-medium text-gray-500 uppercase tracking-wider">
                  Account Code
                </th>
                <th className="px-6 py-3 text-left text-lg font-medium text-gray-500 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-right text-lg font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-lg font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-6 py-3 text-right text-lg font-medium text-gray-500 uppercase tracking-wider">
                  Balance (Dr/Cr)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trialBalance.map((account, index) => (
                <tr
                  key={index}
                  className={
                    account.account_code === "TOTAL"
                      ? "bg-gray-100 font-bold"
                      : "hover:bg-gray-50"
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.account_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.account_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                    {account.debit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                    {account.credit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    {account.account_code === "TOTAL" ? (
                      account.debit === account.credit ? (
                        <span className="text-gray-600">0.00</span>
                      ) : account.debit > account.credit ? (
                        <span className="text-green-600">
                          {(account.debit - account.credit).toFixed(2)} Dr
                        </span>
                      ) : (
                        <span className="text-red-600">
                          {(account.credit - account.debit).toFixed(2)} Cr
                        </span>
                      )
                    ) : account.balance >= 0 ? (
                      <span className="text-green-600">
                        {account.balance.toFixed(2)} Dr
                      </span>
                    ) : (
                      <span className="text-red-600">
                        {Math.abs(account.balance).toFixed(2)} Cr
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
