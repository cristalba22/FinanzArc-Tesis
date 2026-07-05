import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "../General/General.css";
import "./Archivos.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const SERVER_HOST = import.meta.env.VITE_SERVER_BASE_URL || "";

const Archivos = () => {
  // Estado de colecciones documentales mapeadas
  const [documentosIngreso, setDocumentosIngreso] = useState([]);
  const [documentosGasto, setDocumentosGasto] = useState([]);
  const [usuario, setUsuario] = useState(null);

  // Estados de transacciones para búsqueda (lookup)
  const [historialIngresos, setHistorialIngresos] = useState([]);
  const [historialGastos, setHistorialGastos] = useState([]);

  // Estados operacionales y de seguridad
  const [cargando, setCargando] = useState(true);
  const [errorVista, setErrorVista] = useState(null);
  const [sesionExpirada, setSesionExpirada] = useState(false);
  const [rolHabilitado, setRolHabilitado] = useState(false);

  // Estado del formulario de carga reactiva
  const [modalAbierto, setModalAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [tipoSubida, setTipoSubida] = useState("ingreso");
  const [idTransaccion, setIdTransaccion] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  // Estados de filtrado documental
  const [panelActivo, setPanelActivo] = useState("ambos");
  const [mesFiltro, setMesFiltro] = useState("");
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear().toString());

  const [cargandoTransacciones, setCargandoTransacciones] = useState(false);

  // Función para obtener transacciones (para el modal)
  const cargarTransacciones = async (tipo) => {
    if (!usuario || !usuario.IdUsuario) return;
    setCargandoTransacciones(true);
    const token = localStorage.getItem("Token");
    const endpoint = tipo === "ingreso" ? "Ingreso" : "Gasto";
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}/ByUsuario/${usuario.IdUsuario}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (tipo === "ingreso") setHistorialIngresos(data);
        else setHistorialGastos(data);
      }
    } catch (error) {
      console.error("Error al cargar transacciones:", error);
    } finally {
      setCargandoTransacciones(false);
    }
  };

  useEffect(() => {
    if (modalAbierto) {
      cargarTransacciones(tipoSubida);
    }
  }, [modalAbierto, tipoSubida, usuario]);

  const filtrarDocumentos = (lista) => {
    return lista.filter((doc) => {
      const fecha = new Date(doc.FechaCarga);
      const coincideMes = mesFiltro === "" || (fecha.getMonth() + 1).toString() === mesFiltro;
      const coincideAnio = anioFiltro === "" || fecha.getFullYear().toString() === anioFiltro;
      return coincideMes && coincideAnio;
    });
  };

  const ingresosFiltrados = useMemo(() => filtrarDocumentos(documentosIngreso), [documentosIngreso, mesFiltro, anioFiltro]);
  const gastosFiltrados = useMemo(() => filtrarDocumentos(documentosGasto), [documentosGasto, mesFiltro, anioFiltro]);

  useEffect(() => {
    inicializarComponente();
  }, []);

  const forzarCierreSesion = (mensaje) => {
    localStorage.removeItem("Token");
    setErrorVista(mensaje);
    setSesionExpirada(true);
    setCargando(false);
  };

  const inicializarComponente = async () => {
    try {
      setCargando(true);
      setErrorVista(null);
      setSesionExpirada(false);

      const token = localStorage.getItem("Token");
      if (!token) {
        forzarCierreSesion("Su sesión ha expirado o no es válida.");
        return;
      }

      const resUsuario = await fetch(`${API_BASE_URL}/Usuarios/ByToken`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resUsuario.status === 401) {
        forzarCierreSesion("Sesión expirada.");
        return;
      }
      const datosUsuario = await resUsuario.json();
      setUsuario(datosUsuario);

      const esPremium = (datosUsuario.IdRol === 3 || datosUsuario.IdRol === 4);
      setRolHabilitado(esPremium);
      if (!esPremium) {
        setCargando(false);
        return;
      }

      const [resIngresos, resGastos, resTransIng, resTransGas] = await Promise.all([
        fetch(`${API_BASE_URL}/DocumentoIngreso/Listar`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/DocumentoGasto/Listar`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/Ingreso/ByUsuario/${datosUsuario.IdUsuario}`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/Gasto/ByUsuario/${datosUsuario.IdUsuario}`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (!resIngresos.ok || !resGastos.ok) throw new Error("Error al recuperar los catálogos documentales.");

      const [dataIngresos, dataGastos, dataTransIng, dataTransGas] = await Promise.all([
        resIngresos.json(), resGastos.json(), resTransIng.json(), resTransGas.json()
      ]);

      setDocumentosIngreso(dataIngresos);
      setDocumentosGasto(dataGastos);
      setHistorialIngresos(dataTransIng);
      setHistorialGastos(dataTransGas);

    } catch (err) {
      console.error("Error:", err);
      setErrorVista(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  const ejecutarSubidaArchivo = async (e) => {
    e.preventDefault();
    if (!archivoSeleccionado) {
      toast.warning("Por favor, seleccione un archivo.");
      return;
    }


    setSubiendo(true);
    const token = localStorage.getItem("Token");
    const formData = new FormData();
    formData.append("archivo", archivoSeleccionado);

    let urlUpload = "";
    if (tipoSubida === "ingreso") {
      formData.append("idIngreso", idTransaccion);
      urlUpload = `${API_BASE_URL}/DocumentoIngreso/Upload`;
    } else {
      formData.append("idGasto", idTransaccion);
      urlUpload = `${API_BASE_URL}/DocumentoGasto/Upload`;
    }

    try {
      const respuesta = await fetch(urlUpload, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (!respuesta.ok) throw new Error("Error al subir el archivo.");
      toast.success("Documento vinculado exitosamente.");
      setModalAbierto(false);
      await inicializarComponente();
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubiendo(false);
    }
  };
  const eliminarDocumento = async (idDocumento, tipo) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este comprobante? Esta acción no se puede deshacer.")) return;

    const token = localStorage.getItem("Token");
    const endpoint = tipo === "ingreso" ? "DocumentoIngreso" : "DocumentoGasto";

    try {
      // ATENCIÓN: Si te da un error 404 (Not Found), quita la palabra "/Eliminar" de la URL de abajo.
      // Quedaría así: `${API_BASE_URL}/${endpoint}/${idDocumento}`
      const url = `${API_BASE_URL}/${endpoint}/Eliminar/${idDocumento}`;

      console.log(`Intentando eliminar: ${url}`); // Para debug en consola

      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        // Capturamos el texto del error exacto que manda el servidor
        const errorText = await response.text();
        throw new Error(`Código ${response.status}: ${errorText || "Error en el servidor"}`);
      }

      toast.success("Comprobante eliminado con éxito.");

      // Actualizamos el estado usando != para evitar fallos por tipos de datos (string vs int)
      if (tipo === "ingreso") {
        setDocumentosIngreso((prev) => prev.filter(doc => doc.IdDocumentoIngreso != idDocumento));
      } else {
        setDocumentosGasto((prev) => prev.filter(doc => doc.IdDocumentoGasto != idDocumento));
      }

    } catch (error) {
      console.error("Error completo al eliminar:", error);
      toast.error(`Error al eliminar: ${error.message}`);
    }
  };
  const abrirModalCarga = (tipo) => {
    setTipoSubida(tipo);
    setIdTransaccion("");
    setArchivoSeleccionado(null);
    setModalAbierto(true);
  };

  const esImagen = (extension) => [".jpg", ".jpeg", ".png", ".gif"].includes(extension.toLowerCase());

  if (cargando) {
    return (
      <div className="contenedor-principal-general archivos-cargando">
        <div className="spinner-arquitectonico"></div>
        <p>Cargando repositorio documental...</p>
      </div>
    );
  }

  if (!rolHabilitado) {
    return (
      <div className="contenedor-principal-general" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="tarjeta-general" style={{ textAlign: 'center', padding: '40px', maxWidth: '500px' }}>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>🔒</div>
          <h2 style={{ color: '#FF4B4B', marginBottom: '15px' }}>Apartado No Habilitado</h2>
          <p style={{ color: '#888', marginBottom: '25px', lineHeight: '1.6' }}>Para acceder a este apartado, necesitas mejorar tu suscripción actual.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Link to="/planes" className="botonesComparativa btn-principal" onClick={() => toast.info("Redirigiendo a planes...")}>Mejorar mi Plan🚀</Link>
            <Link to="/principal" className="botonesComparativa btn-volver" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>Volver al Inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  if (errorVista) {
    return (
      <div className="contenedor-principal-general archivos-error-panel">
        <div className="alerta-error-mensaje">
          <h4>{sesionExpirada ? "Autenticación Requerida" : "Fallo de Comunicación"}</h4>
          <p>{errorVista}</p>
          <button className="boton-primario" onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor-principal-general">
      <div className="seccion-encabezado-general">
        <div className="titulo-principal-general">
          <h2 className="h2Archivos">Repositorio de Comprobantes Digitales</h2>
        </div>

        <div className="contenedor-filtros-documental">
          <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
            <option value="">Todos los meses</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>
            ))}
          </select>
          <select value={anioFiltro} onChange={(e) => setAnioFiltro(e.target.value)}>
            {[2024, 2025, 2026].map(anio => <option key={anio} value={anio}>{anio}</option>)}
          </select>
        </div>

        <div className="acciones-cabecera-archivos">
          <button className="boton-primario" onClick={() => abrirModalCarga("ingreso")}>
            + Cargar Nuevo Comprobante
          </button>
        </div>
      </div>

      <div className="contenedor-paneles-dinamicos">
        <div className={`panel-documental-base panel-ingresos-estilo ${panelActivo === "ingreso" ? "panel-estado-maximizando" : ""} ${panelActivo === "gasto" ? "panel-estado-minimizando" : ""}`}>
          <div className="encabezado-tarjeta-modulo" onClick={() => setPanelActivo(panelActivo === "ingreso" ? "ambos" : "ingreso")}>
            <h3>Documentos de Ingresos</h3>
          </div>
          <div className="cuerpo-interno-documental">
            {ingresosFiltrados.length === 0 ? (
              <div className="estado-vacio-documentos"><p>No posee archivos de ingresos cargados en este período.</p></div>
            ) : (
              <div className="grilla-tarjetas-archivos">
                {ingresosFiltrados.map((doc) => (
                  <div key={doc.IdDocumentoIngreso} className="tarjeta-archivo-item">
                    <div className="contenedor-vista-previa">
                      {esImagen(doc.ExtensionArchivo) ? (
                        <img src={`${SERVER_HOST}${doc.RutaArchivo}`} alt={doc.NombreArchivoOriginal} className="imagen-preview-render" />
                      ) : (
                        <div className="icono-documento-generico"><span>{doc.ExtensionArchivo.replace(".", "").toUpperCase()}</span></div>
                      )}
                    </div>
                    <div className="detalles-archivo-item">
                      <h4 title={doc.NombreArchivoOriginal}>{doc.NombreArchivoOriginal}</h4>
                      <p><strong>Fecha:</strong> {new Date(doc.FechaCarga).toLocaleDateString()}</p>
                      <p><strong>Ref:</strong> {doc.IdIngreso ? (historialIngresos.find(h => h.IdIngreso === doc.IdIngreso)?.Descripcion || "No encontrada") : "Sin asignación"}</p>
                    </div>
                    <div className="acciones-archivo-item">
                      <a href={`${SERVER_HOST}${doc.RutaArchivo}`} target="_blank" rel="noopener noreferrer" className="enlace-descarga-archivo-btn">Ver / Descargar</a>
                      <button
                        onClick={() => eliminarDocumento(doc.IdDocumentoIngreso, "ingreso")}
                        className="boton-eliminar-moderno"
                        title="Eliminar comprobante"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icono-eliminar">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`panel-documental-base panel-gastos-estilo ${panelActivo === "gasto" ? "panel-estado-maximizando" : ""} ${panelActivo === "ingreso" ? "panel-estado-minimizando" : ""}`}>
          <div className="encabezado-tarjeta-modulo" onClick={() => setPanelActivo(panelActivo === "gasto" ? "ambos" : "gasto")}>
            <h3>Documentos de Gastos</h3>
          </div>
          <div className="cuerpo-interno-documental">
            {gastosFiltrados.length === 0 ? (
              <div className="estado-vacio-documentos"><p>No posee archivos de gastos cargados en este período.</p></div>
            ) : (
              <div className="grilla-tarjetas-archivos">
                {gastosFiltrados.map((doc) => (
                  <div key={doc.IdDocumentoGasto} className="tarjeta-archivo-item">
                    <div className="contenedor-vista-previa">
                      {esImagen(doc.ExtensionArchivo) ? (
                        <img src={`${SERVER_HOST}${doc.RutaArchivo}`} alt={doc.NombreArchivoOriginal} className="imagen-preview-render" />
                      ) : (
                        <div className="icono-documento-generico"><span>{doc.ExtensionArchivo.replace(".", "").toUpperCase()}</span></div>
                      )}
                    </div>
                    <div className="detalles-archivo-item">
                      <h4 title={doc.NombreArchivoOriginal}>{doc.NombreArchivoOriginal}</h4>
                      <p><strong>Fecha:</strong> {new Date(doc.FechaCarga).toLocaleDateString()}</p>
                      <p><strong>Ref:</strong> {doc.IdGasto ? (historialGastos.find(h => h.IdGasto === doc.IdGasto)?.Descripcion || "No encontrada") : "Sin asignación"}</p>
                    </div>
                    <div className="acciones-archivo-item">
                      <a href={`${SERVER_HOST}${doc.RutaArchivo}`} target="_blank" rel="noopener noreferrer" className="enlace-descarga-archivo-btn">Ver / Descargar</a>
                      <button
                        onClick={() => eliminarDocumento(doc.IdDocumentoGasto, "gasto")}
                        className="boton-eliminar-moderno"
                        title="Eliminar comprobante"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icono-eliminar">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalAbierto && (
        <div className="capa-modal-documentos">
          <div className="contenido-modal-documentos">
            <h3>Cargar Comprobante Financiero</h3>
            <form onSubmit={ejecutarSubidaArchivo}>
              <div className="formulario-grupo">
                <label>Tipo de Comprobante</label>
                <select value={tipoSubida} onChange={(e) => setTipoSubida(e.target.value)}>
                  <option value="ingreso">Asociar a un Flujo de Ingreso</option>
                  <option value="gasto">Asociar a un Flujo de Gasto</option>
                </select>
              </div>
              <div className="formulario-grupo">
                <label>Seleccionar Transacción</label>
                <select value={idTransaccion} onChange={(e) => setIdTransaccion(e.target.value)} required>
                  <option value="">
                    {cargandoTransacciones
                      ? "Cargando transacciones..."
                      : "-- Seleccione --"}
                  </option>
                  {(tipoSubida === "ingreso" ? historialIngresos : historialGastos).map((item) => {
                    const id = tipoSubida === "ingreso" ? item.IdIngreso : item.IdGasto;
                    const monto = tipoSubida === "ingreso" ? item.MontoIngreso : item.MontoGasto;
                    const fecha = tipoSubida === "ingreso" ? item.FechaIngreso : item.FechaGasto;
                    const fechaTexto = fecha ? new Date(fecha).toLocaleDateString("es-AR") : "Sin fecha";
                    return <option key={id} value={id}>{item.Descripcion || "Sin descripción"} - ${monto} - {fechaTexto}</option>;
                  })}
                  {!cargandoTransacciones && (tipoSubida === "ingreso" ? historialIngresos : historialGastos).length === 0 && (
                    <option value="" disabled>
                      No hay {tipoSubida === "ingreso" ? "ingresos" : "gastos"} actuales para asociar
                    </option>
                  )}
                </select>
              </div>
              <div className="formulario-grupo">
                <label>Archivo</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.gif" onChange={(e) => setArchivoSeleccionado(e.target.files[0])} required />
              </div>
              <div className="formulario-acciones">
                <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button type="submit" className="boton-primario" disabled={subiendo || !idTransaccion}>
                  {subiendo ? "Subiendo..." : "Subir"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Archivos;

