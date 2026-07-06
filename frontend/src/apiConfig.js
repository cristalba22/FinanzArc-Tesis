
export const obtenerTasas = async () => {
  try {
    const [resUsd, resEur] = await Promise.all([
      fetch("https://dolarapi.com/v1/dolares/blue"),
      fetch("https://dolarapi.com/v1/cotizaciones/eur")
    ]);
    if (!resUsd.ok || !resEur.ok) {
      throw new Error("Error en la conexión con DolarAPI");
    }

    const dataUsd = await resUsd.json();
    const dataEur = await resEur.json();
    return {
      USD: Number(dataUsd.venta),
      EUR: Number(dataEur.venta)
    };

  } catch (error) {
    console.error("Error al obtener tasas de DolarAPI, usando respaldo:", error);
    // Mantenemos tus valores predefinidos por si la API falla
    return { USD: 1450, EUR: 1650 };
  }
};