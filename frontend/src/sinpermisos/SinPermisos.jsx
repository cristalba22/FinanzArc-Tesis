import React from 'react';
import { useNavigate } from 'react-router-dom';

const SinPermisos = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '75vh',
      backgroundColor: '#000000', // Fondo negro de tu app
      color: '#ffffff',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a', // Fondo gris oscuro como tus paneles
        border: '1px solid #d4af37', // Borde dorado
        padding: '40px 30px',
        borderRadius: '15px',
        textAlign: 'center',
        maxWidth: '450px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
        fontFamily: 'sans-serif'
      }}>
        {/* Ícono de candado o alerta */}
        <div style={{ fontSize: '50px', marginBottom: '15px', color: '#d4af37' }}>
          🔒
        </div>
        
        <h2 style={{ 
          color: '#d4af37', 
          margin: '0 0 15px 0', 
          fontSize: '24px',
          letterSpacing: '1px'
        }}>
          ACCESO RESTRINGIDO
        </h2>
        
        <p style={{ 
          color: '#cccccc', 
          fontSize: '16px', 
          lineHeight: '1.6',
          marginBottom: '30px' 
        }}>
          No tiene permisos para este apartado. Por favor, asegúrese de haber creado su cuenta y haber iniciado sesión correctamente. 
        </p>

        {/* Botón Dorado que combina con tu diseño */}
        <button 
          onClick={() => navigate('/crear-cuenta')}
          style={{
            backgroundColor: '#d4af37',
            color: '#000000',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#b8932e'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#d4af37'}
        >
          Crear cuenta
        </button>
      </div>
    </div>
  );
};

export default SinPermisos;