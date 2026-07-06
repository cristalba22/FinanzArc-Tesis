import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { toast } from "react-toastify";
import "./AdminDashboard.css";
import { useNavigate } from "react-router-dom";
// Asumo que tu componente SinPermisos lo manejas desde las rutas, 
// o si lo renderizas condicionalmente podés usarlo más abajo.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const COLORS = ["#76643c", "#c8b277", "#eadeaa", "#ffffff"];

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

const formatoNumero = new Intl.NumberFormat("es-AR");

const filtrosIniciales = {
  año: "",
  mes: "",
  idUsuario: "",
  idRol: "",
  activo: "",
  tipoMovimiento: "todos",
  busqueda: ""
};

const meses = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" }
];

const obtenerFechaInput = (fecha) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const AdminDashboard = () => {
  const navigate = useNavigate(); // Hook instanciado en la raíz

  const [verificado, setVerificado] = useState(false); // Nuevo estado para validar rol real
  const [verificandoPermisos, setVerificandoPermisos] = useState(true);

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState({
    ...filtrosIniciales,
    año: String(new Date().getFullYear())
  });
  const [movimientoEditando, setMovimientoEditando] = useState(null);

  // 1. Verificación contra el Backend (C# API)
  useEffect(() => {
    const verificarAcceso = async () => {

      const token = localStorage.getItem("Token");
      if (!token) { setCargando(false); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/Usuarios/ByToken`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {

          const user = await res.json();
          const rolUsuario = user.IdRol || user.idRol;

          // Permitimos acceso general a Roles 2 (Gold), 3 (Platinum) y 4 (Dev)
          if (user.IdRol === 4) {
            setVerificado(true);
            setCargando(false);
          } else {
            navigate("/sin-permisos");
          }
        } else {

          setCargando(false);
        }
      } catch (error) { console.error(error); setCargando(false); }
    };
    verificarAcceso();
  }, [navigate]);



  // 2. Construcción de Query Params
  const construirQuery = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined && value !== "todos") {
        params.set(key, value);
      }
    });
    return params.toString();
  }, [filtros]);

  // 3. Carga del Dashboard (Sólo si ya está verificado)
  const cargarDashboard = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const query = construirQuery();
      const response = await fetch(`${API_BASE_URL}/AdminDashboard/Resumen${query ? `?${query}` : ""}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("Token")}`
        }
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || payload.Message || "No se pudo cargar el panel administrador.");
      }

      setDatos(payload);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setCargando(false);
    }
  }, [construirQuery]);

  // Ejecutar carga de dashboard sólo cuando cambie a verificado = true o cambien los filtros manuales
  useEffect(() => {
    if (verificado) {
      cargarDashboard();
    }
  }, [verificado, cargarDashboard]);

  // Resto de las funciones operativas
  const ejecutarAccion = async (url, opciones, mensajeOk) => {
    setGuardando(true);
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...opciones,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
          ...(opciones?.headers || {})
        }
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || payload.Message || "No se pudo completar la accion.");
      }

      toast.success(payload.message || mensajeOk);
      await cargarDashboard();
      return true;
    } catch (err) {
      console.error(err);
      toast.error(err.message);
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoUsuario = (usuario) => {
    const accion = usuario.Activo ? "dar de baja" : "reactivar";
    const confirmar = window.confirm(`Seguro que queres ${accion} a ${usuario.Nombre || usuario.NombreUsuario}?`);
    if (!confirmar) return;

    ejecutarAccion(`/AdminDashboard/Usuarios/${usuario.IdUsuario}/Estado`, {
      method: "PUT",
      body: JSON.stringify({ Activo: !usuario.Activo })
    }, "Estado actualizado correctamente.");
  };

  const cambiarRolUsuario = (usuario, idRol) => {
    ejecutarAccion(`/AdminDashboard/Usuarios/${usuario.IdUsuario}/Rol`, {
      method: "PUT",
      body: JSON.stringify({ IdRol: Number(idRol) })
    }, "Plan actualizado correctamente.");
  };

  const eliminarMovimiento = (movimiento) => {
    const confirmar = window.confirm(`Seguro que queres eliminar este ${movimiento.Tipo.toLowerCase()}?`);
    if (!confirmar) return;

    ejecutarAccion(`/AdminDashboard/Movimientos/${movimiento.Tipo}/${movimiento.Id}`, {
      method: "DELETE"
    }, "Movimiento eliminado correctamente.");
  };

  const guardarMovimiento = async (event) => {
    event.preventDefault();
    if (!movimientoEditando) return;

    const ok = await ejecutarAccion(`/AdminDashboard/Movimientos/${movimientoEditando.Tipo}/${movimientoEditando.Id}`, {
      method: "PUT",
      body: JSON.stringify({
        Descripcion: movimientoEditando.Descripcion,
        Monto: Number(movimientoEditando.Monto),
        Fecha: movimientoEditando.Fecha,
        IdDivisa: Number(movimientoEditando.IdDivisa)
      })
    }, "Movimiento actualizado correctamente.");

    if (ok) setMovimientoEditando(null);
  };

  const planesConPorcentaje = useMemo(() => {
    if (!datos?.UsuariosPorPlan) return [];

    return datos.UsuariosPorPlan.map((plan) => ({
      ...plan,
      Porcentaje: datos.TotalUsuarios > 0
        ? Number(((Number(plan.Usuarios) * 100) / Number(datos.TotalUsuarios)).toFixed(1))
        : 0
    }));
  }, [datos]);

  const usuariosFiltro = datos?.ActividadPorUsuario || [];
  const planesDisponibles = datos?.PlanesDisponibles || [];

  // PANTALLAS DE CARGA Y ERROR TEMPRANAS


  const rentabilidadReferencia = datos?.MrrEstimado > 0
    ? Math.min(100, (Number(datos.MrrEstimado) / 100000) * 100)
    : 0;

  return (
    <main className="admin-dashboard">



      <section className="admin-hero">
        <span className="admin-kicker">Panel Developer / Administrador</span>
        <div>
          <h1>Control de Suscripciones</h1>
          <p>
            Gestiona usuarios, suscripciones y movimientos en tiempo real. Este panel refleja
            exclusivamente los registros activos; los datos archivados se trasladan
            automáticamente al Historial.
          </p>
        </div>
      </section>

      <section className="admin-panel admin-filters">
        <div className="admin-panel-heading">
          <h2>Filtros de analisis</h2>
          <span>{cargando ? "Actualizando..." : "Datos en vivo"}</span>
        </div>

        <div className="admin-filter-grid">
          <label>
            Buscar usuario
            <input
              type="search"
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              placeholder="Nombre, usuario o email"
            />
          </label>

          <label>
            Mes
            <select value={filtros.mes} onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}>
              <option value="">Todos</option>
              {meses.map((mes) => <option key={mes.value} value={mes.value}>{mes.label}</option>)}
            </select>
          </label>

          <label>
            Año
            <input
              type="number"
              value={filtros.año}
              onChange={(e) => setFiltros({ ...filtros, año: e.target.value })}
              min="2020"
              max="2100"
            />
          </label>

          <label>
            Usuario
            <select value={filtros.idUsuario} onChange={(e) => setFiltros({ ...filtros, idUsuario: e.target.value })}>
              <option value="">Todos</option>
              {usuariosFiltro.map((usuario) => (
                <option key={usuario.IdUsuario} value={usuario.IdUsuario}>
                  {usuario.Nombre || usuario.NombreUsuario}
                </option>
              ))}
            </select>
          </label>

          <label>
            Plan
            <select value={filtros.idRol} onChange={(e) => setFiltros({ ...filtros, idRol: e.target.value })}>
              <option value="">Todos</option>
              {planesDisponibles.map((plan) => (
                <option key={plan.IdRol} value={plan.IdRol}>{plan.Nombre}</option>
              ))}
              <option value="4">Developer</option>
            </select>
          </label>

          <label>
            Estado
            <select value={filtros.activo} onChange={(e) => setFiltros({ ...filtros, activo: e.target.value })}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Dados de baja</option>
            </select>
          </label>

          <label>
            Movimiento
            <select value={filtros.tipoMovimiento} onChange={(e) => setFiltros({ ...filtros, tipoMovimiento: e.target.value })}>
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>
          </label>

          <div className="admin-filter-actions">
            <button className="admin-btn ghost" onClick={() => setFiltros({ ...filtrosIniciales, año: String(new Date().getFullYear()) })}>Limpiar</button>
          </div>
        </div>
      </section>

      <section className="admin-metric-grid">
        <article className="admin-metric-card metric-highlight">
          <span>Ingreso mensual estimado</span>
          <strong>{formatoARS.format(datos?.MrrEstimado || 0)}</strong>
          <small>Segun usuarios y plan activo filtrado.</small>
        </article>

        <article className="admin-metric-card">
          <span>Usuarios filtrados</span>
          <strong>{formatoNumero.format(datos?.TotalUsuarios || 0)}</strong>
          <small>{datos?.ActivosPorcentaje || 0}% activos en la plataforma.</small>
        </article>

        <article className="admin-metric-card">
          <span>Conversion a pago</span>
          <strong>{datos?.ConversionPago || 0}%</strong>
          <small>{datos?.UsuariosPago || 0} usuarios con plan pago.</small>
        </article>

        <article className="admin-metric-card">
          <span>Ticket promedio</span>
          <strong>{formatoARS.format(datos?.TicketPromedio || 0)}</strong>
          <small>Promedio estimado entre suscriptores pagos.</small>
        </article>
      </section>

      <section className="admin-panels">
        <article className="admin-panel admin-chart-panel">
          <div className="admin-panel-heading">
            <h2>Distribucion por plan</h2>
            <span>{datos?.UsuariosPago} pagos / {datos?.UsuariosGratis} gratuitos</span>
          </div>
          <div className="admin-chart-layout">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={planesConPorcentaje} dataKey="Usuarios" nameKey="Plan" innerRadius={72} outerRadius={102} paddingAngle={4}>
                  {planesConPorcentaje.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#151515", border: "1px solid rgba(200,178,119,.25)", borderRadius: "8px" }} formatter={(value, name) => [`${value} usuarios`, name]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="admin-plan-list">
              {planesConPorcentaje.map((plan, index) => (
                <div className="admin-plan-row" key={`${plan.Plan}-${plan.IdRol}`}>
                  <span className="admin-plan-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div>
                    <strong>{plan.Plan}</strong>
                    <small>{plan.Porcentaje}% de usuarios</small>
                  </div>
                  <b>{plan.Usuarios}</b>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Altas recientes</h2>
            <span>Usuarios creados</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datos?.AltasPorMes || []}>
              <XAxis dataKey="Mes" tick={{ fill: "#9b9b9b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9b9b9b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(200,178,119,.08)" }} contentStyle={{ background: "#151515", border: "1px solid rgba(200,178,119,.25)", borderRadius: "8px" }} />
              <Bar dataKey="Usuarios" fill="#c8b277" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="admin-panels secondary">
        <article className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Rentabilidad estimada</h2>
            <span>Objetivo mensual: {formatoARS.format(100000)}</span>
          </div>
          <div className="admin-profit-block">
            <div className="admin-profit-ring">
              <strong>{rentabilidadReferencia.toFixed(0)}%</strong>
              <span>del objetivo</span>
            </div>
            <div className="admin-profit-copy">
              <p>El panel estima ingresos con el plan activo de cada usuario. Los filtros permiten simular meses, planes y segmentos.</p>
              <div className="admin-progress-track">
                <span style={{ width: `${rentabilidadReferencia}%` }} />
              </div>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Uso de la plataforma</h2>
            <span>{datos?.MovimientosTotales || 0} movimientos</span>
          </div>
          <div className="admin-usage-grid">
            <div>
              <span>Ingresos cargados</span>
              <strong>{formatoARS.format(datos?.IngresosRegistradosUsuarios || 0)}</strong>
            </div>
            <div>
              <span>Gastos cargados</span>
              <strong>{formatoARS.format(datos?.GastosRegistradosUsuarios || 0)}</strong>
            </div>
          </div>
        </article>

      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading">
          <h2>Usuarios y permisos</h2>
          <span>Editar plan o dar de baja</span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Plan</th>
                <th>Ingresos</th>
                <th>Gastos</th>
                <th>Balance declarado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltro.map((usuario) => (
                <tr key={usuario.IdUsuario}>
                  <td>
                    <strong>{usuario.Nombre || usuario.NombreUsuario}</strong>
                    <span>{usuario.Email}</span>
                  </td>
                  <td>
                    <select
                      className="admin-inline-select"
                      value={planesDisponibles.find((p) => p.Nombre === usuario.Plan)?.IdRol || (usuario.Plan === "Developer" ? 4 : "")}
                      onChange={(e) => cambiarRolUsuario(usuario, e.target.value)}
                      disabled={guardando}
                    >
                      {planesDisponibles.map((plan) => (
                        <option key={plan.IdRol} value={plan.IdRol}>{plan.Nombre}</option>
                      ))}
                      <option value="4">Developer</option>
                    </select>
                  </td>
                  <td>{usuario.Ingresos}</td>
                  <td>{usuario.Gastos}</td>
                  <td>{formatoARS.format((usuario.TotalIngresos || 0) - (usuario.TotalGastos || 0))}</td>
                  <td>
                    <span className={usuario.Activo ? "admin-status active" : "admin-status inactive"}>
                      {usuario.Activo ? "Activo" : "Baja"}
                    </span>
                  </td>
                  <td>
                    <button className={usuario.Activo ? "admin-btn danger small" : "admin-btn primary small"} onClick={() => cambiarEstadoUsuario(usuario)} disabled={guardando}>
                      {usuario.Activo ? "Dar baja" : "Reactivar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading">
          <h2>Movimientos filtrados</h2>
          <span>Editar o eliminar ingresos/gastos</span>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Usuario</th>
                <th>Descripcion</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(datos?.Movimientos || []).map((movimiento) => (
                <tr key={`${movimiento.Tipo}-${movimiento.Id}`}>
                  <td>
                    <span className={movimiento.Tipo === "Ingreso" ? "admin-status active" : "admin-status inactive"}>
                      {movimiento.Tipo}
                    </span>
                  </td>
                  <td>{movimiento.Usuario}</td>
                  <td>{movimiento.Descripcion || "Sin descripcion"}</td>
                  <td>{formatoARS.format(movimiento.Monto || 0)}</td>
                  <td>{new Date(movimiento.Fecha).toLocaleDateString("es-AR")}</td>
                  <td className="admin-actions-cell">
                    <button className="admin-btn ghost small" onClick={() => setMovimientoEditando({ ...movimiento, Fecha: obtenerFechaInput(movimiento.Fecha) })}>Editar</button>
                    <button className="admin-btn danger small" onClick={() => eliminarMovimiento(movimiento)} disabled={guardando}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {(datos?.Movimientos || []).length === 0 && (
                <tr>
                  <td colSpan="6">No hay movimientos para los filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {movimientoEditando && (
        <div className="capa-modal" onClick={() => setMovimientoEditando(null)}>
          <form className="contenido-modal admin-edit-modal" onSubmit={guardarMovimiento} onClick={(e) => e.stopPropagation()}>
            <h3>Editar {movimientoEditando.Tipo}</h3>
            <div className="formulario-cuerpo">
              <div className="formulario-grupo">
                <label>Descripcion</label>
                <input
                  type="text"
                  value={movimientoEditando.Descripcion || ""}
                  onChange={(e) => setMovimientoEditando({ ...movimientoEditando, Descripcion: e.target.value })}
                />
              </div>
              <div className="formulario-grupo">
                <label>Monto</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={movimientoEditando.Monto}
                  onChange={(e) => setMovimientoEditando({ ...movimientoEditando, Monto: e.target.value })}
                />
              </div>
              <div className="formulario-grupo">
                <label>Fecha</label>
                <input
                  type="date"
                  value={movimientoEditando.Fecha}
                  onChange={(e) => setMovimientoEditando({ ...movimientoEditando, Fecha: e.target.value })}
                />
              </div>
              <div className="formulario-grupo">
                <label>Divisa</label>
                <select
                  value={movimientoEditando.IdDivisa}
                  onChange={(e) => setMovimientoEditando({ ...movimientoEditando, IdDivisa: e.target.value })}
                >
                  <option value="1">ARS</option>
                  <option value="2">USD</option>
                  <option value="3">EUR</option>
                </select>
              </div>
            </div>
            <div className="formulario-acciones">
              <button type="button" className="boton-secundario" onClick={() => setMovimientoEditando(null)}>Cancelar</button>
              <button type="submit" className="boton-primario" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default AdminDashboard;
