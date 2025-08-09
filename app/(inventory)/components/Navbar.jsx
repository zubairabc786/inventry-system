"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import LogOut from "../components/LogOut";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard-inventry" },
    { name: "Products", href: "/products" },
    { name: "Sales", href: "/sale-sheet" },
    { name: "Sale-Return", href: "/sale-return" },
    { name: "Purchases", href: "/purchase-sheet" },
    { name: "Purchase-Return", href: "/purchase-return" },
    { name: "Stock", href: "/stock-detail" },
    { name: "Accounts", href: "/coa" },
    { name: "Jornal Voucher", href: "/jornal-jv-form" },
  ];

  return (
    <div className="fixed top-0 left-0 z-50 w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg h-20">
      <div className="flex justify-between items-center h-full max-w-7xl mx-auto px-4">
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

        <div className=" flex space-x-1 md:space-x-2 items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={` nav_link
                px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${
                  pathname === item.href
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }
                hover:shadow-lg
              `}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="ml-4">
          <LogOut />
        </div>
      </div>
    </div>
  );
}
