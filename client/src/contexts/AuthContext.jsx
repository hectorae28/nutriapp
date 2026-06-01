import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión al montar + refrescar CSRF para que los POST funcionen
  useEffect(() => {
    api.get('/auth/csrf/')          // renueva el CSRF cookie tras cualquier recarga
      .catch(() => {})              // ignorar si falla (offline, etc.)
      .finally(() =>
        api
          .get('/auth/me/')
          .then((data) => {
            setUser(data.user);
            setGroups(data.groups);
          })
          .catch(() => {
            setUser(null);
            setGroups([]);
          })
          .finally(() => setLoading(false))
      );
  }, []);

  const login = async (username, password) => {
    await api.get('/auth/csrf/');
    const data = await api.post('/auth/login/', { username, password });
    setUser(data.user);
    setGroups(data.groups);
    return data;
  };

  const logout = async () => {
    await api.post('/auth/logout/', {}).catch(() => {});
    setUser(null);
    setGroups([]);
  };

  const isNutricionista = groups.includes('Nutricionista');
  const isPaciente = groups.includes('Paciente');
  const isAdmin = groups.includes('Admin') || user?.is_superuser === true;

  return (
    <AuthContext.Provider
      value={{ user, groups, loading, login, logout, isNutricionista, isPaciente, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
