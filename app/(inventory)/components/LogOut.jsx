import { logout } from "../../actions/auth";

const LogoutForm = () => {
  return (
    <form action={logout}>
      <button
        type="submit"
        className=" mr-5 bg-blue-600 text-white px-4 py-2 rounded"
      >
        LogOut
      </button>
    </form>
  );
};

export default LogoutForm;
