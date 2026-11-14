
import { useState } from "react";
import Login from "./pages/Login";
import OrdersDashboard from "./components/OrdersDashboard";
import {
  TOKEN_KEY,
  type StaffUser,
} from "./services/api";
import "./App.css";

const USER_KEY = "sungrid_staff_user";

function getSavedUser(): StaffUser | null {
  if (!localStorage.getItem(TOKEN_KEY)) return null;

  try {
    const saved = localStorage.getItem(USER_KEY);
    if (!saved) return null;

    const user = JSON.parse(saved) as StaffUser;

    if (
      typeof user.id !== "number" ||
      typeof user.name !== "string" ||
      user.role !== "staff"
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState<StaffUser | null>(
    getSavedUser
  );

  function handleLogin(staff: StaffUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(staff));
    setUser(staff);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <OrdersDashboard
      user={user}
      onLogout={handleLogout}
    />
  );
}
