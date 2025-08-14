"use client";
import {
  createCOA,
  lastCOA,
  getCOAs,
  updateCOA,
  deleteCOA,
} from "../../action/action";
import { useTransition, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function COAPage() {
  const [isPending, startTransition] = useTransition();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef();
  const router = useRouter();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const data = await getCOAs();
    setAccounts(data);
  };

  const handleSubmit = (formData) => {
    startTransition(async () => {
      if (isEditing && selectedAccount) {
        const result = await updateCOA(formData);
        if (result.success) {
          alert(`✅ Account updated successfully!`);
          loadAccounts();
          resetForm();
        } else {
          alert("Error: " + result.error);
        }
      } else {
        const newCode = await lastCOA();
        const result = await createCOA(formData);
        if (result.success) {
          alert(`✅ Account created successfully! ${newCode}`);
          loadAccounts();
          resetForm();
        } else {
          alert("Error: " + result.error);
        }
      }
    });
  };

  const handleDelete = (account_code) => {
    if (confirm("Are you sure you want to delete this account?")) {
      startTransition(async () => {
        const result = await deleteCOA(account_code);
        if (result.success) {
          alert(`✅ Account deleted successfully!`);
          loadAccounts();
          if (selectedAccount?.account_code === account_code) {
            resetForm();
          }
        }
      });
    }
  };

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
    setSelectedAccount(null);
    setIsEditing(false);
  };

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setIsEditing(true);
    if (formRef.current) {
      formRef.current.account_name.value = account.account_name;
      formRef.current.contact_no.value = account.contact_no;
      formRef.current.address.value = account.address;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      {/* Form on the left side */}
      <div className="w-full md:w-1/3">
        <div className="max-w-md mx-auto mt-10 p-4 border-3 border-white outline outline-1 outline-gray-200 shadow-lg rounded-xl">
          <h1 className="text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-green-500 to-purple-500">
              {isEditing ? "Edit Account" : "Create Account"}
            </span>
          </h1>

          <form
            ref={formRef}
            action={handleSubmit}
            className="space-y-4 mt-6 p-2"
          >
            {isEditing && selectedAccount && (
              <input
                type="hidden"
                name="account_code"
                value={selectedAccount.account_code}
              />
            )}
            <input
              name="account_name"
              placeholder="Account Name"
              className="border p-2 w-full"
              required
              defaultValue={selectedAccount?.account_name || ""}
            />
            <input
              name="contact_no"
              placeholder="Contact No"
              type="number"
              className="border p-2 w-full"
              required
              defaultValue={selectedAccount?.contact_no || ""}
            />
            <input
              name="address"
              placeholder="Address"
              className="border p-2 w-full"
              required
              defaultValue={selectedAccount?.address || ""}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded"
                disabled={isPending}
              >
                {isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Account"
                  : "Save Account"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Account details on the right side */}
      <div className="w-full md:w-2/3">
        <div className="max-w-4xl mx-auto mt-10 p-4 border-3 border-white outline outline-1 outline-gray-200 shadow-lg rounded-xl">
          <h1 className="text-4xl md:text-2xl lg:text-5xl font-extrabold tracking-tight text-center animate-fade-in animate-color-shift">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
              Account Details
            </span>
          </h1>

          <div className="mt-6 p-2 max-h-96 overflow-y-auto">
            {accounts.length === 0 ? (
              <p className="text-center text-gray-500">No accounts found</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.account_code}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {account.account_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {account.contact_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {account.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(account)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(account.account_code)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
