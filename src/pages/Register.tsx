import { useState } from "react";
import AuthForm from "../components/auth/AuthForm";
import authService from "../services/authService";
import Chat from "./Chat"; // Importamos el componente Chat

const Register = () => {
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState<boolean>(true);
  const [showChat, setShowChat] = useState<boolean>(false); // Estado para mostrar el chat

  const handleSubmit = async (email: string, password: string, username?: string) => {
    try {
      if (isRegister) {
        await authService.register(email, password, username || "");
      } else {
        await authService.login(email, password);
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
    return <Chat />; // Renderiza el componente Chat sin cambiar la URL
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <AuthForm type={isRegister ? "register" : "login"} onSubmit={handleSubmit} />

      {error && <p className="mt-4 text-red-500">{error}</p>}

      <button onClick={handleToggleForm} className="mt-4 text-[var(--accent-color)] hover:underline">
        {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
      </button>
    </div>
  );
};

export default Register;
