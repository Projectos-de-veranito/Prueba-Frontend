import { useState } from "react";
import AuthForm from "../components/auth/AuthForm";
import authService from "../services/authService";
import Dashboard from "./Dashboard";
import { useAuth } from "../hooks/useAuth";  // Importa el hook useAuth

const Login = () => {
  const { setUser } = useAuth();  // Obtén la función setUser del contexto de autenticación
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState<boolean>(false);
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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <AuthForm type={isRegister ? "register" : "login"} onSubmit={handleSubmit} />

      {error && <p className="mt-4 text-red-500">{error}</p>}

      <button onClick={handleToggleForm} className="mt-4 text-[var(--accent-color)] hover:underline">
        {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
      </button>
    </div>
  );
};

export default Login;
