// Traemos las apis que vamos a consumir
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const API_ENDPOINTS = {
  login: "/auth/login",
  register: "/auth/register",
  gastos: "/Gastos",
  ingresos: "/Ingresos",
  ahorros: "/Ahorros",
  perfil: "/Perfil"
};

