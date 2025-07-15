// "use client";
// import Link from "next/link";
// import { useState } from "react";
// export default function Sidebar() {
//   const [openReports, setOpenReports] = useState(false);
//   return (
//     <div className="w-64 bg-blue-800 text-white p-4 fixed h-full">
//       <h1 className="text-xl font-bold mb-6">
//         Accounts & Inventory Management System
//       </h1>
//       <nav className="space-y-4">
//         <Link href="/dashboard-inventry" className="block hover:text-gray-300">
//           Dashboard
//         </Link>
//         <Link href="/products" className="block hover:text-gray-300">
//           Products
//         </Link>
//         <Link href="/purchase-sheet" className="block hover:text-gray-300">
//           Purchases
//         </Link>
//         <Link href="/sale-sheet" className="block hover:text-gray-300">
//           Sales
//         </Link>
//         <Link href="/coa" className="block hover:text-gray-300">
//           Chart Of Account
//         </Link>
//         <Link href="/stock-detail" className="block hover:text-gray-300">
//           Stock Detail
//         </Link>
//         <Link href="/jornal-jv-form" className="block hover:text-gray-300">
//           Journal JV
//         </Link>
//         {/* <Link href="/jornal-md-form" className="block hover:text-gray-300">
//           Journal DV
//         </Link> */}

//         <button
//           onClick={() => setOpenReports(!openReports)}
//           className="block w-full text-left hover:text-gray-300"
//         >
//           Reports
//         </button>
//         {openReports && (
//           <div className="ml-4 space-y-2">
//             <Link href="/ledger-entries" className="block hover:text-gray-300">
//               Ledger Detail
//             </Link>
//             <Link href="/trial-balance" className="block hover:text-gray-300">
//               Trial Balance
//             </Link>
//             <Link
//               href="/reports/profit-loss"
//               className="block hover:text-gray-300"
//             >
//               Profit & Loss
//             </Link>
//           </div>
//         )}
//       </nav>
//     </div>
//   );
// }

"use client";
import Link from "next/link";
import { useState } from "react";
import {
  FiHome,
  FiBox,
  FiShoppingCart,
  FiDollarSign,
  FiBook,
  FiPieChart,
  FiFileText,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

export default function Sidebar() {
  const [openReports, setOpenReports] = useState(false);

  return (
    <div className="w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white p-4 fixed h-full shadow-xl">
      <div className="flex items-center mb-8 p-2 border-b border-blue-700">
        <h1 className="text-xl font-bold text-white">
          <span className="text-blue-300">Accounts</span> &{" "}
          <span className="text-blue-200">Inventory</span>
        </h1>
      </div>

      <nav className="space-y-1">
        <SidebarLink href="/dashboard-inventry" icon={<FiHome />}>
          Dashboard
        </SidebarLink>

        <SidebarLink href="/products" icon={<FiBox />}>
          Products
        </SidebarLink>

        <SidebarLink href="/purchase-sheet" icon={<FiShoppingCart />}>
          Purchases
        </SidebarLink>

        <SidebarLink href="/sale-sheet" icon={<FiDollarSign />}>
          Sales
        </SidebarLink>

        <SidebarLink href="/coa" icon={<FiBook />}>
          Chart of Accounts
        </SidebarLink>

        <SidebarLink href="/stock-detail" icon={<FiPieChart />}>
          Stock Detail
        </SidebarLink>

        <SidebarLink href="/jornal-jv-form" icon={<FiFileText />}>
          Journal JV
        </SidebarLink>

        <div className="mt-4 pt-2 border-t border-blue-700">
          <button
            onClick={() => setOpenReports(!openReports)}
            className="flex items-center justify-between w-full px-3 py-2 text-left rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <div className="flex items-center">
              <FiFileText className="mr-3" />
              <span>Reports</span>
            </div>
            {openReports ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          {openReports && (
            <div className="ml-6 mt-1 space-y-1 animate-fadeIn">
              <SidebarLink href="/ledger-entries" subItem>
                Ledger Detail
              </SidebarLink>
              <SidebarLink href="/trial-balance" subItem>
                Trial Balance
              </SidebarLink>
              <SidebarLink href="/reports/profit-loss" subItem>
                Profit & Loss
              </SidebarLink>
            </div>
          )}
        </div>
      </nav>

      <div className="absolute bottom-4 left-4 right-4 text-xs text-blue-300">
        v1.0.0
      </div>
    </div>
  );
}

function SidebarLink({ href, children, icon, subItem = false }) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center px-3 py-2 rounded-lg transition-colors duration-200 
        ${
          subItem
            ? "text-blue-200 hover:bg-blue-800 hover:text-white"
            : "hover:bg-blue-700 hover:text-white"
        }`}
      >
        {icon && <span className="mr-3">{icon}</span>}
        <span className={subItem ? "text-sm" : ""}>{children}</span>
      </div>
    </Link>
  );
}
