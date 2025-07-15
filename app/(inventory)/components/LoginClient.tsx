"use client";

import React, { useEffect, useState } from "react";
import LoginForm from "./LoginForm";

const LoginClient = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 300); // short delay for nicer UX

    return () => clearTimeout(timeout);
  }, []);

  if (!isReady) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 animate-fade-in animate-color-shift">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
          Login Form
        </span>
      </h1>
      <LoginForm />
    </div>
  );
};

export default LoginClient;
