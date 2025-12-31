// This is a SERVER COMPONENT
import { getUserRole } from "../../actions/auth";
import NavbarClient from "./NavbarClient";

export default async function ServerNavbar() {
  // Get user role from server action
  const userRole = await getUserRole();

  // Define menu items based on role
  const getMenuItems = () => {
    if (userRole === "admin") {
      return [
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
            {
              name: "Purchase Return Details",
              href: "/purchase-return-detail",
            },
          ],
        },
        {
          title: "Inventory",
          href: "/stock-detail",
          items: [
            { name: "Stock Details", href: "/stock-detail" },
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
    } else {
      // Operator menu - only sales
      return [
        {
          title: "Dashboard",
          href: "/dashboard-inventry",
          items: [],
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
      ];
    }
  };

  const menuItems = getMenuItems();

  return <NavbarClient menuItems={menuItems} userRole={userRole} />;
}
