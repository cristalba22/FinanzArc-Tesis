import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

//DatePicker
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";

registerLocale("es", es);

import "./General.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const API_ENDPOINTS = {
  gastos: "/Gasto",
  ingresos: "/Ingreso",
  usuarios: "/Usuarios",
  ahorros: "/MetaAhorro",
  transacciones: "/Transacciones"
};


const GastoIngreso = () => {
  const [mostrarSaludo, setMostrarSaludo] = useState(true);

  const [datosGastos, setDatosGastos] = useState([]);
  const [datosIngresos, setDatosIngresos] = useState([]);
  const [metasAhorro, setMetasAhorro] = useState([]);

  const [idUsuarioActual, setIdUsuarioActual] = useState(null);

  const [cotizaciones, setCotizaciones] = useState({
    USD: 1450,
    EUR: 1650
  });
  const [rolUsuario, setRolUsuario] = useState(null);

  const obtenerCotizaciones = async () => {
    try {
      const [resUsd, resEur] = await Promise.all([
        fetch("https://dolarapi.com/v1/dolares/blue"),
        fetch("https://dolarapi.com/v1/cotizaciones/eur")
      ]);

      if (!resUsd.ok || !resEur.ok) throw new Error("Error en la conexión");

      const dataUsd = await resUsd.json();
      const dataEur = await resEur.json();

      const nuevasCotizaciones = {
        USD: Number(dataUsd.venta).toFixed(2),
        EUR: Number(dataEur.venta).toFixed(2)
      };

      setCotizaciones(nuevasCotizaciones);
      return nuevasCotizaciones;
    } catch (error) {
      console.error("Error, usando respaldo:", error);
      const respaldo = { USD: "1450.00", EUR: "1650.00" };
      setCotizaciones(respaldo);
      return respaldo;
    }
  };
  const formatMontoParaInput = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const stringVal = val.toString();
    const parts = stringVal.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.length > 1
      ? parts[0] + "," + parts[1]
      : (stringVal.endsWith(".") ? parts[0] + "," : parts[0]);
  };
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [modalArchivarAbierto, setModalArchivarAbierto] = useState(false);

  const [metaForm, setMetaForm] = useState({
    IdMetaAhorro: null,
    Nombre: "",
    MontoObjetivo: "",
    MontoGuardado: "",
    FechaObjetivo: "",
    FechaInicio: "",
    Divisa: ""
  });

  const COLORES = ["#007AFF", "#FF9500", "#34C759", "#AF52DE"];
  const COLORESgasto = ["#FF4B4B", "#FFD700", "#4B79FF", "#FF7F50"];

  useEffect(() => {
    const temporizador = setTimeout(() => setMostrarSaludo(false), 4000);

    const inicializarDatos = async () => {
      const cotizacionesData = await obtenerCotizaciones();
      obtenerDatos(cotizacionesData);
    };

    inicializarDatos();

    return () => clearTimeout(temporizador);
  }, []);

  const convertirAPesos = (monto, divisa, cotizacionesObj) => {
    const valor = Number(monto) || 0;
    const c = cotizacionesObj || cotizaciones;

    const cotUSD = Number(c.USD);
    const cotEUR = Number(c.EUR);

    switch (Number(divisa)) {
      case 2: return valor * cotUSD;
      case 3: return valor * cotEUR;
      default: return valor;
    }
  };

  const obtenerDatos = (cotizacionesData) => {
    const token = localStorage.getItem("Token");
    if (!token) return;

    fetch(`${API_BASE_URL}${API_ENDPOINTS.usuarios}/ByToken`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setIdUsuarioActual(data.IdUsuario);
        setRolUsuario(data.IdRol);

        obtenerGastos(data.IdUsuario, cotizacionesData);
        obtenerIngresos(data.IdUsuario, cotizacionesData);
        obtenerAhorros(data.IdUsuario, cotizacionesData);
      })
      .catch(err => console.error("Error al obtener usuario:", err));
  };

  const obtenerGastos = (idusuario, cotizacionesData) => {
    fetch(`${API_BASE_URL}${API_ENDPOINTS.gastos}/ByUsuario/${idusuario}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("Token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const gastosProcesados = data.map(item => ({
          name: item.Descripcion || "Sin descripción",
          valor: convertirAPesos(item.MontoGasto, item.IdDivisa, cotizacionesData),
          monedaOriginal: Number(item.IdDivisa) === 2 ? "USD" : Number(item.IdDivisa) === 3 ? "EUR" : "ARS"
        }));
        setDatosGastos(gastosProcesados);
      });
  };

  const obtenerIngresos = (idusuario, cotizacionesData) => {
    fetch(`${API_BASE_URL}${API_ENDPOINTS.ingresos}/ByUsuario/${idusuario}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("Token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const ingresosProcesados = data.map(item => ({
          name: item.Descripcion || "Sin Descripción",
          valor: convertirAPesos(item.MontoIngreso, item.IdDivisa, cotizacionesData),
          monedaOriginal: Number(item.IdDivisa) === 2 ? "USD" : Number(item.IdDivisa) === 3 ? "EUR" : "ARS"
        }));
        setDatosIngresos(ingresosProcesados);
      });
  };

  const obtenerAhorros = (idusuario, cotizacionesData) => {
    fetch(`${API_BASE_URL}${API_ENDPOINTS.ahorros}/ByUsuario/${idusuario}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("Token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const metasProcesadas = data.map(item => ({
          ...item,
          etiqueta: item.Nombre || "Meta de ahorro",
          actual: convertirAPesos(item.MontoGuardado, item.IdDivisa, cotizacionesData),
          objetivo: convertirAPesos(item.MontoObjetivo, item.IdDivisa, cotizacionesData)
        }));
        setMetasAhorro(metasProcesadas);
      });
  };

  const obtenerLimiteMetas = (idRol) => {
    switch (idRol) {
      case 1: return 1;
      case 2: return 3;
      case 3: return 5;
      case 4: return Infinity;
      default: return 1;
    }
  };

  const getNombreMes = (offset = 0) => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() + offset);
    return meses[fecha.getMonth()];
  };

  const metasActivas = metasAhorro.filter(meta => meta.IdEstadoMetaAhorro !== 2);
  const metasCompletadas = metasAhorro.filter(meta => meta.IdEstadoMetaAhorro === 2);
  const limiteMetas = obtenerLimiteMetas(rolUsuario);
  const cantidadMetasActivas = metasActivas.length;
  const metasDisponibles = limiteMetas - cantidadMetasActivas;
  const limiteAlcanzado = cantidadMetasActivas >= limiteMetas;

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    if (name === "Nombre" && value.length > 100) return;
    if (name === "MontoGuardado" || name === "MontoObjetivo") {
      if (value.length > 10) return;
    }
    setMetaForm({ ...metaForm, [name]: value });
  };

  const manejarGuardarMeta = () => {
    const token = localStorage.getItem("Token");
    const esEdicion = metaForm.IdMetaAhorro !== null && metaForm.IdMetaAhorro !== undefined;

    if (!esEdicion && limiteAlcanzado) {
      toast.warning(`Has alcanzado el máximo de ${limiteMetas} metas permitidas.`);
      return;
    }

    if (!metaForm.Nombre || !metaForm.Nombre.trim()) {
      toast.warning("Debes ingresar un nombre para la meta");
      return;
    }

    const monto = Number(metaForm.MontoObjetivo);
    if (!metaForm.MontoObjetivo || monto <= 0) {
      toast.warning("Debes ingresar un monto objetivo válido");
      return;
    }
    if (monto > 9999999999) {
      toast.error("El monto objetivo no puede superar los 10 dígitos");
      return;
    }

    if (!metaForm.FechaInicio || !metaForm.FechaObjetivo) {
      toast.warning("Debes seleccionar las fechas de inicio y objetivo");
      return;
    }
    if (new Date(metaForm.FechaObjetivo) < new Date(metaForm.FechaInicio)) {
      toast.error("La fecha objetivo no puede ser menor a la fecha de inicio");
      return;
    }

    fetch(`${API_BASE_URL}${API_ENDPOINTS.usuarios}/ByToken`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(userData => {
        const metaAGuardar = {
          IdMetaAhorro: metaForm.IdMetaAhorro,
          Nombre: metaForm.Nombre,
          MontoObjetivo: parseFloat(metaForm.MontoObjetivo),
          MontoGuardado: parseFloat(metaForm.MontoGuardado),
          FechaMeta: metaForm.FechaObjetivo ? metaForm.FechaObjetivo.toISOString() : null,
          FechaInicio: metaForm.FechaInicio ? metaForm.FechaInicio.toISOString() : null,
          IdDivisa: metaForm.IdDivisa,
          IdUsuario: userData.IdUsuario
        };
        guardarMetaApi(metaAGuardar);
      })
      .catch(error => {
        console.error("Error obteniendo usuario:", error);
        toast.error("No se pudo obtener la información del usuario");
      });
  };

  const guardarMetaApi = (metaAGuardar) => {
    const esEdicion = metaAGuardar.IdMetaAhorro !== null && metaAGuardar.IdMetaAhorro !== undefined;
    const url = esEdicion ? `${API_BASE_URL}${API_ENDPOINTS.ahorros}/${metaAGuardar.IdMetaAhorro}` : `${API_BASE_URL}${API_ENDPOINTS.ahorros}`;
    const metodo = esEdicion ? "PUT" : "POST";

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("Token")}`
      },
      body: JSON.stringify(metaAGuardar)
    })
      .then(response => {
        if (!response.ok) throw new Error();
        toast.success(esEdicion ? "Meta actualizada correctamente" : "Meta creada correctamente");
        setModalAgregarAbierto(false);
        setModalEditarAbierto(false);
        obtenerDatos(cotizaciones);
      })
      .catch(error => {
        console.error(error);
        toast.error(esEdicion ? "Error al actualizar la meta" : "Error al crear la meta");
      });
  };

  const manejarEliminarMeta = (metaDesdeLista = null) => {
    const idAEliminar = metaDesdeLista?.IdMetaAhorro || metaForm.IdMetaAhorro;

    if (!idAEliminar) return;

    const confirmacion = window.confirm("¿Estás seguro de que querés eliminar este logro de tu historial?");
    if (!confirmacion) return;

    fetch(`${API_BASE_URL}${API_ENDPOINTS.ahorros}/${idAEliminar}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("Token")}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error();
        }

        toast.success("Meta eliminada correctamente");

        setModalEditarAbierto(false);
        obtenerDatos();
      })
      .catch(error => {
        console.error(error);
        toast.error("Error al eliminar la meta");
      });
  };

  const calcularTotal = (datos) => {
    return datos.reduce((acum, item) => acum + Number(item.valor || 0), 0);
  };

  const obtenerTopCinco = (items) => {
    return [...items].sort((a, b) => b.valor - a.valor).slice(0, 5);
  };

  const renderCenterLabel = ({ cx, cy }, total) => (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#ffffff" fontSize={13} fontWeight="600">Total</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#c8b277" fontSize={16} fontWeight="700">${total.toLocaleString("es-AR")}</text>
    </g>
  );

  const EstadoVacio = ({ titulo, mensaje, icono = "📊", sugerencia }) => (
    <div className="tarjeta-general aviso-vacio">
      {titulo && <h3>{titulo}</h3>}
      <div className="contenido-aviso-vacio">
        <div className="icono-placeholder">{icono}</div>
        <p>{mensaje}</p>
        <span className="sugerencia">{sugerencia || "Registra movimientos para ver información."}</span>
      </div>
    </div>
  );

  const BarraProgreso = ({ actual = 0, objetivo = 0, etiqueta = "Meta", idDivisa }) => {
    const valorActual = Number(actual) || 0;
    const valorObjetivo = Number(objetivo) || 0;
    const porcentaje = valorObjetivo > 0 ? Math.min(100, (valorActual / valorObjetivo) * 100) : 0;

    const obtenerNombreDivisa = (id) => {
      switch (Number(id)) {
        case 2: return "Creada en USD a ARS";
        case 3: return "Creada en EUR a ARS";
        default: return "ARS";
      }
    };
    const nombreDivisa = obtenerNombreDivisa(idDivisa);

    return (
      <div className="item-progreso-general">
        <div className="info-progreso-general">
          <span className="truncate-text-general-ahorro" style={{ fontWeight: "500", color: "#ffffff" }}>
            {etiqueta}
          </span>
          <span className="truncate-text-general-ahorro-precio" style={{ color: "#c8b277", fontWeight: "bold" }}>
            {porcentaje.toFixed(0)}%
          </span>
        </div>
        <div className="pista-barra-general">
          <div className="relleno-barra-general" style={{ width: `${porcentaje}%` }} />
        </div>
        <div className="texto-monto-general" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "5px" }}>
          <span className="spanValorMeta">${valorActual.toLocaleString("es-AR")} / ${valorObjetivo.toLocaleString("es-AR")}</span>
          <span style={{
            fontSize: "0.75em",
            color: "#c8b277",
            backgroundColor: "#2a2a2a",
            padding: "2px 6px",
            borderRadius: "4px",
            whiteSpace: "nowrap"
          }}>
            {nombreDivisa}
          </span>
        </div>
      </div>
    );
  };

  const abrirModalAgregar = () => {
    if (limiteAlcanzado) return;
    setMetaForm({
      IdMetaAhorro: null,
      Nombre: "",
      MontoObjetivo: "",
      MontoGuardado: "",
      FechaObjetivo: null,
      FechaInicio: null,
      IdDivisa: "1"
    });
    setModalAgregarAbierto(true);
  };

  const abrirModalEditar = (meta) => {
    setMetaForm({
      IdMetaAhorro: meta.IdMetaAhorro,
      Nombre: meta.Nombre || "",
      MontoObjetivo: meta.MontoObjetivo || "",
      MontoGuardado: meta.MontoGuardado || "",
      FechaObjetivo: meta.FechaMeta ? new Date(meta.FechaMeta) : null,
      FechaInicio: meta.FechaInicio ? new Date(meta.FechaInicio) : null,
      IdDivisa: parseInt(meta.IdDivisa) || 1
    });
    setModalEditarAbierto(true);
  };

  const archivarMesActual = async () => {
    if (!idUsuarioActual) {
      toast.warning("No se encontró un usuario válido para realizar la acción.");
      return;
    }
    if (!rolUsuario || rolUsuario < 2) {
      toast.error("Acceso denegado: Tu plan actual no te permite realizar esta acción.");
      return;
    }
    const confirmacion = window.confirm('¿Estás seguro de que quieres archivar el mes?');
    if (!confirmacion) return; 
    try {
      setModalArchivarAbierto(false);

      const response = await fetch(`${API_BASE_URL}/Cierre/FinalizarMes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("Token")}`
        },
        body: JSON.stringify({ IdUsuario: idUsuarioActual })
      });

      if (response.ok) {
        toast.success("¡Mes archivado correctamente!");
        obtenerDatos(cotizaciones);
      } else {
        toast.error("Error al archivar el mes actual. Verifica el servidor.");
      }
    } catch (error) {
      console.error("Error en la petición de archivo:", error);
      toast.error("Error de red al intentar archivar el mes.");
    }
  };

  const nombre = localStorage.getItem("Nombre") || "Usuario";
  const apellido = localStorage.getItem("Apellido") || "";

  const tienePermisoArchivar = rolUsuario !== null && rolUsuario >= 2;

  const gastosOrdenados = useMemo(() => obtenerTopCinco(datosGastos), [datosGastos]);
  const ingresosOrdenados = useMemo(() => obtenerTopCinco(datosIngresos), [datosIngresos]);

  return (
    <div className="contenedor-principal-general">
      <div className="seccion-encabezado-general">
        <div className="titulo-principal-general">
          <h2>
            {mostrarSaludo ? `¡Bienvenido, ${nombre} ${apellido}!` : "Resumen financiero"}
          </h2>
          <p style={{ width: '70%' }}>En este apartado usted verá el balance histórico y acumulado de sus gastos e ingresos. Podrá también establecer metas de ahorro.</p>
          <p>Todas las monedas son convertidas automáticamente a ARS.</p>
          <small style={{ color: "#c8b277", fontWeight: "500", fontStyle: "italic", fontSize: "1.1rem" }}>
            USD: ${ (Math.ceil((cotizaciones?.USD || 0) * 10) / 10).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) } | 
            EUR: ${ (Math.ceil((cotizaciones?.EUR || 0) * 10) / 10).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }
          </small>
        </div>

        <div className="botones-functions-comparativas">
          <Link to="/comparativa" className="botonesComparativa acciones">
            Mostrar Balance
          </Link>
          <Link to="/archivos" className="botonesComparativa acciones">
            Archivos
          </Link>
          
          <button
            style={{
              width: "220px",
              opacity: tienePermisoArchivar ? 1 : 0.6,
              cursor: tienePermisoArchivar ? "pointer" : "not-allowed"
            }}
            onClick={() => {
              if (tienePermisoArchivar) {
                setModalArchivarAbierto(true);
              } else {
                toast.warning("Función Premium: Necesitas mejorar tu cuenta (Plan Gold o Platino) para poder archivar todos tu ingreso y gasto historico. 🚀");

              }
            }}
            className='botonesComparativa btn-secundario'
            title={!tienePermisoArchivar ? "Función Premium: Requiere mejorar tu cuenta a un plan superior para archivar." : "Archivar los datos financieros del mes actual"}
          >
            Archivar Historico
          </button>
        </div>
        
      </div>

      <div className="panel-graficos-general">
        {datosGastos.length > 0 ? (
          <div className="tarjeta-general">
            <h3>Gastos</h3>
            <div className="grafico-con-leyenda">
              <div className="grafico-pie">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={gastosOrdenados}
                      cx="50%" cy="50%"
                      innerRadius={100} outerRadius={115}
                      paddingAngle={5}
                      dataKey="valor"
                      label={(props) => renderCenterLabel(props, calcularTotal(datosGastos))}
                      labelLine={false}
                    >
                      {gastosOrdenados.map((_, i) => (
                        <Cell key={i} fill={COLORESgasto[i % COLORESgasto.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e1e1f", border: "1px solid rgba(200,178,119,0.3)", color: "#fff", borderRadius: "8px" }} formatter={(value, name) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="leyenda-grafico">
                {gastosOrdenados.map((item, index) => (
                  <div className="item-leyenda" key={index}>
                    <span className="item-color-circulo" style={{ backgroundColor: COLORESgasto[index % COLORESgasto.length] }} />
                    <div className="leyenda-texto">
                      <span className="truncate-text-general" title={item.name}>{item.name}</span>
                    </div>
                    <h4 className="valor-gasto">${item.valor.toLocaleString()}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EstadoVacio titulo="Gastos por Categoría" mensaje="No se encontraron gastos registrados." />
        )}

        {datosIngresos.length > 0 ? (
          <div className="tarjeta-general">
            <h3>Ingresos</h3>
            <div className="grafico-con-leyenda">
              <div className="grafico-pie">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={ingresosOrdenados}
                      cx="50%" cy="50%"
                      innerRadius={100} outerRadius={115}
                      paddingAngle={5}
                      dataKey="valor"
                      label={(props) => renderCenterLabel(props, calcularTotal(datosIngresos))}
                      labelLine={false}
                    >
                      {ingresosOrdenados.map((_, i) => (
                        <Cell key={i} fill={COLORES[i % COLORES.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e1e1f", border: "1px solid rgba(200,178,119,0.3)", color: "#fff", borderRadius: "8px" }} formatter={(value, name) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="leyenda-grafico">
                {ingresosOrdenados.map((item, index) => (
                  <div className="item-leyenda" key={index}>
                    <span className="item-color-circulo" style={{ backgroundColor: COLORES[index % COLORES.length] }} />
                    <div className="leyenda-texto">
                      <span className="truncate-text-general">{item.name}</span>
                    </div>
                    <h4 className="valor-ingreso">${item.valor.toLocaleString()}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EstadoVacio titulo="Fuentes de Ingreso" mensaje="No se encontraron ingresos registrados." />
        )}
      </div>

      <div className="contenedor-ahorros-general">
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="encabezado-ahorros-flex" style={{ marginBottom: "12px" }}>
            <h3 className="titulo-ahorros-general">Objetivos en Curso</h3>
            <button
              onClick={abrirModalAgregar}
              className="boton-primario"
              disabled={limiteAlcanzado}
              style={{
                opacity: limiteAlcanzado ? 0.5 : 1,
                cursor: limiteAlcanzado ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Agregar Meta
            </button>
          </div>

          <div className="info-limites-plan" style={{ backgroundColor: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(200,178,119,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <strong style={{ color: "#ffffff", fontSize: "0.95rem" }}>Metas activas:</strong>
              <span style={{ color: "#c8b277", fontWeight: "bold", fontSize: "1rem" }}>
                {cantidadMetasActivas} / {limiteMetas === Infinity ? "∞" : limiteMetas}
              </span>
            </div>

            {rolUsuario === 4 ? (
              <span style={{ fontSize: "0.85rem", color: "#8e8e93" }}>Administrador - sin restricciones.</span>
            ) : limiteAlcanzado ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.85rem", color: "#ff4b4b" }}>Has alcanzado el límite de tu plan.</span>
                <Link to="/planes" style={{ fontSize: "0.85rem", color: "#c8b277", textDecoration: "none", fontWeight: "500", marginTop: "2px" }}>
                  Mejorar mi plan para crear más metas 🚀
                </Link>
              </div>
            ) : (
              <span style={{ fontSize: "0.85rem", color: "#8e8e93" }}>
                Te queda{metasDisponibles !== 1 ? 'n' : ''} {metasDisponibles} meta{metasDisponibles !== 1 ? 's' : ''} disponible{metasDisponibles !== 1 ? 's' : ''}.
              </span>
            )}
          </div>
        </div>

        {metasActivas.length > 0 ? (
          <div className="grid-ahorros-general">
            {metasActivas.map((meta, indice) => (
              <div key={indice} className="tarjeta-ahorro-item">
                <BarraProgreso
                  actual={meta.actual}
                  objetivo={meta.objetivo}
                  etiqueta={meta.etiqueta}
                  idDivisa={meta.IdDivisa}
                />
                <button className="boton-editar-ahorro" onClick={() => abrirModalEditar(meta)}>
                  Editar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EstadoVacio
            icono="🎯"
            mensaje="No hay objetivos de ahorro en curso."
            sugerencia="Haz clic en 'Agregar Meta' para empezar."
          />
        )}

        {metasCompletadas.length > 0 && (
          <div className="seccion-logros-alcanzados" style={{ marginTop: '2rem' }}>
            <h3 className="titulo-ahorros-general" style={{ color: '#c8b277', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏆</span> Logros Alcanzados
            </h3>

            <div className="grid-ahorros-general">
              {metasCompletadas.map((meta, indice) => (
                <div key={indice} className="tarjeta-logro" style={{
                  backgroundColor: '#1e1e1f',
                  border: '1px solid rgba(200, 178, 119, 0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="truncate-text-general-ahorro" style={{ fontWeight: '600', color: '#ffffff', fontSize: '1.1rem' }}>
                      {meta.etiqueta}
                    </span>
                    <span style={{ color: '#c8b277', fontWeight: 'bold' }}>
                      ¡Completado!
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#8e8e93' }}>
                    <div>
                      <span>Total guardado: </span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>${meta.actual.toLocaleString("es-AR")}</span>
                    </div>

                    <button
                      className="boton-secundario"
                      style={{ backgroundColor: '#dc3545', color: '#fff', padding: '4px 10px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      onClick={() => manejarEliminarMeta(meta)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      {modalEditarAbierto && (
        <div className="capa-modal" onClick={() => setModalEditarAbierto(false)}>
          <div className="contenido-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Editar Meta de Ahorro</h3>
            <div className="formulario-cuerpo">
              <div className="formulario-grupo">
                <label htmlFor="nombreMeta">
                  Nombre de la Meta
                  <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
                    ({metaForm.Nombre ? metaForm.Nombre.length : 0}/100)
                  </span>
                </label>
                <input
                  type="text"
                  name="Nombre"
                  value={metaForm.Nombre}
                  onChange={manejarCambioInput}
                  id="nombreMeta"
                  maxLength={100}
                  placeholder="Ej: Fondo de Emergencia"
                />
              </div>
              <div className="formulario-grupo">
                <label htmlFor="MontoGuardado">Monto Actual ($)</label>
                <input
                  type="text" 
                  name="MontoGuardado"
                  value={formatMontoParaInput(metaForm.MontoGuardado)}
                  onChange={(e) => {
                    let val = e.target.value;
                    val = val.replace(/\./g, "");
                    val = val.replace(/,/g, ".");
                    const numVal = parseFloat(val);
                    const MAX_VALOR = 1000000000;
                    const regex = /^\d*\.?\d{0,2}$/;
                    if (val === "" || (regex.test(val) && numVal <= MAX_VALOR)) {
                      setMetaForm({ ...metaForm, MontoGuardado: val });
                    }
                  }}
                  id="MontoGuardado"
                  placeholder="0.00"
                />
              </div>
              <div className="formulario-grupo">
                <label htmlFor="montoObjetivo">Monto Objetivo ($)</label>
                <input
                  type="text"
                  name="MontoObjetivo"
                  value={formatMontoParaInput(metaForm.MontoObjetivo)}
                  onChange={(e) => {
                    let val = e.target.value;
                    val = val.replace(/\./g, "");
                    val = val.replace(/,/g, ".");

                    const numVal = parseFloat(val);
                    const MAX_VALOR = 1000000000;
                    const regex = /^\d*\.?\d{0,2}$/;

                    if (val === "" || (regex.test(val) && numVal <= MAX_VALOR)) {
                      setMetaForm({ ...metaForm, MontoObjetivo: val });
                    }
                  }}
                  id="montoObjetivo"
                  placeholder="0.00"
                />
              </div>

              <div className="formulario-grupo">
                <label>Fecha de Inicio</label>
                <DatePicker
                  selected={metaForm.FechaInicio}
                  onChange={(date) => setMetaForm({ ...metaForm, FechaInicio: date })}
                  locale="es"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccionar fecha"
                  className="input-custom-finanzarc" 
                />
              </div>
              <div className="formulario-grupo">
                <label>Fecha Objetivo</label>
                <DatePicker
                  selected={metaForm.FechaObjetivo}
                  onChange={(date) => setMetaForm({ ...metaForm, FechaObjetivo: date })}
                  locale="es"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccionar fecha"
                  minDate={metaForm.FechaInicio} 
                  className="input-custom-finanzarc"
                />
              </div>

              <div className="formulario-grupo">
                <label htmlFor="divisa">Divisa</label>
                <select
                  name="IdDivisa"
                  value={metaForm.IdDivisa}
                  onChange={manejarCambioInput}
                  id="divisa"
                >
                  <option value="1">ARS - Peso Argentino</option>
                  <option value="2">USD - Dólar Estadounidense</option>
                  <option value="3">EUR - Euro</option>
                </select>
              </div>
            </div>
            <div className="formulario-acciones">
              <button className="boton-secundario" style={{ backgroundColor: '#dc3545' }} onClick={manejarEliminarMeta}>
                Eliminar
              </button>
              <button className="boton-secundario" onClick={() => setModalEditarAbierto(false)}>
                Cancelar
              </button>
              <button className="boton-primario" onClick={manejarGuardarMeta}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {modalAgregarAbierto && (
        <div className="capa-modal" onClick={() => setModalAgregarAbierto(false)}>
          <div className="contenido-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nueva Meta de Ahorro</h3>
            <div className="formulario-cuerpo">
              <div className="formulario-grupo">
                <label htmlFor="nombreMeta">
                  Nombre de la Meta
                  <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '10px' }}>
                    ({metaForm.Nombre ? metaForm.Nombre.length : 0}/100)
                  </span>
                </label>
                <input
                  type="text"
                  name="Nombre"
                  value={metaForm.Nombre}
                  onChange={manejarCambioInput}
                  id="nombreMeta"
                  maxLength={100}
                  placeholder="Ej: Fondo de Emergencia"
                />
              </div>
              <div className="formulario-grupo" style={{ display: "none" }}>
                <label htmlFor="montoGuardado">Monto Actual ($)</label>
                <input type="number" name="MontoGuardado" value={metaForm.MontoGuardado} onChange={manejarCambioInput} id="montoGuardado" placeholder="0.00" />
              </div>
              <div className="formulario-grupo">
                <label htmlFor="montoObjetivo">Monto Objetivo ($)</label>
                <input
                  type="text"
                  name="MontoObjetivo"
                  value={formatMontoParaInput(metaForm.MontoObjetivo)}
                  onChange={(e) => {
                    let val = e.target.value;
                    val = val.replace(/\./g, "");
                    val = val.replace(/,/g, ".");

                    const numVal = parseFloat(val);
                    const MAX_VALOR = 1000000000;
                    const regex = /^\d*\.?\d{0,2}$/;

                    if (val === "" || (regex.test(val) && numVal <= MAX_VALOR)) {
                      setMetaForm({ ...metaForm, MontoObjetivo: val });
                    }
                  }}
                  id="montoObjetivo"
                  placeholder="0.00"
                />
              </div>
              <div className="formulario-grupo">
                <label>Fecha de Inicio</label>
                <DatePicker
                  selected={metaForm.FechaInicio}
                  onChange={(date) => setMetaForm({ ...metaForm, FechaInicio: date })}
                  locale="es"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccionar fecha"
                  className="input-custom-finanzarc"
                />
              </div>
              <div className="formulario-grupo">
                <label>Fecha Objetivo</label>
                <DatePicker
                  selected={metaForm.FechaObjetivo}
                  onChange={(date) => setMetaForm({ ...metaForm, FechaObjetivo: date })}
                  locale="es"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccionar fecha"
                  minDate={metaForm.FechaInicio} 
                  className="input-custom-finanzarc"
                />
              </div>
              <div className="formulario-grupo">
                <label htmlFor="divisa">Divisa</label>
                <select
                  name="IdDivisa" 
                  value={metaForm.IdDivisa} 
                  onChange={manejarCambioInput}
                  id="divisa"
                >
                  <option value="1">ARS - Peso Argentino</option>
                  <option value="2">USD - Dólar Estadounidense</option>
                  <option value="3">EUR - Euro</option>
                </select>
              </div>
            </div>
            <div className="formulario-acciones">
              <button className="boton-secundario" onClick={() => setModalAgregarAbierto(false)}>
                Cancelar
              </button>
              <button className="boton-primario" onClick={manejarGuardarMeta}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {
        modalArchivarAbierto && (
          <div className="modal-overlay" onClick={() => setModalArchivarAbierto(false)}>
            <div className="modal-contenido" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Archivar Mes Actual</h3>
                <button className="btn-cerrar" onClick={() => setModalArchivarAbierto(false)}>&times;</button>
              </div>
              <div className="modal-body-general">
                <h3 style={{ textAlign: 'center' }}>¿Estás seguro de que deseas archivar los datos de <strong>{getNombreMes(0)}</strong>?</h3>
                <p style={{ color: '#8e8e93', marginTop: '10px', fontSize: '0.9rem', textAlign: 'center' }}>Esta acción no se puede deshacer.</p>
                <div className="modal-acciones">
                  <button className="btn-Cancelar-General" onClick={() => setModalArchivarAbierto(false)}>Cancelar</button>
                  <button className="btn-Confirmar-General" onClick={archivarMesActual}>Archivar</button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
};

export default GastoIngreso;
