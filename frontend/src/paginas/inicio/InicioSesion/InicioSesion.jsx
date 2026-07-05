import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Importa useNavigate correctamente
import "./InicioSesion.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const InicioSesion = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [NombreUsuario, setNombreUsuario] = useState("");
  const [PasswordHash, setPasswordHash] = useState("");
  const [error, setError] = useState("");
  const [mostrarPasswordHash, setMostrarPasswordHash] = useState(false);
  const [cargando, setCargando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await iniciarSesion();
  };

  async function iniciarSesion() {
    setCargando(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/Usuarios/Login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ NombreUsuario, PasswordHash }),
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error("Usuario o contraseña incorrectos.");
      }
      if (!response.ok) {
        throw new Error(data.message || "Error en el servidor.");
      }

      // Guardado seguro del token
      localStorage.setItem("Token", data.Token);
      localStorage.setItem("Nombre", data.Nombre);
      localStorage.setItem("Apellido", data.Apellido);
      localStorage.setItem("PlanActual", data.PlanActual);
      localStorage.setItem("IdRol", data.IdRol); // <--- Guardamos esto
      window.dispatchEvent(new Event("finanzarc-auth"));
      
      // Limpiar estados
      setNombreUsuario("");
      setPasswordHash("");
      onClose();

      // Navegación limpia
      navigate("/principal");

    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="capa-modal-login" onClick={onClose}>
      <div className="contenido-modal-login" onClick={(e) => e.stopPropagation()}>
        <button className="boton-cerrar-modal" onClick={onClose}>×</button>

        <div className="login-form-container">
          <h2 className="login-titulo">Bienvenido</h2>
          <p className="login-subtitulo">Ingresa a tu cuenta premium</p>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <p className="login-error-msg">{error}</p>}

            <div className="formulario-grupo">
              <label>Nombre de Usuario:</label>
              <input
                type="text"
                value={NombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="Ej: ramiro_dev"
                required
              />
            </div>

            <div className="formulario-grupo">
              <label>Contraseña</label>
              <div className="input-con-icono">
                <input
                  type={mostrarPasswordHash ? "text" : "password"}
                  value={PasswordHash}
                  onChange={(e) => setPasswordHash(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="btn-ver-password"
                  onClick={() => setMostrarPasswordHash(!mostrarPasswordHash)}
                  tabIndex="-1"
                >
                  {mostrarPasswordHash ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            <Link to="/crear-cuenta" className="gold-link" onClick={onClose}>
              ¿No tienes cuenta todavía?
            </Link>

            <button
              type="submit"
              className="boton-primario login-btn-full"
              disabled={cargando}
            >
              {cargando ? "Verificando..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InicioSesion;

