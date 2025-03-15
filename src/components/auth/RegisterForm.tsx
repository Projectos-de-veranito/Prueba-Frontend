import { useState } from "react";
import AuthForm from "./AuthForm";
import authService from "../../services/authService";
import Chat from "../../pages/Chat";

const RegisterForm = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (email: string, password: string, username?: string) => {
    try {
      await authService.register(email, password, username || "");
      setIsRegistered(true); // Cambia el estado para mostrar el Chat
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    }
  };

  // Si el usuario ya se registró, mostrar el componente Chat en lugar del formulario
  if (isRegistered) {
    return <Chat />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <AuthForm type="register" onSubmit={handleRegister} />
      
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default RegisterForm;
