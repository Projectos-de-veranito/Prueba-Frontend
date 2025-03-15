import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import "./global.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

// ✅ Este componente se encarga de la navegación según el estado del usuario
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard /> : <Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
