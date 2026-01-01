// "use server";

// import prisma from "../../utils/connection"; // assume prisma client setup
// import { getSession } from "../lib/session";
// import bcrypt from "bcryptjs";

// export async function login(prevState, formData) {
//   const name = formData.get("name");
//   const password = formData.get("password");

//   const user = await prisma.User.findUnique({ where: { name } });
//   if (!user || !(await bcrypt.compare(password, user.password))) {
//     return { ok: false, error: "Invalid Credential" };
//   }

//   const session = await getSession();
//   session.user = { id: user.id, name: user.name };

//   await session.save();

//   return { ok: true, error: null };
// }

// export async function logout() {
//   const session = await getSession();
//   session.destroy();
//   return { ok: true };
// }

"use server";

import prisma from "../../utils/connection";
import { getSession } from "../lib/session";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function login(prevState, formData) {
  const name = formData.get("name");
  const password = formData.get("password");

  const user = await prisma.User.findUnique({ where: { name } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { ok: false, error: "Invalid Credential" };
  }

  const session = await getSession();
  session.user = {
    id: user.id,
    name: user.name,
    role: user.role, // Add role to session
  };

  await session.save();

  // Also store role in a cookie for client-side access
  // cookies().set("userRole", user.role, {
  //   httpOnly: false, // Make accessible to JavaScript
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "lax",
  //   maxAge: 60 * 60 * 24 * 7, // 1 week
  // });

  cookies().set("userRole", user.role, {
    httpOnly: false,
    secure: true, // REQUIRED on Vercel
    sameSite: "lax",
    path: "/", // VERY IMPORTANT
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true, error: null };
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  // cookies().delete("userRole");
  cookies().delete("userRole", { path: "/" });

  return { ok: true };
}

// Server action to get user role
export async function getUserRole() {
  const session = await getSession();
  return session.user?.role || "operator"; // Default to operator if not logged in
}
