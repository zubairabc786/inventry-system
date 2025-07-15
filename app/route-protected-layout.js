import { getSession } from "../app/lib/session";
import { redirect } from "next/navigation";

export default async function RouteProtectedLayout({ children }) {
  const session = await getSession();
  // console.log("session=", session.user);
  if (!session.user) {
    redirect("/login");
  }

  return <>{children}</>;
}
