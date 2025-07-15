// import React from "react";
// import LoginForm from "../(inventory)/components/LoginForm";
// import { getSession } from "../lib/session";
// import { redirect } from "next/navigation";
// const LoginPage = async () => {
//   const session = await getSession();

//   if (session.user) {
//     redirect("/dashboard-inventry");
//   }

//   return (
//     <div className="max-w-2xl mx-auto">
//       <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 animate-fade-in animate-color-shift">
//         <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
//           Login Form
//         </span>
//       </h1>
//       <LoginForm />
//     </div>
//   );
// };

// export default LoginPage;

// app/login/page.tsx
import { getSession } from "../lib/session";
import { redirect } from "next/navigation";
import LoginClient from "../(inventory)/components/LoginClient";

const LoginPage = async () => {
  const session = await getSession();

  if (session?.user) {
    redirect("/dashboard-inventry");
  }

  return <LoginClient />;
};

export default LoginPage;
