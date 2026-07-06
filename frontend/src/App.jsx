import { BrowserRouter, Routes, Route } from 'react-router-dom';  
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from './componentes/NavBar/Navbar';
import Footer from './componentes/Footer/Footer';

import Inicio from './paginas/inicio/Inicio';
import Registro from './paginas/inicio/InicioSesion/InicioSesion';
import CrearCuenta from './paginas/CrearCuenta/CrearCuenta';
import Principal from './paginas/Principal/General/General';
import Comparativa from "./paginas/Principal/Comparativa/Comparativa";
import Ingreso from './paginas/Principal/Ingreso/Ingreso';
import Gasto from './paginas/Principal/Gasto/Gasto';
import Perfil from './paginas/perfil/Perfil';
import InicioSesion from './paginas/inicio/InicioSesion/InicioSesion';
import PlanesCompra from './paginas/planes/planes';
import Archivos from './paginas/Principal/Archivos/Archivos';

import AdminDashboard from './paginas/Admin/AdminDashboard';

import RutaProtegida from './RutaProtegida'; 
import SinPermisos from './sinpermisos/SinPermisos';


function App() {
  return (
    <BrowserRouter>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      <Navbar />

      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/" element={<Inicio />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/inicio-sesion" element={<InicioSesion />} />
        <Route path="/crear-cuenta" element={<CrearCuenta />} />
        <Route path="/planes" element={<PlanesCompra />} />
        <Route path="/sin-permisos" element={<SinPermisos />} />

        {/* --- RUTAS PRIVADAS --- */}
        <Route element={<RutaProtegida />}>
        
          <Route path="/dashboard" element={<div style={{ padding: '50px' }}><h1>Bienvenido a tu Panel</h1></div>} />
          <Route path="/principal" element={<Principal />} />
          <Route path="/comparativa" element={<Comparativa />} />
          <Route path="/ingreso" element={<Ingreso />} />
          <Route path="/gasto" element={<Gasto />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/archivos" element={<Archivos />} />
          <Route path="/admin" element={<AdminDashboard />} />

        </Route>

      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;