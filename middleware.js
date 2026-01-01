import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // ✅ Always allow login page
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Read role cookie
  const userRole = request.cookies.get("userRole")?.value;

  // ❌ Not logged in → redirect to login
  if (!userRole) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin-only routes
  const adminRoutes = [
    "/products",
    "/purchase-sheet",
    "/purchase-detail",
    "/purchase-return",
    "/purchase-return-detail",
    "/coa",
    "/categories",
    "/jornal-jv-form",
    "/ledger-entries",
    "/trial-balance",
    "/balance-sheet",
    "/profit-and-loss",
  ];

  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard-inventry", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};

// import { NextResponse } from "next/server";
// import { getSession } from "./app/lib/session";

// export async function middleware(request) {
//   const session = await getSession();
//   const { pathname } = request.nextUrl;

//   // If not logged in, redirect to login
//   if (!session.user && pathname !== "/login") {
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   // Define admin-only routes
//   const adminRoutes = [
//     "/products",
//     "/purchase-sheet",
//     "/purchase-detail",
//     "/purchase-return",
//     "/purchase-return-detail",
//     "/coa",
//     "/categories",
//     "/jornal-jv-form",
//     "/ledger-entries",
//     "/trial-balance",
//     "/balance-sheet",
//     "/profit-and-loss",
//   ];

//   // Check if trying to access admin route
//   const isAdminRoute = adminRoutes.some(
//     (route) => pathname === route || pathname.startsWith(route + "/")
//   );

//   // If accessing admin route but not admin, redirect to dashboard
//   if (isAdminRoute && session.user?.role !== "admin") {
//     return NextResponse.redirect(new URL("/dashboard-inventry", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - login (login page)
//      */
//     "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
//   ],
// };

// import { NextResponse } from "next/server";

// export function middleware(request) {
//   const { pathname } = request.nextUrl;

//   // Read role from cookie (Edge-safe)
//   const userRole = request.cookies.get("userRole")?.value;

//   // If not logged in and not on login page
//   if (!userRole && pathname !== "/login") {
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   // Admin-only routes
//   const adminRoutes = [
//     "/products",
//     "/purchase-sheet",
//     "/purchase-detail",
//     "/purchase-return",
//     "/purchase-return-detail",
//     "/coa",
//     "/categories",
//     "/jornal-jv-form",
//     "/ledger-entries",
//     "/trial-balance",
//     "/balance-sheet",
//     "/profit-and-loss",
//   ];

//   const isAdminRoute = adminRoutes.some(
//     (route) => pathname === route || pathname.startsWith(route + "/")
//   );

//   // Block non-admin users
//   if (isAdminRoute && userRole !== "admin") {
//     return NextResponse.redirect(new URL("/dashboard-inventry", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
// };
