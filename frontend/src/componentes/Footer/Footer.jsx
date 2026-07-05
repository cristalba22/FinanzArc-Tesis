import React, { useState } from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import emailjs from '@emailjs/browser';
import { FaWhatsapp, FaEnvelope, FaFileDownload } from 'react-icons/fa';

const Footer = () => {
  const [modalContactoAbierto, setModalContactoAbierto] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });

  const equipo = [
    { nombre: "Agustin", rol: "Full Stack Developer", link: "https://www.linkedin.com/in/agustin-garcia-2a7478328/", texturaFondo: "/Imagenes/agustin.webp" },
    { nombre: "Ramiro", rol: "Frontend Developer", link: "https://www.linkedin.com/in/ramiro-avila-475648348/", texturaFondo: "/Imagenes/ramiro.webp" },
    { nombre: "Cristian", rol: "Backend Developer", link: "https://www.linkedin.com/in/", texturaFondo: "/Imagenes/cristian.webp" },
    { nombre: "Mateo", rol: "UI/UX Designer", link: "https://www.linkedin.com/in/", texturaFondo: "/Imagenes/mateo.webp" },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const enviarEmail = (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    emailjs.send(
      'service_abjyf0v',
      'template_qu5abid',
      {
        nombre: formData.nombre,
        email: formData.email,
        mensaje: formData.mensaje
      },
      'dzWAc_iLwA5laMd8_'
    )
      .then(() => {
        alert("¡Mensaje enviado con éxito!");
        setModalContactoAbierto(false);
        setFormData({ nombre: "", email: "", mensaje: "" });
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Hubo un error al enviar el mensaje.");
        setErrorEnvio(true);
      });
  };

  return (
    <div className="layou-display" id="contacto">
      <footer className="footer-principal">
        <div className="footer-contenido">
          <div className="footer-col-marca">
            <div className="Titulo"><h4>FinanzARC</h4></div>
            <p className="descripcion-footer">"Gestión financiera para transformar tu futuro económico."</p>
          </div>

          <div className="footer-col-equipo">
            <h4>Nuestro Equipo</h4>
            <div className="grid-equipo">
              {equipo.map((persona, index) => (
                <a key={index} href={persona.link} target="_blank" rel="noopener noreferrer" className="tarjeta-miembro">
                  <div className="avatar-placeholder" style={{ backgroundImage: `url('${persona.texturaFondo}')` }}></div>
                  <div className="info-miembro">
                    <h5>{persona.nombre}</h5>
                    <p>{persona.rol}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col-links">
            <h4>Contáctanos</h4>
            <nav style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

              {/* WhatsApp */}
              <a
                href="https://wa.me/543516184200?text=Hola,%20vengo%20de%20la%20web"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link-interactivo"
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <FaWhatsapp size={18} /> +54 3516 184 200
              </a>

              {/* Email (Botón) */}
              <button
                className="footer-link-interactivo"
                onClick={() => setModalContactoAbierto(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: '10px'
                }}
              >
                <FaEnvelope size={18} /> Contactar vía email
              </button>

              {/* Descarga */}
              <a
                href="/presentacion.pdf"
                download="Presentacion_FinanzARC.pdf"
                className="footer-link-interactivo"
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <FaFileDownload size={18} /> Cómo funciona nuestro servicio
              </a>

            </nav>
          </div>
        </div>

        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} FinanzARC. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* MODAL DE CONTACTO */}
      {modalContactoAbierto && (
        <div className="capa-modal" onClick={() => { setModalContactoAbierto(false); setErrorEnvio(false); }}>
          <div className="contenido-modal" onClick={(e) => e.stopPropagation()}>

            {errorEnvio ? (
              // PLAN B: SE MUESTRA SI LA API FALLA
              <div className="mensaje-error-container" style={{ textAlign: 'center', padding: '20px' }}>
                <h3 style={{ color: '#d4af37' }}>¡Lo sentimos!</h3>
                <p style={{ color: '#ffffff', marginBottom: '20px' }}>No pudimos enviar el mensaje automáticamente. Por favor, contáctanos directamente a nuestro correo:</p>
                <a
                  href="mailto:tuemail@gmail.com?subject=Consulta%20desde%20FinanzARC&body=Hola,%20quisiera%20consultar%20sobre..."
                  className="boton-primario"
                  style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 20px', borderRadius: '6px' }}
                >
                  Enviar Email Manualmente
                </a>
                <button
                  type="button"
                  className="boton-secundario"
                  style={{ marginTop: '15px', width: '100%' }}
                  onClick={() => { setErrorEnvio(false); setModalContactoAbierto(false); }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              // FORMULARIO NORMAL
              <>
                <h3>Envíanos un mensaje</h3>
                <form onSubmit={enviarEmail} className="formulario-cuerpo">
                  {/* Campo Nombre */}
                  <div className="formulario-grupo">
                    <label>Nombre</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      maxLength="25"
                      placeholder="Tu nombre (máx 25 car.)"
                    />
                  </div>

                  {/* Campo Email */}
                  <div className="formulario-grupo">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="tu@email.com"
                    />
                  </div>

                  {/* Campo Mensaje */}
                  <div className="formulario-grupo">
                    <label>Mensaje</label>
                    <textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      required
                      placeholder="¿En qué podemos ayudarte?"
                      rows="4"
                    />
                  </div>

                  {/* Botones */}
                  <div className="formulario-acciones">
                    <button
                      type="button"
                      className="boton-secundario"
                      onClick={() => setModalContactoAbierto(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="boton-primario">Enviar</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Footer;
