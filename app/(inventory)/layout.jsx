import RouteProtectedLayout from "../route-protected-layout";
import { getSession } from "../lib/session";
import ServerNavbar from "../(inventory)/components/ServerNavbar";
export default async function DashboardLayout({ children }) {
  const session = await getSession();

  return (
    <RouteProtectedLayout>
      <ServerNavbar />
      {children}
    </RouteProtectedLayout>
  );
}
