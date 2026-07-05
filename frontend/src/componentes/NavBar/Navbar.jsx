import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Agregamos useLocation
import "../NavBar/Navbar.css";
import InicioSesion from "../../paginas/inicio/InicioSesion/InicioSesion";

const Navbar = () => {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("Token"));
  const [idRol, setIdRol] = useState(Number(localStorage.getItem("IdRol")) || null);

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          // Calculamos la posición del elemento menos el alto del navbar (ej: 80px)
          const yOffset = -80;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

          window.scrollTo({ top: y, behavior: "smooth" });
        }, 100);
      }
    }
  }, [hash]);

  useEffect(() => {
    const checkToken = () => {
      setIsLoggedIn(!!localStorage.getItem("Token"));
      setIdRol(Number(localStorage.getItem("IdRol")) || null);
    };
    window.addEventListener("storage", checkToken);
    window.addEventListener("finanzarc-auth", checkToken);
    return () => {
      window.removeEventListener("storage", checkToken);
      window.removeEventListener("finanzarc-auth", checkToken);
    };
  }, []);

  const handleLoginClick = () => {
    closeMobileMenu();
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      setModalAbierto(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("IdRol");
    setIsLoggedIn(false);
    setIdRol(null);
    closeMobileMenu();
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    document.body.style.overflow = !isMobileMenuOpen ? "hidden" : "auto";
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = "auto";
  };

  return (
    <header className="navbar-container">
      <nav className="nav-content">
        <div className="logo-section">
          <p className="logo-text" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
            FinanzARC
          </p>
        </div>
        <div className="menu-pill desktop-menu">
          {isLoggedIn ? (
            <>
              <Link to="/principal" className="nav-link">Principal</Link>
              <Link to="/ingreso" className="nav-link">Ingreso</Link>
              <Link to="/gasto" className="nav-link">Gasto</Link>
              {idRol === 4 && <Link to="/admin" className="nav-link">Admin</Link>}
              <Link to="/perfil" className="nav-link">Perfil</Link>
            </>
          ) : (
            <>
              <Link to="/#inicio" className="nav-link">Inicio</Link>
              <Link to="/#servicio" className="nav-link">Servicios</Link>
              <Link to="/#propuesta" className="nav-link">Propuesta</Link>
              <Link to="/#contacto" className="nav-link">Contactanos</Link>
            </>
          )}
        </div>
        <div className="auth-section desktop-menu">
          <div className="">
            {isLoggedIn ? (
              <button style={{ display: 'none' }}>
                Cerrar Sesión
              </button>
            ) : (
              <button onClick={handleLoginClick} className="login-button">
                Ingreso
              </button>
            )}
          </div>
        </div>
        <div
          className={`hamburger-icon ${isMobileMenuOpen ? "open" : ""}`}
          onClick={toggleMobileMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="mobile-menu-content">
            {isLoggedIn ? (
              <>
                <Link to="/principal" className="mobile-link" onClick={closeMobileMenu}>Principal</Link>
                <Link to="/ingreso" className="mobile-link" onClick={closeMobileMenu}>Ingresos</Link>
                <Link to="/gasto" className="mobile-link" onClick={closeMobileMenu}>Gastos</Link>
                {idRol === 4 && <Link to="/admin" className="mobile-link" onClick={closeMobileMenu}>Admin</Link>}
                <Link to="/perfil" className="mobile-link" onClick={closeMobileMenu}>Mi Perfil</Link>
                <button onClick={handleLogout} className="mobile-login-button logout-variant">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>

                <Link to="/#inicio" className="mobile-link" onClick={closeMobileMenu}>Inicio</Link>
                <Link to="/#servicio" className="mobile-link" onClick={closeMobileMenu}>Servicios</Link>
                <Link to="/#carrousel" className="mobile-link" onClick={closeMobileMenu}>Propuesta</Link>
                <Link to="/#contacto" className="mobile-link" onClick={closeMobileMenu}>Contactanos</Link>
                <button onClick={handleLoginClick} className="mobile-login-button">
                  Ingreso
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <InicioSesion
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />

    </header>
  );
};

export default Navbar;
