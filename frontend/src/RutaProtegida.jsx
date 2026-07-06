import React from 'react';
import { Outlet } from 'react-router-dom';
import SinPermisos from './sinpermisos/SinPermisos'; // Importamos tu nueva interfaz linda

const RutaProtegida = () => {
  const token = localStorage.getItem("Token");

  // SI HAY TOKEN: Lo dejamos pasar al apartado (dashboard, archivos, etc.)
  // NO HAY TOKEN: Le clavamos la interfaz de "No tiene permisos" sin moverlo de la URL
  return token ? <Outlet /> : <SinPermisos />;
};

export default RutaProtegida;