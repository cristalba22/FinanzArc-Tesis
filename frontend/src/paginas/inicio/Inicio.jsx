import React from "react";
import "./Inicio.css";
import CarrouselPropuesta from "../../componentes/Carrousel/carrouselPropuesta-";

const Inicio = () => {
  return (
    <div className="inicio" >

      <div className="main-wrapper">
        {/* SECCIÓN HERO */}
        <div className="containerInicio" id="inicio">
          <div className="contenedorBackground">
            <img
              src="/Imagenes/FondoDeInicio.JPEG"
              alt="Hero"
            />
          </div>
          <div className="contenedorLogos">
            <div className="logos">
              <img src="/Imagenes/Logo 1.webp" alt="Logo 1" />
              <img src="/Imagenes/Logo 2.webp" alt="Logo 2" />
              <img src="/Imagenes/Logo 3.webp" alt="Logo 3" />
              <img src="/Imagenes/Logo 4.webp" alt="Logo 4" />
            </div>
          </div>
        </div>

        <div className="containerPropuesta" id="propuesta">
          <div className="containerPropuestaIzquierda">
            <div className="introduccion">
              <h1>Tome el control absoluto de su patrimonio con FinanzARC</h1>
              <p>En FinanzARC impulsamos su economía con herramientas diseñadas para llevar sus finanzas personales o las de su empresa al siguiente nivel.</p>
            </div>
            <div className="items">
              <div className="item1">
                <h2>BALANCE FINANCIERO</h2>
                <p>Obtenga su balance financiero cruzando los ingresos y gastos de un mes específico, y mida su crecimiento analizando la comparativa histórica de sus ingresos y gastos mes a mes.</p>
              </div>
              <div className="item2">
                <h2>HISTORIAL DE MOVIMIENTOS</h2>
                <p>El historial de movimientos se construye registrando sus ingresos y gastos mediante la carga manual en la plataforma y su posterior vinculación a su respectivo comprobante.</p>
              </div>
              <div className="item3">
                <h2>OBJETIVOS DE AHORRO</h2>
                <p>Defina sus objetivos de ahorro fijando un monto objetivo y una fecha límite. Además, el sistema calcula automáticamente la conversión a Peso Argentino (ARS) en tiempo real si decide ahorrar en dólares o euros.</p>
              </div>
              <div className="item4">
                <h2>CONTROL DE DIVISAS</h2>
                <p>Lleve el control exacto de sus divisas gracias a nuestro sistema de sincronización vía API, que actualiza las cotizaciones en tiempo real.</p>
              </div>
            </div>
          </div>
          <div className="containerPropuestaDerecha">
            <img src="/Imagenes/ImagenSobrePatrimonio.jpeg" alt="" />
          </div>
        </div>

        <div className="propuesta-solo-movil">
          <CarrouselPropuesta />
        </div>

      </div>

    </div>
  );
};

export default Inicio;
