"use server";

import prisma from "../../utils/connection"; // assume prisma client setup
import { getSession } from "../lib/session";
import bcrypt from "bcryptjs";

export async function login(prevState, formData) {
  const name = formData.get("name");
  const password = formData.get("password");

  const user = await prisma.User.findUnique({ where: { name } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { ok: false, error: "Invalid Credential" };
  }

  const session = await getSession();
  session.user = { id: user.id, name: user.name };

  await session.save();

  return { ok: true, error: null };
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  return { ok: true };
}
