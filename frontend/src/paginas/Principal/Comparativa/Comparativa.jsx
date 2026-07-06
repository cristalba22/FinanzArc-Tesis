import React, { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Link } from "react-router-dom";
import { toast } from "react-toastify";


import '../General/General.css';
import './Comparativa.css';
import { obtenerTasas } from '../../../apiConfig';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const Comparativa = () => {
    // --- ESTADOS GLOBALES ---
    const [cargando, setCargando] = useState(true);
    const [idUsuario, setIdUsuario] = useState(null);
    const [rolHabilitado, setRolHabilitado] = useState(true);
    const [esPremium, setEsPremium] = useState(false); // Acceso a gráfico anual
    const [tipoPresentacion, setTipoPresentacion] = useState(1);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [datosModal, setDatosModal] = useState({ titulo: "", items: [], tipo: "" });
    const [datosLinea, setDatosLinea] = useState([]);
    const [cargandoLinea, setCargandoLinea] = useState(false);
    const [maximoGrafico, setMaximoGrafico] = useState(0);

    const [tasas, setTasas] = useState({ USD: 0, EUR: 0 });
    const DIVISAS_MAP = { 1: 'ARS', 2: 'USD', 3: 'EUR' };

    const coloresIngreso = ["#007AFF", "#FF9500", "#34C759", "#AF52DE"];
    const coloresGasto = ["#FF4B4B", "#FFD700", "#4B79FF", "#FF7F50"];

    const [offsets, setOffsets] = useState({ gastoA: 0, gastoB: -1, ingresoA: 0, ingresoB: -1 });

    const [datos, setDatos] = useState({
        gastoATotal: 0, gastoALista: [],
        gastoBTotal: 0, gastoBLista: [],
        ingresoATotal: 0, ingresoALista: [],
        ingresoBTotal: 0, ingresoBLista: []
    });

    // --- LÓGICA DE USUARIO Y TOKEN ---
    const validarUsuario = useCallback(async () => {
        const token = localStorage.getItem("Token");
        if (!token) { setCargando(false); return; }
        try {
            const res = await fetch(`${API_BASE_URL}/Usuarios/ByToken`, { headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) {
                const user = await res.json();
                const rolUsuario = user.IdRol || user.idRol;

                // Permitimos acceso general a Roles 2 (Gold), 3 (Platinum) y 4 (Dev)
                if (rolUsuario >= 2) {
                    setIdUsuario(user.IdUsuario);
                    setRolHabilitado(true);
                    // Solo 3 y 4 tienen acceso Premium
                    setEsPremium(rolUsuario === 3 || rolUsuario === 4);
                } else {
                    setRolHabilitado(false);
                    setCargando(false);
                }
            } else { setCargando(false); }
        } catch (error) { console.error(error); setCargando(false); }
    }, []);

    const getNombreMes = (offset) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() + (offset || 0));


        const mes = d.toLocaleDateString('es-ES', { month: 'long' });
        const nombreMes = mes.charAt(0).toUpperCase() + mes.slice(1);
        const anio = d.getFullYear();

        return `${nombreMes} - ${anio}`;
    };

    const getRangoMes = (offset) => {
        const ahora = new Date();
        const inicio = new Date(ahora.getFullYear(), ahora.getMonth() + offset, 1, 6, 0, 0);
        const fin = new Date(ahora.getFullYear(), ahora.getMonth() + offset + 1, 1, 5, 59, 59);
        return { inicio: inicio.toISOString(), fin: fin.toISOString() };
    };

    const calcularMontoEnPesos = useCallback((monto, idDivisa) => {
        if (idDivisa === 2) return monto * tasas.USD;
        if (idDivisa === 3) return monto * tasas.EUR;
        return monto;
    }, [tasas]);

    // --- CARGA DE DATOS ---
    const cargarDatoIndividual = useCallback(async (tipo, offset, clave) => {
        if (!idUsuario) return;
        const { inicio, fin } = getRangoMes(offset);
        const epVivo = tipo === 'gasto' ? `/Gasto/ByUsuario/${idUsuario}` : `/Ingreso/ByUsuario/${idUsuario}`;
        const epHist = tipo === 'gasto' ? `/HistorialGasto/ByUsuario/${idUsuario}` : `/HistorialIngreso/ByUsuario/${idUsuario}`;

        try {
            const [resV, resH] = await Promise.all([fetch(`${API_BASE_URL}${epVivo}`), fetch(`${API_BASE_URL}${epHist}`)]);
            const vivos = resV.ok ? await resV.json() : [];
            const historial = resH.ok ? await resH.json() : [];
            const todos = [...vivos, ...historial];

            const filtrados = todos.filter(item => {
                const fechaStr = item.FechaGasto || item.FechaIngreso || item.Fecha;
                if (!fechaStr) return false;
                const f = new Date(fechaStr);
                return (f >= new Date(inicio) && f <= new Date(fin));
            });

            const listaFormateada = filtrados.map(item => ({
                nombre: item.Descripcion || item.NombreIngreso || "Registro Histórico",
                valor: calcularMontoEnPesos(Number(item.MontoGasto || item.MontoIngreso || item.Monto || 0), item.IdDivisa || 1)
            }));

            const total = listaFormateada.reduce((acc, curr) => acc + curr.valor, 0);

            setDatos(prev => ({
                ...prev,
                [`${clave}Total`]: total,
                [`${clave}Lista`]: listaFormateada
            }));
        } catch (error) { console.error("Error cargando datos:", error); }
    }, [idUsuario, calcularMontoEnPesos]);

    const cargarTodosLosDatos = useCallback(async () => {
        if (!idUsuario) return;
        setCargando(true);
        await Promise.all([
            cargarDatoIndividual('gasto', offsets.gastoA, 'gastoA'),
            cargarDatoIndividual('gasto', offsets.gastoB, 'gastoB'),
            cargarDatoIndividual('ingreso', offsets.ingresoA, 'ingresoA'),
            cargarDatoIndividual('ingreso', offsets.ingresoB, 'ingresoB')
        ]);
        setCargando(false);
    }, [idUsuario, offsets, cargarDatoIndividual]);

    const cargarDatosLinea = useCallback(async () => {
        if (!idUsuario || !esPremium) return;
        try {
            setCargandoLinea(true);

            const [resIngresos, resHistIngresos, resGastos, resHistGastos] = await Promise.all([
                fetch(`${API_BASE_URL}/Ingreso/ByUsuario/${idUsuario}`),
                fetch(`${API_BASE_URL}/HistorialIngreso/ByUsuario/${idUsuario}`),
                fetch(`${API_BASE_URL}/Gasto/ByUsuario/${idUsuario}`),
                fetch(`${API_BASE_URL}/HistorialGasto/ByUsuario/${idUsuario}`)
            ]);

            const ingresos = resIngresos.ok ? await resIngresos.json() : [];
            const histIngresos = resHistIngresos.ok ? await resHistIngresos.json() : [];
            const gastos = resGastos.ok ? await resGastos.json() : [];
            const histGastos = resHistGastos.ok ? await resHistGastos.json() : [];

            const todosIngresos = [...ingresos, ...histIngresos];
            const todosGastos = [...gastos, ...histGastos];
            const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const añoActual = new Date().getFullYear();

            // Procesamos todos los datos primero
            const datosPorMes = meses.map((mes, index) => {
                const totalIngresos = todosIngresos.reduce((acc, item) => {
                    const fecha = new Date(item.FechaIngreso || item.Fecha);
                    if (fecha.getMonth() === index && fecha.getFullYear() === añoActual) {
                        return acc + calcularMontoEnPesos(Number(item.MontoIngreso || item.Monto || 0), item.IdDivisa || 1);
                    }
                    return acc;
                }, 0);

                const totalGastos = todosGastos.reduce((acc, item) => {
                    const fecha = new Date(item.FechaGasto || item.Fecha);
                    if (fecha.getMonth() === index && fecha.getFullYear() === añoActual) {
                        return acc + calcularMontoEnPesos(Number(item.MontoGasto || item.Monto || 0), item.IdDivisa || 1);
                    }
                    return acc;
                }, 0);

                return { mes, ingresos: totalIngresos, gastos: totalGastos };
            });

            // Calculamos máximo
            let maximo = 0;
            datosPorMes.forEach(item => {
                const mayor = Math.max(item.ingresos, item.gastos);
                if (mayor > maximo) maximo = mayor;
            });

            // --- CAMBIO CLAVE AQUÍ ---
            // Actualizamos los estados una sola vez, sin bucles ni delays
            setMaximoGrafico(maximo + 1000);
            setDatosLinea(datosPorMes);

        } catch (error) {
            console.error("Error al cargar datos línea:", error);
        } finally {
            setCargandoLinea(false);
        }
    }, [idUsuario, calcularMontoEnPesos, esPremium]);

    // --- EFECTOS ---
    useEffect(() => {
        const cargarTasas = async () => {
            try {
                const valores = await obtenerTasas();
                // Validamos que los valores existan y tengan el formato esperado
                if (valores && valores.USD !== undefined && valores.EUR !== undefined) {
                    setTasas(valores);
                } else {
                    // Si la API responde pero el formato es incorrecto, usamos los defaults
                    throw new Error("Formato de tasas inválido");
                }
            } catch (error) {
                console.warn("Error al obtener tasas, usando valores de respaldo:", error);
                // Valores predefinidos en caso de error o fallo de conexión
                setTasas({ USD: 1450, EUR: 1650 });
            }
        };
        cargarTasas();
    }, []);
    useEffect(() => { validarUsuario(); }, [validarUsuario]);
    useEffect(() => { if (idUsuario && rolHabilitado) { cargarTodosLosDatos(); } }, [idUsuario, rolHabilitado, cargarTodosLosDatos]);
    useEffect(() => { if (tipoPresentacion === 3 && idUsuario && esPremium) { cargarDatosLinea(); } }, [tipoPresentacion, idUsuario, esPremium, cargarDatosLinea]);


    const abrirDetalleMes = async (tipo, offset, titulo) => {
        if (!idUsuario) return;
        const { inicio, fin } = getRangoMes(offset);
        const epVivo = tipo === 'gasto' ? `/Gasto/ByUsuario/${idUsuario}` : `/Ingreso/ByUsuario/${idUsuario}`;
        const epHist = tipo === 'gasto' ? `/HistorialGasto/ByUsuario/${idUsuario}` : `/HistorialIngreso/ByUsuario/${idUsuario}`;
        try {
            const [resV, resH] = await Promise.all([fetch(`${API_BASE_URL}${epVivo}`), fetch(`${API_BASE_URL}${epHist}`)]);
            const combinados = [...(resV.ok ? await resV.json() : []), ...(resH.ok ? await resH.json() : [])];
            const filtrados = combinados.filter(item => { const f = new Date(item.FechaGasto || item.FechaIngreso || item.Fecha); return f >= new Date(inicio) && f <= new Date(fin); });
            setDatosModal({ titulo: `${titulo} - ${getNombreMes(offset)}`, items: filtrados, tipo });
            setModalAbierto(true);
        } catch (error) { console.error(error); }
    };

    const calcularDiferencia = (valorA, valorB, esGasto = true) => {
        const diferencia = valorA - valorB;
        const porcentaje = valorB !== 0 ? ((diferencia / valorB) * 100).toFixed(1) : "100";
        const esPositivo = esGasto ? diferencia <= 0 : diferencia >= 0;

        const esIgual = diferencia === 0;
        if (esIgual) return { monto: 0, percentage: 0, clase: "tendencia-neutral", texto: "Lo mismo que en el periodo" };
        return { monto: Math.abs(diferencia), percentage: Math.abs(porcentaje), clase: esPositivo ? "tendencia-positiva" : "tendencia-negativa", texto: diferencia >= 0 ? "Más que en el periodo" : "Menos que en el periodo" };
    };

    // --- RENDERIZADO DE COMPONENTES ---
    const GraficoConNav = ({ titulo, valorTotal, listaDetalle, offset, setOffsetKey, tipo, syncOffsets = [] }) => {
        const esVacio = valorTotal === 0;
        const paleta = tipo === 'gasto' ? coloresGasto : coloresIngreso;
        const dataGrafico = listaDetalle.length > 0 ? listaDetalle : [{ nombre: "Total", valor: 0 }];

        const handleOffsetChange = (newVal) => {
            setOffsets(p => {
                const updated = { ...p, [setOffsetKey]: newVal };
                syncOffsets.forEach(key => { updated[key] = newVal; });
                return updated;
            });
        };

        return (
            <div className="tarjeta-general grafico-ajustado">
                <div className="encabezado-grafico-nav">
                    <span className="badge-periodo">{titulo}</span>
                    <div className="selector-mes-nav">
                        <button onClick={() => handleOffsetChange(offset - 1)}>❮</button>
                        <span> {getNombreMes(offset)}</span>
                        <button onClick={() => handleOffsetChange(offset + 1)} disabled={offset >= 0}>❯</button>
                    </div>
                </div>
                <div className="contenedor-chart-relativo">
                    {esVacio ? (
                        <div className="estado-vacio-grafico"><div className="circulo-vacio"><span>Sin datos</span></div></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie data={dataGrafico} cx="50%" cy="50%" innerRadius={110} outerRadius={130} dataKey="valor" nameKey="nombre" stroke="none" paddingAngle={2} animationDuration={2500}>
                                    {dataGrafico.map((entry, index) => (<Cell key={`cell-${index}`} fill={paleta[index % paleta.length]} />))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e1e1f', borderRadius: '10px', border: '1px solid rgba(200, 178, 119, 0.3)', color: '#fff' }} itemStyle={{ color: '#c8b277' }} formatter={(value, name) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name]} />
                                <text x="50%" y="45%" textAnchor="middle" fill="#888" fontSize="13" fontWeight="600">Total</text>
                                <text x="50%" y="60%" textAnchor="middle" fill="#c8b277" fontSize="16" fontWeight="600">${valorTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <button className="btn-ver-detalles" onClick={() => abrirDetalleMes(tipo, offset, titulo)} disabled={esVacio}>Ver Detalle</button>
            </div>
        );
    };

    const renderContenido = () => {

        if (tipoPresentacion === 3 && !esPremium) {
            setTipoPresentacion(1);
            return null;
        }

        if (tipoPresentacion === 1) {
            return (
                <div className="comparativa-grid-layout">
                    {/* SECCIÓN GASTOS */}
                    <div className="seccion-comparativa-fila">
                        <div className="encabezado-fila-premium">
                            <h2 className="subtitulo-seccion">Comparación Mensual de Gastos</h2>
                            <div className="tarjeta-balance-superior" >
                                <div className="icon-comparar">VS</div>
                                <div className={`info-balance ${calcularDiferencia(datos.gastoATotal, datos.gastoBTotal, true).clase}`}>
                                    <p className="monto-balance truncate-text-comparativa">Gastaste ${calcularDiferencia(datos.gastoATotal, datos.gastoBTotal, true).monto.toLocaleString()}</p>
                                    <span className="porcentaje-balance">{calcularDiferencia(datos.gastoATotal, datos.gastoBTotal, true).texto} B ({calcularDiferencia(datos.gastoATotal, datos.gastoBTotal, true).percentage}%)</span>
                                </div>
                            </div>
                        </div>
                        <div className="fila-comparativa-master">
                            <GraficoConNav titulo="Gastos Periodo A" valorTotal={datos.gastoATotal} listaDetalle={datos.gastoALista} offset={offsets.gastoA} setOffsetKey="gastoA" tipo="gasto" />
                            <GraficoConNav titulo="Gastos Periodo B" valorTotal={datos.gastoBTotal} listaDetalle={datos.gastoBLista} offset={offsets.gastoB} setOffsetKey="gastoB" tipo="gasto" />
                        </div>
                    </div>

                    {/* SECCIÓN INGRESOS */}
                    <div className="seccion-comparativa-fila" style={{ marginTop: '50px' }}>
                        <div className="encabezado-fila-premium">
                            <h2 className="subtitulo-seccion">Comparación Mensual de Ingresos</h2>
                            <div className="tarjeta-balance-superior">
                                <div className="icon-comparar">VS</div>
                                <div className={`info-balance ${calcularDiferencia(datos.ingresoATotal, datos.ingresoBTotal, false).clase}`}>
                                    <p className="monto-balance truncate-text-comparativa">Ingresaste ${calcularDiferencia(datos.ingresoATotal, datos.ingresoBTotal, false).monto.toLocaleString()}</p>
                                    <span className="porcentaje-balance">{calcularDiferencia(datos.ingresoATotal, datos.ingresoBTotal, false).texto} B ({calcularDiferencia(datos.ingresoATotal, datos.ingresoBTotal, false).percentage}%)</span>
                                </div>
                            </div>
                        </div>
                        <div className="fila-comparativa-master">
                            <GraficoConNav titulo="Ingresos Periodo A" valorTotal={datos.ingresoATotal} listaDetalle={datos.ingresoALista} offset={offsets.ingresoA} setOffsetKey="ingresoA" tipo="ingreso" />
                            <GraficoConNav titulo="Ingresos Periodo B" valorTotal={datos.ingresoBTotal} listaDetalle={datos.ingresoBLista} offset={offsets.ingresoB} setOffsetKey="ingresoB" tipo="ingreso" />
                        </div>
                    </div>
                </div>
            );
        } else if (tipoPresentacion === 2) {
            const resultadoBalance = calcularDiferencia(datos.ingresoATotal, datos.gastoATotal, false);
            return (
                <div className="comparativa-grid-layout">
                    <div className="seccion-comparativa-fila">
                        <div className="encabezado-fila-premium">
                            <h2 className="subtitulo-seccion">Balance Mensual Neto</h2>
                            <div className="tarjeta-balance-superior">
                                <div className="icon-comparar">NETO</div>
                                <div className={`info-balance ${resultadoBalance.clase}`}>
                                    <p className="monto-balance truncate-text-comparativa">
                                        ${Math.abs(datos.ingresoATotal - datos.gastoATotal).toLocaleString()}
                                    </p>

                                    {/* 3. Mostramos el texto según el resultado */}
                                    <span className="porcentaje-balance">
                                        {resultadoBalance.clase === "tendencia-neutral"
                                            ? resultadoBalance.texto 
                                            : "Diferencia Ingresos - Gastos"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="fila-comparativa-master">
                            <GraficoConNav titulo="Ingresos A" valorTotal={datos.ingresoATotal} listaDetalle={datos.ingresoALista} offset={offsets.ingresoA} setOffsetKey="ingresoA" tipo="ingreso" syncOffsets={["gastoA"]} />
                            <GraficoConNav titulo="Gastos A" valorTotal={datos.gastoATotal} listaDetalle={datos.gastoALista} offset={offsets.gastoA} setOffsetKey="gastoA" tipo="gasto" syncOffsets={["ingresoA"]} />
                        </div>
                    </div>
                </div>
            );
        } else if (tipoPresentacion === 3) {
            return (
                <div className="tarjeta-general grafico-linea-container">
                    <div className="header-linea">
                        <h2>Evolución Financiera Anual</h2>
                        <p>Comparación mensual de ingresos y gastos</p>
                    </div>
                    <div>
                        <ResponsiveContainer width="100%" height={500}>
                            <LineChart data={datosLinea} margin={{ top: 50, right: 50, left: 50, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2b" vertical={false} />
                                <XAxis dataKey="mes" stroke="#888" tick={{ fill: '#888' }} />
                                <YAxis stroke="#888" domain={[0, maximoGrafico]} tick={{ fill: '#888' }} tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                                <Tooltip contentStyle={{ backgroundColor: "#1e1e1f", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "10px", color: "#fff" }} itemStyle={{ fontWeight: 500 }} formatter={(value, name) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name]} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" name="Ingresos" dataKey="ingresos" stroke="#007AFF" strokeWidth={4} dot={{ r: 4, fill: "#1e1e1f", stroke: "#007AFF", strokeWidth: 2 }} activeDot={{ r: 7, strokeWidth: 0, fill: "#007AFF" }} animationDuration={1500} animationBegin={300} />
                                <Line type="monotone" name="Gastos" dataKey="gastos" stroke="#FF4B4B" strokeWidth={4} dot={{ r: 4, fill: "#1e1e1f", stroke: "#FF4B4B", strokeWidth: 2 }} activeDot={{ r: 7, strokeWidth: 0, fill: "#FF4B4B" }} animationDuration={1500} animationBegin={300} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {cargandoLinea && <div className="toast-loading">Generando gráfico...</div>}
                </div>
            );
        }
    }

    if (!rolHabilitado) {
        return (
            <div className="contenedor-principal-general" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="tarjeta-general" style={{ textAlign: 'center', padding: '40px', maxWidth: '500px' }}>
                    <div style={{ fontSize: '50px', marginBottom: '20px' }}>🔒</div>
                    <h2 style={{ color: '#FF4B4B', marginBottom: '15px' }}>Apartado No Habilitado</h2>
                    <p style={{ color: '#888', marginBottom: '25px', lineHeight: '1.6' }}>Para acceder a este apartado, necesitas mejorar tu suscripción actual. En este apartado de comparativas y balances mensuales podrás analizar tu rendimiento financiero de manera detallada.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <Link
                            to="/planes"
                            className="botonesComparativa btn-principal"
                            onClick={() => toast.info("Redirigiendo a planes...")}
                        >   Explorar Planes</Link>
                        <Link to="/Principal" className="botonesComparativa btn-volver" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>Volver al Inicio</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="contenedor-principal-general">
            <div className="seccion-encabezado-general">
                <div className="titulo-principal-general">
                    <h2>{tipoPresentacion === 1 ? "Comparativa Mensual Detallada" : tipoPresentacion === 2 ? "Balance de Ingresos y Gastos" : "Gráfico de Desempeño Económico"}</h2>
                    <p className="descripcion-encabezado">
                        {tipoPresentacion === 1 ? <p>
                            Seleccione dos meses de interés para comparar visualmente sus ingresos y gastos,
                            y descubrir tendencias en su comportamiento financiero.
                            <br />
                            En la sección "Ver Detalles" podrá profundizar sobre los movimientos registrados en el mes.
                        </p> :
                            tipoPresentacion === 2 ? "Cruza datos de ingresos y gastos de un mismo periodo para mostrar resultado neto." :
                                "Analice visualmente el comportamiento anual de sus finanzas."}
                    </p>
                </div>

                <div className='botonesFuncionesComparativa'>
                    <div className='botonesBalanceComparativa'>
                        {esPremium && (
                            <button onClick={() => { setTipoPresentacion(3); }} className='botonesComparativa btn-principal'>
                                Ver Evolución Anual
                            </button>
                        )}
                        <button onClick={() => setTipoPresentacion(tipoPresentacion === 1 ? 2 : 1)} className='botonesComparativa btn-principal'>
                            {tipoPresentacion === 1 ? "Ver Balances Mensuales" : "Ver Comparativa Mensual"}
                        </button>

                    </div>
                </div>
            </div>

            {renderContenido()}

            {modalAbierto && (
                <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
                    <div className="modal-contenido" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{datosModal.titulo}</h3>
                            <button className="btn-cerrar" onClick={() => setModalAbierto(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="table-responsive">
                                <table className="tabla-detalle">
                                    <thead><tr><th>Fecha</th><th>Descripción</th><th>Monto</th></tr></thead>
                                    <tbody>
                                        {datosModal.items.map((item, i) => {
                                            const monto = item.MontoGasto || item.MontoIngreso || item.Monto;
                                            const idDivisa = item.IdDivisa || 1; // Por defecto ARS
                                            const moneda = DIVISAS_MAP[idDivisa];

                                            return (
                                                <tr key={i}>
                                                    <td>{new Date(item.FechaGasto || item.FechaIngreso || item.Fecha).toLocaleDateString()}</td>
                                                    <td className='truncate-text-descripcion-detalle'>{item.Descripcion || item.NombreIngreso || "Registro Histórico"}</td>
                                                    <td className={datosModal.tipo === 'gasto' ? 'texto-rojo' : 'texto-verde'}>
                                                        <span>${Number(monto).toLocaleString()} {moneda}</span>

                                                        {/* Condición para mostrar la conversión si es USD o EUR */}
                                                        {(idDivisa === 2 || idDivisa === 3) && (
                                                            <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.7, marginTop: '2px' }}>
                                                                ≈ ${calcularMontoEnPesos(Number(monto), idDivisa).toLocaleString()} ARS
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {cargando && <div className="toast-loading">Actualizando...</div>}
        </div>
    );
};

export default Comparativa;
