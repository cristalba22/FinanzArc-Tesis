import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import "./Gasto.css";
import { obtenerTasas } from "../../../apiConfig";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function Gasto() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [listaGastos, setListaGastos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [vermas, setVerMas] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  // Estado inicial con valores por defecto para evitar errores
  const [tasas, setTasas] = useState({ USD: 1450, EUR: 1650 });

  // PARA SELECT DINAMICO.
  const [categorias, setCategorias] = useState([]);
  const [modosPago, setModosPago] = useState([]);
  const [divisa, setDivisa] = useState([]);

  const [form, setForm] = useState({
    IdGasto: null, IdUsuario: null, MontoGasto: "",
    FechaGasto: new Date().toISOString().split('T')[0], Descripcion: ""
  });

  // CORRECCIÓN: Carga inicial consolidada para evitar redundancia y errores
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const tasasActuales = await obtenerTasas();
        // Si la API falla, mantenemos valores por defecto 1 para no romper cálculos
        setTasas(tasasActuales || { USD: 1450, EUR: 1650 });
        await obtenerDatosUsuarioYRegistros();
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };
    cargarDatosIniciales();
  }, []);

  // Carga de catálogos
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [resCat, resPago, resDiv] = await Promise.all([
          fetch(`${API_BASE_URL}/Categoria`).then(r => r.json()),
          fetch(`${API_BASE_URL}/ModoPago`).then(r => r.json()),
          fetch(`${API_BASE_URL}/Divisa`).then(r => r.json())
        ]);
        setCategorias(resCat);
        setModosPago(resPago);
        setDivisa(resDiv);
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
      }
    };
    fetchCatalogos();
  }, []);

  const obtenerDatosUsuarioYRegistros = async () => {
    const token = localStorage.getItem("Token");
    try {
      const res = await fetch(`${API_BASE_URL}/Usuarios/ByToken`, { headers: { "Authorization": `Bearer ${token}` } });
      const usuario = await res.json();
      setForm(prev => ({ ...prev, IdUsuario: usuario.IdUsuario }));
      cargarGastos(usuario.IdUsuario);
    } catch (err) { console.error("Error", err); }
  };

  const cargarGastos = (idUsuario) => {
    fetch(`${API_BASE_URL}/Gasto/ByUsuario/${idUsuario}`, { headers: { "Authorization": `Bearer ${localStorage.getItem("Token")}` } })
      .then(res => res.json())
      .then(data => setListaGastos(data))
      .catch(err => console.error("Error", err));
  };

  const manejarGuardar = async () => {
    const esEdicion = form.IdGasto !== null;
    const url = esEdicion ? `${API_BASE_URL}/Gasto/${form.IdGasto}` : `${API_BASE_URL}/Gasto`;
    await fetch(url, {
      method: esEdicion ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("Token")}` },
      body: JSON.stringify(form)
    });
    setModalAbierto(false);
    resetearForm();
    obtenerDatosUsuarioYRegistros();
  };

  const eliminarGasto = (id) => {
    if (!window.confirm("¿Estás seguro?")) return;
    fetch(`${API_BASE_URL}/Gasto/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${localStorage.getItem("Token")}` } })
      .then(() => obtenerDatosUsuarioYRegistros());
  };

  const calcularMontoEnPesos = (monto, idDivisa) => {
    // CORRECCIÓN: Uso de Optional Chaining y valores por defecto para seguridad
    if (idDivisa === 2) return monto * (tasas?.USD || 1450);
    if (idDivisa === 3) return monto * (tasas?.EUR || 1650);
    return monto;
  };

  const FormatearMoneda = (monto, idDivisa) => {
    const totalPesos = calcularMontoEnPesos(monto, idDivisa);
    if (idDivisa === 1) return `$${monto.toLocaleString()}`;
    const simbolo = idDivisa === 2 ? "USD" : "EUR";
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span>{simbolo} {monto.toLocaleString()}</span>
        <span style={{ fontSize: "10px", color: "#888" }}>≈ ${totalPesos.toLocaleString()} ARS</span>
      </div>
    );
  };
  // 2. FUNCIÓN DE FORMATEO MEJORADA
  const formatMontoParaInput = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const stringVal = val.toString();
    const parts = stringVal.split(".");
    // Agregamos puntos para separar miles
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    // Retornamos con coma si hay decimales, o si el usuario acaba de tipear una coma
    return parts.length > 1
      ? parts[0] + "," + parts[1]
      : (stringVal.endsWith(".") ? parts[0] + "," : parts[0]);
  };
  const gastosFiltrados = useMemo(() => listaGastos.filter(i => i.Descripcion?.toLowerCase().includes(busqueda.toLowerCase())), [listaGastos, busqueda]);
  const totalMonto = useMemo(() => gastosFiltrados.reduce((acc, item) => acc + calcularMontoEnPesos(Number(item.MontoGasto), item.IdDivisa), 0), [gastosFiltrados, tasas]);

  const resetearForm = () => setForm({ ...form, IdGasto: null, MontoGasto: "", Descripcion: "", FechaGasto: new Date().toISOString().split('T')[0], IdCategoria: 1, IdModoPago: 1, IdCuenta: 1, IdDivisa: 1 });
  const prepararEdicion = (item) => { setForm({ ...item, FechaGasto: item.FechaGasto.split('T')[0] }); setModalAbierto(true); };

  const COLORES = ["#FF4B4B", "#FFD700", "#4B79FF", "#FF7F50"];

  return (
    <div className="pagina-ingreso-contenedor">
      <div className="encabezado-simple">
        <h1 className="titulo-seccion">Control de Gastos</h1>
        <p className="texto-gris"> Administre todos sus gastos en este apartado. El mismo es de carácter histórico y acumulado; para más detalles de sus gastos, clickee en los íconos del apartado "ACCIONES".
          <strong><br /> Cotizaciones: 1 USD = ${tasas?.USD || 0} | 1 EUR = ${tasas?.EUR || 0}</strong> </p>
      </div>

      <div className="pagina-ingreso-tarjeta">
        <div className="tarjeta">
          {gastosFiltrados.length === 0 ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "280px",
              textAlign: "center",
              color: "#a0a0a0"
            }}>
              <span style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📊</span>
              <p style={{ fontSize: "14px", margin: 0, padding: "0 20px", lineHeight: "1.5" }}>
                {listaGastos.length === 0
                  ? "No hay gastos registrados para generar el gráfico de distribución."
                  : "No hay datos que coincidan para mostrar en el gráfico."}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={gastosFiltrados.map(i => ({
                    nombre: i.Descripcion,
                    valor: calcularMontoEnPesos(Number(i.MontoGasto), i.IdDivisa)
                  }))}
                  paddingAngle={6}
                  dataKey="valor"
                  nameKey="nombre"
                  innerRadius={120}
                  outerRadius={140}
                  paddingAngle={5}
                  stroke="none"
                >
                  {gastosFiltrados.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e1e1f",
                    border: "1px solid rgba(200, 178, 119, 0.3)",
                    borderRadius: "8px"
                  }}
                  itemStyle={{ fontWeight: "500"}}
                  formatter={(value, name) => [`$${formatMontoParaInput(value)}`, name]}
                />

                <text x="50%" y="50%" fill="#fff" textAnchor="middle" dominantBaseline="central">
                  <tspan x="50%" dy="-0.5em" fontSize="14" fill="#c8b277" fontWeight="bold">Total (ARS)</tspan>
                  <tspan x="50%" dy="1.5em" fontSize="20" fontWeight="bold" fill="#FF4B4B">${totalMonto.toLocaleString()}</tspan>
                </text>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="contenedor-tabla-filtradaCategoria">
          <div className="buscador-ingreso-categoria">
            <h2 className="subtitulo-seccion">Filtrar Gastos:</h2>
            <input type="text" placeholder="Buscar..." className="input-buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="tabla-responsive">
            <table className="tabla-ingresos">
              <thead><tr><th>Descripción</th><th>Monto</th><th className="td-fecha">Fecha</th><th>Acciones</th></tr></thead>
              <tbody>
                {gastosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "3rem 1rem", color: "#a0a0a0" }}>
                      {listaGastos.length === 0
                        ? "Usted no tiene registrado ningún gasto. ¡Ingrese su primer gasto abajo!"
                        : "No se encontraron gastos que coincidan con su búsqueda."}
                    </td>
                  </tr>
                ) : (
                  gastosFiltrados.map((item) => (
                    <tr key={item.IdGasto}>
                      <td>
                        <div className="truncate-text" title={item.Descripcion}>
                          {item.Descripcion}
                        </div>
                      </td>
                      <td className="monto-destacado" style={{ color: '#FF4B4B' }}>{FormatearMoneda(Number(item.MontoGasto), item.IdDivisa)}</td>
                      <td className="texto-gris td-fecha">{new Date(item.FechaGasto).toLocaleDateString()}</td>
                      <td>
                        <button className="btn-icon" onClick={() => prepararEdicion(item)}>✏️</button>
                        <button className="btn-icon" onClick={() => eliminarGasto(item.IdGasto)}>🗑️</button>
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

      <button className="boton-primario" onClick={() => { resetearForm(); setModalAbierto(true); }}>Registrar Gasto</button>
      {vermas && itemSeleccionado && (
        <div className="seccion-detalle-inferior" style={{ marginTop: "20px", padding: "20px", backgroundColor: "#1e1e1f", borderRadius: "12px", border: "1px solid #333", width: "80%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2>Detalle: {itemSeleccionado.Descripcion}</h2>
            <button onClick={() => setVerMas(false)} className="btn-link">✕</button>
          </div>

          <div className="formulario-grid">
            {/* Categoría */}
            <div className="formulario-grupo">
              <label>Categoría</label>
              <p>
                {categorias.find(c => c.IdCategoria === itemSeleccionado.IdCategoria)?.Nombre || "Cargando..."}
              </p>
            </div>

            {/* Divisa */}
            <div className="formulario-grupo">
              <label>Divisa</label>
              <p>
                {divisa.find(d => d.IdDivisa === itemSeleccionado.IdDivisa)?.CodigoISO || "Cargando..."}
              </p>
            </div>

            {/* Modo de Pago */}
            <div className="formulario-grupo">
              <label>Modo de Pago</label>
              <p>
                {modosPago.find(m => m.IdModoPago === itemSeleccionado.IdModoPago)?.Nombre || "Cargando..."}
              </p>
            </div>

            {/* Monto (Gasto) */}
            <div className="formulario-grupo">
              <label>Monto</label>
              <p className="monto-destacado" style={{ color: '#ff4b4b', fontWeight: 'bold' }}>
                {/* Asegúrate de usar la propiedad correcta: MontoGasto */}
                {FormatearMoneda(Number(itemSeleccionado.MontoGasto), itemSeleccionado.IdDivisa)}
              </p>
            </div>

            {/* Fecha Gasto */}
            <div className="formulario-grupo">
              <label>Fecha del Gasto</label>
              <p>{new Date(itemSeleccionado.FechaGasto).toLocaleDateString()}</p>
            </div>

          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="capa-modal">
          <div className="contenido-modal">
            <h3 className="modal-titulo">{form.IdGasto ? "Editar Gasto" : "Nuevo Gasto"}</h3>
            <div className="formulario-grid">
              <div className="formulario-grupo full-width">
                <label>Descripción</label>
                <input
                  placeholder="Gasto realizado en colegio para merienda..."
                  type="text"
                  value={form.Descripcion}
                  maxLength={100}
                  onChange={(e) => setForm({ ...form, Descripcion: e.target.value })}
                />

                {/* Contador de caracteres */}
                <small style={{ color: form.Descripcion.length >= 100 ? '#ff4b4b' : '#8e8e93' }}>
                  {form.Descripcion.length} / 100 caracteres
                </small>
              </div>
              <div className="formulario-grupo">
                <label>Monto</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="7.000..."
                  value={formatMontoParaInput(form.MontoGasto)}
                  onChange={(e) => {
                    // 1. Obtenemos el valor crudo del input
                    let val = e.target.value;

                    // 2. Quitamos los puntos de los miles para evitar conflictos
                    val = val.replace(/\./g, "");

                    // 3. Reemplazamos la coma por un punto para que la regex y parseFloat lo entiendan
                    val = val.replace(/,/g, ".");

                    const numVal = parseFloat(val);
                    const MAX_VALOR = 1000000000;

                    // Regex para permitir solo números y hasta 2 decimales
                    const regex = /^\d*\.?\d{0,2}$/;

                    // Lógica: Si está vacío, O cumple el formato y es menor al límite, actualizamos
                    if (val === "" || (regex.test(val) && numVal <= MAX_VALOR)) {
                      setForm({ ...form, MontoGasto: val });
                    }
                  }}
                />
              </div>
              <div className="formulario-grupo"><label>Fecha</label><input type="date" value={form.FechaGasto} onChange={(e) => setForm({ ...form, FechaGasto: e.target.value })} /></div>

              <div className="formulario-grupo">
                <label>Categoría</label>
                <select
                  value={form.IdCategoria}
                  onChange={(e) => setForm({ ...form, IdCategoria: parseInt(e.target.value) })}
                >
                  {categorias.map(cat => (
                    <option key={cat.IdCategoria} value={cat.IdCategoria}>
                      {cat.Nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formulario-grupo">
                <label>Modo de pago</label>
                <select
                  value={form.IdModoPago}
                  onChange={(e) => setForm({ ...form, IdModoPago: parseInt(e.target.value) })}
                >
                  {modosPago.map(modo => (
                    <option key={modo.IdModoPago} value={modo.IdModoPago}>
                      {modo.Nombre}
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
              <button className="boton-primario" onClick={manejarGuardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gasto;

