import React from 'react';
import { Outlet } from 'react-router-dom';
import SinPermisos from './sinpermisos/SinPermisos';

const RutaProtegida = () => {
  const token = localStorage.getItem("Token");
  
  return token ? <Outlet /> : <SinPermisos />;
};

export default RutaProtegida;