import { useState } from "react";

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (email: string, password: string, username?: string, avatar_url?: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl] = useState("https://i.ibb.co/hRCDCFgs/perfil.png");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-[var(--secondary-bg)] p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center mb-6">
          {type === "login" ? "Login" : "Register"}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(
              email, 
              password, 
              type === "register" ? username : undefined,
              type === "register" ? avatarUrl : 'https://i.ibb.co/hRCDCFgs/perfil.png'
            );
          }}
        >
          {type === "register" && (
            <div className="mb-4">
              <label className="block text-sm mb-1">Username</label>
              <input
                type="text"
                className="w-full p-2 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full p-2 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4 relative">
            <label className="block text-sm mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full p-2 pr-10 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center justify-center"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className={`h-6 w-6 ${showPassword ? "text-white" : "text-gray-500"}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    className={`h-6 w-6 ${showPassword ? "text-white" : "text-gray-500"}`}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[var(--accent-color)] text-black font-semibold py-2 rounded-md hover:bg-green-500 transition"
          >
            {type === "login" ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;