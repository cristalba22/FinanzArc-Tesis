import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import "./Ingreso.css";
import { obtenerTasas } from "../../../apiConfig";
registerLocale("es", es);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const formatMontoParaInput = (val) => {
  if (val === "" || val === null || val === undefined) return "";
  const stringVal = val.toString();
  const parts = stringVal.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.length > 1
    ? parts[0] + "," + parts[1]
    : (stringVal.endsWith(".") ? parts[0] + "," : parts[0]);
};

function Ingreso() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [listaIngresos, setListaIngresos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [vermas, setVerMas] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  const [tasas, setTasas] = useState({ USD: 1450, EUR: 1650 });
  const [tipoIngreso, setTipoIngreso] = useState([]);
  const [divisa, setDivisa] = useState([]);

  const [form, setForm] = useState({
    IdIngreso: null,
    IdUsuario: null,
    IdTipoIngreso: 1,
    IdDivisa: 1,   
    MontoIngreso: "",
    FechaIngreso: new Date(),
    Descripcion: ""
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const tasasActuales = await obtenerTasas();
        if (tasasActuales && typeof tasasActuales === 'object') {
          setTasas(tasasActuales);
        }
      } catch (error) {
        console.error("Error al cargar tasas, usando valores por defecto:", error);
      }
      obtenerDatosUsuarioYRegistros();
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    const fetchTipoIngreso = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/TipoIngreso`);
        const data = await response.json();
        setTipoIngreso(data);
      } catch (error) {
        console.error("Error al cargar tipo de ingresos:", error);
      }
    };
    fetchTipoIngreso();
  }, []);

  useEffect(() => {
    const fetchDivisa = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/Divisa`);
        const data = await response.json();
        setDivisa(data);
      } catch (error) {
        console.error("Error al cargar los tipos de divisas:", error);
      }
    };
    fetchDivisa();
  }, []);

  const COLORES = ["#007AFF", "#FF9500", "#34C759", "#AF52DE"];

  const obtenerDatosUsuarioYRegistros = async () => {
    const token = localStorage.getItem("Token");
    try {
      const res = await fetch(`${API_BASE_URL}/Usuarios/ByToken`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const usuario = await res.json();
      setForm(prev => ({ ...prev, IdUsuario: usuario.IdUsuario }));
      cargarIngresos(usuario.IdUsuario);
    } catch (err) {
      console.error("Error al identificar usuario", err);
    }
  };

  const cargarIngresos = (idUsuario) => {
    fetch(`${API_BASE_URL}/Ingreso/ByUsuario/${idUsuario}`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("Token")}` }
    })
      .then(res => res.json())
      .then(data => setListaIngresos(data))
      .catch(err => console.error("Error cargando ingresos", err));
  };

  const manejarGuardar = async () => {
    const esEdicion = form.IdIngreso !== null;
    const url = esEdicion ? `${API_BASE_URL}/Ingreso/${form.IdIngreso}` : `${API_BASE_URL}/Ingreso`;
    const metodo = esEdicion ? "PUT" : "POST";

    const ingresoAEnviar = {
      ...form,
      FechaIngreso: form.FechaIngreso ? form.FechaIngreso.toISOString() : null
    };

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("Token")}`
        },
        body: JSON.stringify(ingresoAEnviar)
      });

      if (res.ok) {
        setModalAbierto(false);
        resetearForm();
        obtenerDatosUsuarioYRegistros();
      }
    } catch (err) {
      console.error("Error al guardar ingreso", err);
    }
  };

  const eliminarIngreso = (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este registro?")) return;
    fetch(`${API_BASE_URL}/Ingreso/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem("Token")}` }
    }).then(() => obtenerDatosUsuarioYRegistros());
  };

  const calcularMontoEnPesos = (monto, idDivisa) => {
    const tasaUSD = tasas?.USD || 1450;
    const tasaEUR = tasas?.EUR || 1650;

    let total = monto;
    if (idDivisa === 2) total = monto * tasaUSD;
    if (idDivisa === 3) total = monto * tasaEUR; 
    if (idDivisa === 2 || idDivisa === 3) {
      return Math.ceil(total * 10) / 10;
    }

    return total;
  };

  const FormatearMoneda = (monto, idDivisa) => {
    const totalPesos = calcularMontoEnPesos(monto, idDivisa);
    
    if (idDivisa === 1) return `$${monto.toLocaleString('es-AR')}`;
    
    const simbolo = idDivisa === 2 ? "USD" : "EUR";
    
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span>{simbolo} {monto.toLocaleString('es-AR')}</span>
        <span style={{ fontSize: "10px", color: "#888" }}>
          ≈ ${totalPesos.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ARS
        </span>
      </div>
    );
  };

  const ingresosFiltrados = useMemo(() => {
    return listaIngresos.filter(i =>
      i.Descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [listaIngresos, busqueda]);

  const datosGrafico = useMemo(() => {
    const data = ingresosFiltrados.map(i => ({
      nombre: i.Descripcion,
      valor: calcularMontoEnPesos(Number(i.MontoIngreso), i.IdDivisa)
    }))
    return data.length > 0 ? data : [{ nombre: "Sin datos", valor: 0 }];
  }, [ingresosFiltrados, tasas]);

  const totalMonto = useMemo(() => {
    return ingresosFiltrados.reduce((acc, item) => acc + calcularMontoEnPesos(Number(item.MontoIngreso), item.IdDivisa), 0);
  }, [ingresosFiltrados, tasas]);

  const resetearForm = () => {
    setForm(prev => ({
      ...prev,
      IdIngreso: null,
      MontoIngreso: "",
      Descripcion: "",
      FechaIngreso: new Date(),
      IdTipoIngreso: 1,
      IdDivisa: 1
    }));
  };

  const prepararEdicion = (item) => {
    setForm({
      IdIngreso: item.IdIngreso,
      IdUsuario: item.IdUsuario,
      IdTipoIngreso: item.IdTipoIngreso,
      IdDivisa: item.IdDivisa,
      MontoIngreso: item.MontoIngreso,
      FechaIngreso: item.FechaIngreso ? new Date(item.FechaIngreso) : new Date(),
      Descripcion: item.Descripcion
    });
    setModalAbierto(true);
  };

  return (
    <div className="pagina-ingreso-contenedor">
      <div className="encabezado-simple">
        <h1 className="titulo-seccion">Fuentes de Ingreso</h1>
        <p className="texto-gris">
          Administre todos sus ingresos en este apartado. El mismo es de carácter histórico y acumulado; para más detalles de sus ingresos, clickee en los íconos del apartado "ACCIONES".
          <br></br>
          <strong>
            Cotizaciones: 
            1 USD = ${ (Math.ceil((tasas?.USD || 0) * 10) / 10).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) } | 
            1 EUR = ${ (Math.ceil((tasas?.EUR || 0) * 10) / 10).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }
          </strong>
        </p>
      </div>

      <div className="pagina-ingreso-tarjeta">
        <div className="tarjeta">
          {ingresosFiltrados.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "280px", textAlign: "center", color: "#a0a0a0" }}>
              <span style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📊</span>
              <p style={{ fontSize: "14px", margin: 0, padding: "0 20px", lineHeight: "1.5" }}>
                {listaIngresos.length === 0
                  ? "No hay ingresos registrados para generar el gráfico de distribución."
                  : "No hay datos que coincidan para mostrar en el gráfico."}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={datosGrafico}
                  cx="50%"
                  cy="50%"
                  innerRadius={120}
                  outerRadius={140}
                  paddingAngle={5}
                  dataKey="valor"
                  nameKey="nombre"
                  stroke="none"
                >
                  {datosGrafico.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.valor === 0 ? "#333" : COLORES[i % COLORES.length]} />
                  ))}
                </Pie>

                <text x="50%" y="50%" fill="#fff" textAnchor="middle" dominantBaseline="central">
                  <tspan x="50%" dy="-0.5em" fontSize="14" fill="#c8b277" fontWeight="bold"  >Total (ARS)</tspan>
                  <tspan x="50%" dy="1.5em" fontSize="20" fontWeight="bold"  fill="#007AFF" >
                    ${totalMonto.toLocaleString('es-AR')}
                  </tspan>
                </text>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e1e1f",
                    border: "1px solid rgba(200, 178, 119, 0.3)",
                    borderRadius: "8px"
                  }}
                  itemStyle={{ fontWeight: "500" }}
                  formatter={(value, name) => [`$${formatMontoParaInput(value)}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="contenedor-tabla-filtradaCategoria">
          <div className="buscador-ingreso-categoria">
            <h2 className="subtitulo-seccion">Filtrar Ingresos:</h2>
            <input
              type="text"
              placeholder="Buscar por descripción..."
              className="input-buscar"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="tabla-responsive">
            <table className="tabla-ingresos">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th className="td-fecha">Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ingresosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "3rem 1rem", color: "#a0a0a0" }}>
                      {listaIngresos.length === 0
                        ? "Usted no tiene registrado ningún ingreso. ¡Registre su primer ingreso abajo!"
                        : "No se encontraron ingresos que coincidan con su búsqueda."}
                    </td>
                  </tr>
                ) : (
                  ingresosFiltrados.map((item, index) => (
                    <tr key={item.IdIngreso || `temp-${index}`}>
                      <td>
                        <div className="truncate-text" title={item.Descripcion}>
                          {item.Descripcion}
                        </div>
                      </td>
                      <td className="monto-destacado" style={{ color: 'rgb(70, 130, 180)' }}>
                        {FormatearMoneda(Number(item.MontoIngreso), item.IdDivisa)}
                      </td>
                      <td className="texto-gris">{new Date(item.FechaIngreso).toLocaleDateString('es-AR')}</td>
                      <td>
                        <button className="btn-icon" onClick={() => prepararEdicion(item)}>✏️</button>
                        <button className="btn-icon" onClick={() => eliminarIngreso(item.IdIngreso)}>🗑️</button>
                        <button className="btn-icon" onClick={() => { setItemSeleccionado(item); setVerMas(true); }}>📊</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <button className="boton-primario" onClick={() => { resetearForm(); setModalAbierto(true); }}>
        Registrar Ingreso
      </button>

      {vermas && itemSeleccionado && (
        <div className="seccion-detalle-inferior" style={{ marginTop: "20px", padding: "20px", backgroundColor: "#1e1e1f", borderRadius: "12px", border: "1px solid #333", width: "80%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2>Detalle: {itemSeleccionado.Descripcion}</h2>
            <button onClick={() => setVerMas(false)} className="btn-link">✕</button>
          </div>

          <div className="formulario-grid">
            <div className="formulario-grupo">
              <label>Tipo de Ingreso</label>
              <p>{tipoIngreso.find(t => t.IdTipoIngreso === itemSeleccionado.IdTipoIngreso)?.Nombre || "Cargando..."}</p>
            </div>

            <div className="formulario-grupo">
              <label>Divisa</label>
              <p>{divisa.find(d => d.IdDivisa === itemSeleccionado.IdDivisa)?.CodigoISO || "Cargando..."}</p>
            </div>

            <div className="formulario-grupo">
              <label>Monto</label>
              <p className="monto-destacado" style={{ color: 'rgb(70, 130, 180)', fontWeight: 'bold' }}>
                {FormatearMoneda(Number(itemSeleccionado.MontoIngreso), itemSeleccionado.IdDivisa)}
              </p>
            </div>

            <div className="formulario-grupo">
              <label>Fecha de Ingreso</label>
              <p>{new Date(itemSeleccionado.FechaIngreso).toLocaleDateString('es-AR')}</p>
            </div>

          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="capa-modal">
          <div className="contenido-modal">
            <h3 className="modal-titulo">{form.IdIngreso ? "Editar Ingreso" : "Nuevo Ingreso"}</h3>
            <div className="formulario-grid">
              <div className="formulario-grupo full-width">
                <label>Descripción</label>
                <input
                  type="text"
                  value={form.Descripcion}
                  maxLength={100}
                  onChange={(e) => setForm({ ...form, Descripcion: e.target.value })}
                  placeholder='"Ingreso de aguinaldo..."'
                />
                <small style={{ color: form.Descripcion.length >= 100 ? '#ff4b4b' : '#8e8e93', marginTop: "5px", display: "block" }}>
                  {form.Descripcion.length} / 100 caracteres
                </small>
              </div>

              <div className="formulario-grupo">
                <label>Monto</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatMontoParaInput(form.MontoIngreso)}
                  placeholder='"850.000..."'
                  onChange={(e) => {
                    const val = e.target.value;
                    const rawVal = val.replace(/\./g, "").replace(",", ".");
                    const numVal = parseFloat(rawVal);
                    const MAX_VALOR = 1000000000;
                    const regex = /^\d*\.?\d{0,2}$/;

                    if (rawVal === "" || (regex.test(rawVal) && (isNaN(numVal) || numVal <= MAX_VALOR))) {
                      setForm({ ...form, MontoIngreso: rawVal });
                    }
                  }}
                />
              </div>

              <div className="formulario-grupo">
                <label>Fecha</label>
                <DatePicker
                  selected={form.FechaIngreso}
                  onChange={(date) => setForm({ ...form, FechaIngreso: date })}
                  locale="es"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccionar fecha"
                />
              </div>

              <div className="formulario-grupo">
                <label>Tipo ingreso</label>
                <select
                  value={form.IdTipoIngreso}
                  onChange={(e) => setForm({ ...form, IdTipoIngreso: parseInt(e.target.value) })}
                >
                  {tipoIngreso.map(cat => (
                    <option key={cat.IdTipoIngreso} value={cat.IdTipoIngreso}>
                      {cat.Nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="formulario-grupo">
                <label>TIPO DIVISA</label>
                <select
                  value={form.IdDivisa}
                  onChange={(e) => setForm({ ...form, IdDivisa: parseInt(e.target.value) })}
                >
                  {divisa.map(modo => (
                    <option key={modo.IdDivisa} value={modo.IdDivisa}>
                      {modo.CodigoISO}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="formulario-acciones">
              <button className="boton-secundario" onClick={() => setModalAbierto(false)}>CANCELAR</button>
              <button className="boton-primario" onClick={manejarGuardar}>Guardar Ingreso</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ingreso;
