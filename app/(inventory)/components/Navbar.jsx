"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import LogOut from "../components/LogOut";

export default function Navbar() {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Dashboard",
      href: "/dashboard-inventry",
      items: [],
    },
    {
      title: "Products",
      href: "/products",
      items: [
        { name: "Product List", href: "/products" },
        { name: "Add Product", href: "/products" },
        { name: "Categories", href: "/categories" },
      ],
    },
    {
      title: "Sales",
      href: "/sale-sheet",
      items: [
        { name: "Create Sale", href: "/sale-sheet" },
        { name: "Sale Details", href: "/sale-detail" },
        { name: "Sale Returns", href: "/sale-return" },
        { name: "Sale Return Details", href: "/sale-return-detail" },
      ],
    },
    {
      title: "Purchases",
      href: "/purchase-sheet",
      items: [
        { name: "Create Purchase", href: "/purchase-sheet" },
        { name: "Purchase Details", href: "/purchase-detail" },
        { name: "Purchase Returns", href: "/purchase-return" },
        { name: "Purchase Return Details", href: "/purchase-return-detail" },
      ],
    },
    {
      title: "Inventory",
      href: "/stock-detail",
      items: [
        { name: "Stock Details", href: "/stock-detail" },
        // { name: "Stock Movement", href: "/stock-movement" },
        // { name: "Inventory Report", href: "/inventory-report" },
        { name: "Low Stock Alert", href: "/low-stock" },
      ],
    },
    {
      title: "Accounts",
      href: "/coa",
      items: [
        { name: "Chart of Accounts", href: "/coa" },
        { name: "Journal Voucher", href: "/jornal-jv-form" },
        { name: "Ledger Details", href: "/ledger-entries" },
        { name: "Trial Balance", href: "/trial-balance" },
        { name: "Balance Sheet", href: "/balance-sheet" },
        { name: "Profit & Loss", href: "/profit-and-loss" },
      ],
    },
  ];

  const isActiveMenu = (menu) => {
    return (
      pathname === menu.href ||
      menu.items.some((item) => pathname === item.href)
    );
  };

  return (
    <div className="fixed top-0 left-0 z-50 w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg h-20">
      <div className="flex justify-between items-center h-full max-w-7xl mx-auto px-4">
        {/* Logo */}
        <Link
          href="/dashboard-inventry"
          className="flex items-center space-x-2"
        >
          <Image
            src="/inventory.png"
            alt="Inventory"
            width={50}
            height={50}
            className="hover:scale-105 transition-transform duration-200"
          />
          <span className="text-xl font-bold hidden md:inline-block bg-gradient-to-r from-blue-200 to-blue-400 bg-clip-text text-transparent">
            Inventory Pro
          </span>
        </Link>

        {/* Navigation Menu */}
        <div className="flex space-x-1 items-center">
          {menuItems.map((menu, index) => (
            <div key={index} className="relative group">
              {menu.items.length > 0 ? (
                // Dropdown Menu
                <div className="relative">
                  <div
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center cursor-pointer
                      ${
                        isActiveMenu(menu)
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-gray-300 hover:text-white hover:bg-gray-700"
                      }
                      hover:shadow-lg
                    `}
                  >
                    {menu.title}
                    <svg
                      className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Dropdown Content */}
                  <div className="absolute left-0 mt-1 w-56 bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      <Link
                        href={menu.href}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700 font-semibold"
                      >
                        {menu.title} Overview
                      </Link>

                      {menu.items.map((item, itemIndex) => (
                        <Link
                          key={itemIndex}
                          href={item.href}
                          className={`block px-4 py-2 text-sm transition-colors duration-150 ${
                            pathname === item.href
                              ? "bg-blue-600 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white"
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Simple Link
                <Link
                  href={menu.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${
                      pathname === menu.href
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                    }
                    hover:shadow-lg
                  `}
                >
                  {menu.title}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="ml-4">
          <LogOut />
        </div>
      </div>
    </div>
  );
}
