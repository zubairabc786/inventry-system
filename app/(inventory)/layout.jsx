import Navbar from "../(inventory)/components/Navbar";
import RouteProtectedLayout from "../route-protected-layout";
import { getSession } from "../lib/session";
import { redirect } from "next/navigation";
export default async function DashboardLayout({ children }) {
  const session = await getSession();

  return (
    <RouteProtectedLayout>
      <Navbar />
      {children}
    </RouteProtectedLayout>
  );
}
