"use client";

import { createUser } from "../action/action";

const UserForm = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold ">Create User</h1>
      <form action={createUser} className="flex flex-col gap-2  p-2">
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
        <button type="submit" className="bg-blue-600 text-white p-2 w-1/4">
          CreateUser
        </button>
      </form>
    </div>
  );
};

export default UserForm;
