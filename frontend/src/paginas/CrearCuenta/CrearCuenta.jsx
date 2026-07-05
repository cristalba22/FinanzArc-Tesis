import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PhoneInputPkg from "react-phone-input-2";


const PhoneInput = PhoneInputPkg.default ? PhoneInputPkg.default : PhoneInputPkg;

import "react-phone-input-2/lib/style.css";
import "./CrearCuenta.css";

import InicioSesion from "../inicio/InicioSesion/InicioSesion";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const CrearCuenta = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    nombreUsuario: "",
    password: "",
    confirmarPassword: ""
  });

  const [modalLoginAbierto, setModalLoginAbierto] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (value) => {
    setFormData({ ...formData, telefono: value });
  };

  // --- LÓGICA DE VALIDACIÓN DE CONTRASEÑA ---

  const secuenciasComunes = ["123456", "abcdef", "qwerty", "password", "admin", "111111"];

  const checkRequirements = (pwd) => {
    const hasText = pwd.length > 0;
    const lowerPwd = pwd.toLowerCase();

    // Validar si contiene datos personales (solo si el usuario ya los escribió)
    const nombreLower = formData.nombre.trim().toLowerCase();
    const apellidoLower = formData.apellido.trim().toLowerCase();
    const emailPrefix = formData.email.split('@')[0].toLowerCase();

    const contieneNombre = nombreLower.length > 2 && lowerPwd.includes(nombreLower);
    const contieneApellido = apellidoLower.length > 2 && lowerPwd.includes(apellidoLower);
    const contieneEmail = emailPrefix.length > 2 && lowerPwd.includes(emailPrefix);
    
    const contieneSecuencia = secuenciasComunes.some(seq => lowerPwd.includes(seq));

    return {
      length: pwd.length >= 8 && pwd.length <= 50,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9\s]/.test(pwd), // Caracteres que no son alfanuméricos ni espacios
      noSpaces: hasText && !/\s/.test(pwd),
      segura: hasText && !contieneNombre && !contieneApellido && !contieneEmail && !contieneSecuencia
    };
  };

  const reqs = checkRequirements(formData.password);
  const todasReglasCumplidas = Object.values(reqs).every(Boolean);

  // Calcular la fortaleza (0 a 5)
  const calculateStrength = () => {
    if (formData.password.length === 0) return { score: 0, text: "", color: "transparent" };
    
    let score = 0;
    if (reqs.length) score += 1;
    if (reqs.upper && reqs.lower) score += 1;
    if (reqs.number) score += 1;
    if (reqs.special) score += 1;
    if (reqs.segura && reqs.noSpaces) score += 1;

    switch (score) {
      case 0:
      case 1: return { score, text: "Muy Débil", color: "#ff4d4d", width: "20%" };
      case 2: return { score, text: "Débil", color: "#ff944d", width: "40%" };
      case 3: return { score, text: "Media", color: "#ffd24d", width: "60%" };
      case 4: return { score, text: "Fuerte", color: "#b3ff66", width: "80%" };
      case 5: return { score, text: "Muy Fuerte", color: "#4dff4d", width: "100%" };
      default: return { score: 0, text: "", color: "transparent", width: "0%" };
    }
  };

  const strength = calculateStrength();
  
  // Validar coincidencia en tiempo real
  const coinciden = formData.password.length > 0 && formData.confirmarPassword.length > 0 && formData.password === formData.confirmarPassword;
  const noCoinciden = formData.password.length > 0 && formData.confirmarPassword.length > 0 && formData.password !== formData.confirmarPassword;

  // --- ENVÍO DEL FORMULARIO ---

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!todasReglasCumplidas) {
      toast.error("La contraseña no cumple los requisitos mínimos de seguridad.");
      return;
    }

    if (formData.password !== formData.confirmarPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    const inicialApellido = formData.apellido.trim().charAt(0).toUpperCase();
    const sufijoUnico = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const urlCarpetaGenerada = `${formData.nombre.trim()}${inicialApellido}_${sufijoUnico}`;

    const usuarioParaRegistrar = {
      Nombre: formData.nombre,
      Apellido: formData.apellido,
      Email: formData.email,
      Telefono: formData.telefono,
      NombreUsuario: formData.nombreUsuario,
      PasswordHash: formData.password,
      UrlCarpeta: urlCarpetaGenerada,
      FechaAlta: new Date().toISOString(),
      Activo: true,
      IdRol: 1,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/Usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuarioParaRegistrar)
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem("Token", data.Token);
        localStorage.setItem("Nombre", formData.nombre);
        localStorage.setItem("Apellido", formData.apellido);
        localStorage.setItem("Usuario", data.NombreUsuario);
        localStorage.setItem("PlanActual", "Plan Esencial");
        localStorage.setItem("IdRol", "1");
        window.dispatchEvent(new Event("finanzarc-auth"));

        toast.success(`¡Bienvenido a FinanzARC, ${formData.nombre}!`, {
          autoClose: 3000,
        });

        navigate("/principal");

        setTimeout(() => {
          window.location.reload();
        }, 100);

      } else {
        const errorText = await response.text();
        let mensajeError = "Hubo un problema al registrar el usuario.";

        try {
          const errorData = JSON.parse(errorText);
          mensajeError = errorData.message || errorData.Message || mensajeError;
        } catch {
          if (errorText) mensajeError = errorText;
        }

        console.error("Error del servidor:", mensajeError);
        toast.error(mensajeError);
      }
    } catch (error) {
      console.error("Error de red:", error);
      toast.error("No se pudo conectar con el servidor.");
    }
  };

  // --- COMPONENTES VISUALES ---
  
  const CheckItem = ({ cumple, texto }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: cumple ? "#4dff4d" : "#ff4d4d", margin: "2px 0" }}>
      <span>{cumple ? "✓" : "✗"}</span>
      <span style={{ color: "#d1d1d1" }}>{texto}</span>
    </div>
  );

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <h2>Crea tu <span className="gold-text">Cuenta</span></h2>
          <p>Únete a la gestión financiera inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="input-box">
              <label>Nombre</label>
              <input type="text" name="nombre" placeholder="Agustin" onChange={handleChange} required />
            </div>
            <div className="input-box">
              <label>Apellido</label>
              <input type="text" name="apellido" placeholder="Garcia" onChange={handleChange} required />
            </div>
          </div>

          <div className="input-box">
            <label>Correo Electrónico</label>
            <input type="email" name="email" placeholder="nombre@ejemplo.com" onChange={handleChange} required />
          </div>

          <div className="input-box">
            <label>Teléfono Móvil (Latinoamérica)</label>
            <PhoneInput
              country={"ar"}
              onlyCountries={["ar"]}
              value={formData.telefono}
              onChange={handlePhoneChange}
              inputProps={{ name: "telefono", required: true }}
              containerClass="phone-container-custom"
              inputClass="phone-input-custom"
              buttonClass="phone-button-custom"
              dropdownClass="phone-dropdown-custom"
            />
          </div>

          <div className="input-box">
            <label>Nombre de Usuario</label>
            <input type="text" name="nombreUsuario" placeholder="agusting_dev" onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="input-box" style={{ width: "100%" }}>
              <label>Contraseña</label>
              <input type="password" name="password" placeholder="••••••••" onChange={handleChange} required />
              
              {/* BARRA DE FORTALEZA */}
              {formData.password.length > 0 && (
                <div style={{ marginTop: "8px", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px", color: strength.color }}>
                    <span>Fortaleza:</span>
                    <strong>{strength.text}</strong>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#333", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: strength.width, height: "100%", backgroundColor: strength.color, transition: "width 0.3s ease, background-color 0.3s ease" }}></div>
                  </div>
                </div>
              )}

              {/* LISTA DE REQUISITOS */}
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", padding: "8px", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "6px" }}>
                <CheckItem cumple={reqs.length} texto="Entre 8 y 50 caracteres" />
                <CheckItem cumple={reqs.upper} texto="Al menos una mayúscula" />
                <CheckItem cumple={reqs.lower} texto="Al menos una minúscula" />
                <CheckItem cumple={reqs.number} texto="Al menos un número" />
                <CheckItem cumple={reqs.special} texto="Al menos un carácter especial" />
                <CheckItem cumple={reqs.noSpaces} texto="Sin espacios" />
                <CheckItem cumple={reqs.segura} texto="Sin datos personales ni secuencias fáciles" />
              </div>
            </div>

            <div className="input-box" style={{ width: "100%" }}>
              <label>Confirmar</label>
              <input type="password" name="confirmarPassword" placeholder="••••••••" onChange={handleChange} required />
              
              {/* INDICADOR DE COINCIDENCIA */}
              {coinciden && (
                <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "#4dff4d", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>✓</span> <span>Las contraseñas coinciden</span>
                </div>
              )}
              {noCoinciden && (
                <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "#ff4d4d", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>✗</span> <span>Las contraseñas no coinciden</span>
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-gold-register"
            disabled={!todasReglasCumplidas || !coinciden}
            style={{ opacity: (!todasReglasCumplidas || !coinciden) ? 0.6 : 1, cursor: (!todasReglasCumplidas || !coinciden) ? "not-allowed" : "pointer", marginTop: "15px" }}
          >
            Registrarme
          </button>
        </form>

        <p className="footer-text">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            className="gold-link"
            onClick={() => setModalLoginAbierto(true)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              font: 'inherit',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >
            Inicia Sesión
          </button>
        </p>
      </div>

      <InicioSesion
        isOpen={modalLoginAbierto}
        onClose={() => setModalLoginAbierto(false)}
      />
    </div>
  );
};

export default CrearCuenta;

