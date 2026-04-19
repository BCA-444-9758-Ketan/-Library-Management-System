import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, endpoints, toUiRole } from "@/lib/api";

export type Role = "student" | "librarian" | "admin";
export interface User {
  id: string | number;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: Role) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string | number;
      name: string;
      email: string;
      role: string;
    };
  };
}

interface RegisterResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string | number;
      name: string;
      email: string;
      role: string;
    };
  };
}

const normalizeUser = (rawUser: {
  id: string | number;
  name: string;
  email: string;
  role: string;
}): User => ({
  id: rawUser.id,
  name: rawUser.name,
  email: rawUser.email,
  role: toUiRole(rawUser.role),
});

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("smartlib_token");
    const u = localStorage.getItem("smartlib_user");
    if (t && u) {
      setToken(t);
      try {
        const parsed = JSON.parse(u);
        setUser(normalizeUser(parsed));
      } catch {
        // noop
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: Role) => {
    const { data } = await api.post<LoginResponse>(endpoints.auth.login, { email, password });
    const { token: tk, user: rawUser } = data.data;
    const usr = normalizeUser(rawUser);

    if (role && usr.role !== role) {
      throw new Error(`This account is ${usr.role}. Please select the correct role tab.`);
    }

    localStorage.setItem("smartlib_token", tk);
    localStorage.setItem("smartlib_user", JSON.stringify(usr));
    setToken(tk);
    setUser(usr);
    return usr;
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post<RegisterResponse>(endpoints.auth.register, { name, email, password });
    const { token: tk, user: rawUser } = data.data;
    const usr = normalizeUser(rawUser);

    localStorage.setItem("smartlib_token", tk);
    localStorage.setItem("smartlib_user", JSON.stringify(usr));
    setToken(tk);
    setUser(usr);
    return usr;
  };

  const logout = () => {
    localStorage.removeItem("smartlib_token");
    localStorage.removeItem("smartlib_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
