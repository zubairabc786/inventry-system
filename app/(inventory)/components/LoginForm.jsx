"use client";

import { useFormState } from "react-dom";
import { login } from "../../actions/auth";
import { useState } from "react";

const LoginForm = () => {
  const [state, formAction] = useFormState(login, { error: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    setIsSubmitting(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form
        action={async (formData) => {
          setIsSubmitting(true);
          await formAction(formData);
          setIsSubmitting(false);
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          name="name"
          required
          placeholder="username"
          className="border w-1/2 p-2"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="password"
          className="border w-1/2 p-2"
        />

        <button
          type="submit"
          // onClick={handleSubmit}
          className="bg-blue-600 text-white w-1/4 px-4 py-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Checking..." : "Login"}
        </button>
      </form>

      {state.error && !isSubmitting && (
        <p className="text-red-600 mt-2 font-base">{state.error}</p>
      )}
    </div>
  );
};

export default LoginForm;
