import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

const sessionOptions = {
  password: process.env.SECRET_KEY,
  cookieName: "zubair_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export function getSession() {
  return getIronSession(cookies(), sessionOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session.user) throw new Error("Unauthorized");
  return session.user;
}
