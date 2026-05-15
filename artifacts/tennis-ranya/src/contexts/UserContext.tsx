import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useLocation } from "wouter";

export type UserRole = "admin" | "cashier";

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  permissions: string[];
}

interface UserContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isLoading: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const { data, isLoading, error } = useGetMe({
    query: {
      queryKey: ["me"],
      retry: false,
    },
  });

  useEffect(() => {
    if (data) {
      setUser(data as AuthUser);
    } else if (error) {
      setUser(null);
    }
  }, [data, error]);

  function logout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setUser(null);
        setLocation("/login");
      },
    });
  }

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
