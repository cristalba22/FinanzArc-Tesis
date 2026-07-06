import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Perfil.css';

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Perfil() {
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
    const SERVER_HOST = import.meta.env.VITE_SERVER_BASE_URL || "";

    const [userData, setUserData] = useState({});
    const [fotoPerfil, setFotoPerfil] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const nombreLocal = localStorage.getItem("Nombre") || "";
    const apellidoLocal = localStorage.getItem("Apellido") || "";

    const primerletranombre = nombreLocal.charAt(0).toUpperCase();
    const primerletraapellido = apellidoLocal.charAt(0).toUpperCase();

    useEffect(() => {
        if (localStorage.getItem("FotoPerfil")) {
            localStorage.removeItem("FotoPerfil");
        }

        obtenerDatos();
        obtenerFotoActual();
    }, []);

    const obtenerDatos = () => {
        const token = localStorage.getItem("Token");

        if (!token) return;

        fetch(`${API_BASE_URL}/Usuarios/ByToken`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Error al validar sesión");
                }

                return response.json();
            })
            .then((data) => {
                setUserData(data);

                localStorage.setItem("Nombre", data.Nombre);
                localStorage.setItem("Apellido", data.Apellido);
            })
            .catch((error) => {
                console.error("Error identificando usuario:", error);

                toast.error(
                    "No se pudieron cargar los datos del usuario"
                );
            });
    };

    const obtenerFotoActual = () => {
        const token = localStorage.getItem("Token");

        if (!token) return;

        fetch(`${API_BASE_URL}/FotoPerfil/MiFoto`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data && data.ruta) {
                    setFotoPerfil(
                        `${SERVER_HOST}${data.ruta}?v=${new Date().getTime()}`
                    );
                }
            })
            .catch((err) => {
                console.error(
                    "Error al obtener la foto de perfil",
                    err
                );

                toast.error(
                    "No se pudo cargar la foto de perfil"
                );
            });
    };

    const obtenerNombrePlan = (rol) => {
        switch (rol) {
            case 1:
                return "Plan Esencial";

            case 2:
                return "Plan Gold";

            case 3:
                return "Plan Platino";

            case 4:
                return "Plan Developer";

            default:
                return "Cargando plan...";
        }
    };

    const cerrarSesion = () => {
        localStorage.clear();

        navigate("/");

        window.location.reload();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        const validTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (!validTypes.includes(file.type)) {
            toast.error(
                "Formato no permitido. Solo JPG, JPEG, PNG y WEBP."
            );

            e.target.value = null;

            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.warning(
                "La imagen supera el tamaño máximo permitido de 5 MB."
            );

            e.target.value = null;

            return;
        }

        setIsUploading(true);

        const previewUrl = URL.createObjectURL(file);

        setFotoPerfil(previewUrl);

        const token = localStorage.getItem("Token");

        const formData = new FormData();

        formData.append("fotoPerfil", file);

        try {
            const response = await fetch(
                `${API_BASE_URL}/FotoPerfil/Upload`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                setFotoPerfil(
                    `${SERVER_HOST}${data.ruta}?v=${new Date().getTime()}`
                );

                toast.success(
                    "Foto de perfil actualizada correctamente"
                );
            } else {
                toast.error(
                    `Error al subir la imagen: ${
                        data.message || "Error desconocido"
                    }`
                );

                obtenerFotoActual();
            }
        } catch (error) {
            console.error(
                "Error en la subida:",
                error
            );

            toast.error(
                "Ocurrió un error de conexión al subir la imagen."
            );

            obtenerFotoActual();
        } finally {
            setIsUploading(false);

            e.target.value = null;
        }
    };

    return (
        <>
            <div className="perfil-pagina-contenedor-general">
                <div className="perfil-pagina-contenedor">
                    <div className="perfil-tarjeta-premium">

                        <div className="perfil-header">

                            <div className="perfil-avatar">

                                {fotoPerfil ? (
                                    <img
                                        src={fotoPerfil}
                                        alt="Perfil"
                                        className={`avatar-imagen-cargada ${
                                            isUploading
                                                ? "imagen-opaca"
                                                : ""
                                        }`}
                                        style={{
                                            opacity:
                                                isUploading ? 0.5 : 1,
                                            transition: "0.3s"
                                        }}
                                    />
                                ) : (
                                    <>
                                        <span className="avatar-inicial">
                                            {userData.Nombre
                                                ? userData.Nombre
                                                      .charAt(0)
                                                      .toUpperCase()
                                                : primerletranombre}
                                        </span>

                                        <span className="avatar-inicial">
                                            {userData.Apellido
                                                ? userData.Apellido
                                                      .charAt(0)
                                                      .toUpperCase()
                                                : primerletraapellido}
                                        </span>
                                    </>
                                )}

                                {isUploading && (
                                    <div
                                        className="spinner-subiendo"
                                        style={{
                                            position: "absolute",
                                            color: "white",
                                            fontWeight: "bold",
                                            textShadow:
                                                "1px 1px 2px black"
                                        }}
                                    >
                                        Subiendo...
                                    </div>
                                )}

                                <label className="capa-subir-foto">
                                    <span>
                                        {isUploading
                                            ? "⌛"
                                            : "✎"}
                                    </span>

                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={handleImageChange}
                                        style={{
                                            display: "none"
                                        }}
                                        disabled={isUploading}
                                    />
                                </label>

                            </div>

                            <h1 className="perfil-nombre">
                                {userData.Nombre || nombreLocal}
                                {" "}
                                {userData.Apellido || apellidoLocal}
                            </h1>

                            <p className="perfil-email-header">
                                {userData.Email || "Cargando..."}
                            </p>

                        </div>

                        <div className="perfil-info-lista">

                            <div className="info-item">
                                <label>Nombre</label>
                                <span>{userData.Nombre}</span>
                            </div>

                            <div className="info-item">
                                <label>Apellido</label>
                                <span>{userData.Apellido}</span>
                            </div>

                            <div className="info-item">
                                <label>Teléfono</label>
                                <span>{userData.Telefono}</span>
                            </div>

                            <div className="info-item">
                                <label>Nombre de Usuario</label>
                                <span>{userData.NombreUsuario}</span>
                            </div>

                            <div className="info-item item-destacado">
                                <label>Plan actual</label>

                                <span className="badge-dorado">
                                    {obtenerNombrePlan(
                                        userData.IdRol
                                    )}
                                </span>
                            </div>

                        </div>

                        <div className="perfil-acciones">

                            <button
                                className="btn boton-ver-planes"
                                onClick={() =>
                                    navigate("/planes")
                                }
                                disabled={isUploading}
                            >
                                Mejorar Plan
                            </button>

                            <button
                                className="btn BotonLogout"
                                onClick={cerrarSesion}
                                disabled={isUploading}
                            >
                                Cerrar Sesión
                            </button>

                        </div>

                    </div>
                </div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
                theme="light"
            />
        </>
    );
}

export default Perfil;
