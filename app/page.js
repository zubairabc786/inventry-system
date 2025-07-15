import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "./lib/session";

const HomePage = async () => {
  const session = await getSession();

  if (!session.user) {
    redirect("/login");
  }

  return <div></div>;
};

export default HomePage;
