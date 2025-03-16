import { useState } from "react";
import AuthForm from "../components/auth/AuthForm";
import authService from "../services/authService";
import Dashboard from "./Dashboard";
import logo from "../assets/logo.webp";
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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 w-full">
      <img 
        src={logo} 
        alt="FlowChat Logo" 
        className="mb-6 md:mb-8 w-32 md:w-40 lg:w-48" 
      />
      
      <div className="w-full max-w-md">
        <AuthForm 
          type={isRegister ? "register" : "login"} 
          onSubmit={handleSubmit} 
        />
      </div>
  
      {error && (
        <p className="mt-3 text-red-500 text-sm md:text-base text-center">
          {error}
        </p>
      )}
  
      <button 
        onClick={handleToggleForm} 
        className="mt-4 text-sm md:text-base text-[var(--accent-color)] hover:underline focus:outline-none rounded px-2 py-1"
      >
        {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
      </button>
    </div>
  );
};

export default Login;
