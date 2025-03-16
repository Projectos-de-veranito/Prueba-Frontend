import { useState } from "react";
import AuthForm from "../components/auth/AuthForm";
import authService from "../services/authService";
import Dashboard from "./Dashboard";

const Register = () => {
  const [error, setError] = useState<string | null>(null);
  const [setUser] = useState<any>(null);
  const [isRegister, setIsRegister] = useState<boolean>(true);
  const [showChat, setShowChat] = useState<boolean>(false); // Estado para mostrar el chat

  const handleSubmit = async (email: string, password: string, username?: string) => {
    try {
      if (isRegister) {
        await authService.register(email, password, username || "");
      } else {
        await authService.login(email, password, setUser);  // Pasa setUser aquí
      }
      setShowChat(true); // Muestra el chat después del registro o login
    } catch (err: any) {
      setError(err.message || "Error al procesar");
    }
  };

  const handleToggleForm = () => {
    setIsRegister((prev) => !prev);
    setError(null);
  };

  if (showChat) {
    return <Dashboard />; // Renderiza el componente Chat sin cambiar la URL
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6 w-full">
      <div className="w-full max-w-sm sm:max-w-md">
        <AuthForm 
          type={isRegister ? "register" : "login"} 
          onSubmit={handleSubmit} 
        />
      </div>
  
      {error && (
        <p className="mt-3 text-sm sm:text-base text-red-500 text-center">
          {error}
        </p>
      )}
  
      <button 
        onClick={handleToggleForm} 
        className="mt-4 text-sm sm:text-base text-[var(--accent-color)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-opacity-50 rounded px-2 py-1"
      >
        {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
      </button>
    </div>
  );
};

export default Register;
