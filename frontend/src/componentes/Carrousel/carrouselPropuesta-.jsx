import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "./carrouselPropuesta.css";

const CarrouselPropuesta = () => {
  const itemsPropuesta = [
    {
      logo: "/Imagenes/Logo 1.webp",
      title: "BALANCE FINANCIERO",
      texto: "Obtenga su balance financiero cruzando los ingresos y gastos de un mes específico, y mida su crecimiento analizando la comparativa histórica de sus ingresos y gastos mes a mes.",
      tilde: "✓ Trazabilidad absoluta y respaldo documental",
    },
    {
      logo: "/Imagenes/Logo 3.webp",
      title: "HISTORIAL DE MOVIMIENTOS",
      texto: "El historial de movimientos se construye registrando sus ingresos y gastos mediante la carga manual en la plataforma y su posterior vinculación a su respectivo comprobante.",
      tilde: "✓ Cada transacción respaldada por su comprobante",
    },
    {
      logo: "/Imagenes/Logo 4.webp",
      title: "OBJETIVOS DE AHORRO",
      texto: "Defina sus objetivos de ahorro fijando un monto objetivo y una fecha límite. Además, el sistema calcula automáticamente la conversión a Peso Argentino (ARS) en tiempo real si decide ahorrar en dólares o euros.",
      tilde: "✓ Metas claras con conversión automática",
    },
    {
      logo: "/Imagenes/Logo 2.webp",
      title: "CONTROL DE DIVISAS",
      texto: "Lleve el control exacto de sus divisas gracias a nuestro sistema de sincronización vía API, que actualiza las cotizaciones en tiempo real.",
      tilde: "✓ Elimina el impacto de la inflación",
    },
  ];

  return (
    <section className="contenedor-carrusel-movil" id="carrousel">
      <div className="introduccion-carrusel">
        <h1>Tome el control absoluto de su patrimonio con FinanzARC</h1>
        <p>
          En FinanzARC impulsamos su economía con herramientas diseñadas para llevar sus finanzas personales o las de su empresa al siguiente nivel.
        </p>
      </div>

      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 10000, disableOnInteraction: false }}
        breakpoints={{
          0: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          720: {
            slidesPerView: 2.3,
            spaceBetween: 30,
          },
        }}
        className="swiper-propuesta"
      >
        {itemsPropuesta.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="tarjeta-propuesta">
              <div className="logo-container">
                <img
                  src={item.logo}
                  alt={item.title}
                  className="logo-img"
                  style={{
                    width: '110px',
                    height: '110px',
                    maxWidth: '150px',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <h2>{item.title}</h2>
              <p>{item.texto}</p>
              <span className="tilde-texto">{item.tilde}</span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

    </section>
  );
};

export default CarrouselPropuesta;
