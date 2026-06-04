import { useEffect, useState } from "react";
import "../Admin.css";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { getAuth } from "firebase/auth";
import app from "../firebase/config";

const db = getFirestore(app);

function Admin() {
  const [denuncias, setDenuncias] = useState([]);
  const [adopciones, setAdopciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);

  const [tabActiva, setTabActiva] = useState("denuncias");
  const [busqueda, setBusqueda] = useState("");

  const [mostrarModalFecha, setMostrarModalFecha] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");

  const [modalEdicion, setModalEdicion] = useState({
    visible: false,
    tipo: null,
    data: null,
  });
  const [editForm, setEditForm] = useState({});

  // Sistema de toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const auth = getAuth();
  const usuario = auth.currentUser;

  const crearNotificacion = async (userId, titulo, mensaje, tipo) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, "notificaciones"), {
        userId,
        titulo,
        mensaje,
        tipo,
        leida: false,
        fecha: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error al crear notificación:", error);
    }
  };

  const obtenerDatos = async () => {
    const denunciasSnapshot = await getDocs(collection(db, "denuncias"));
    const adopcionesSnapshot = await getDocs(collection(db, "adopciones"));
    const usuariosSnapshot = await getDocs(collection(db, "users"));
    const solicitudesSnapshot = await getDocs(collection(db, "solicitudesAdopcion"));

    setDenuncias(denunciasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setAdopciones(adopcionesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setUsuarios(
      usuariosSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => u.email !== "admin.natufauna@gmail.com")
    );
    setSolicitudes(solicitudesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const cambiarEstadoDenuncia = async (id, nuevoEstado, denuncia) => {
    try {
      await updateDoc(doc(db, "denuncias", id), { estado: nuevoEstado });
      if (nuevoEstado === "Validada" || nuevoEstado === "Escalada") {
        const infractor = denuncia.presuntoInfractor;
        if (infractor?.documento && infractor.documento.trim() !== "") {
          const q = query(collection(db, "registroInfractores"), where("documento", "==", infractor.documento));
          const resultado = await getDocs(q);
          const riesgo = nuevoEstado === "Escalada" ? "Alto" : "Medio";
          if (resultado.empty) {
            await addDoc(collection(db, "registroInfractores"), {
              nombre: infractor.nombre || "",
              documento: infractor.documento || "",
              ciudad: infractor.ciudad || "",
              tipoMaltrato: denuncia.tipoMaltrato || "",
              descripcion: denuncia.descripcion || "",
              denuncias: 1,
              ultimoCaso: denuncia.fechaCaso || "",
              estado: nuevoEstado,
              nivelRiesgo: riesgo,
            });
          } else {
            const docExistente = resultado.docs[0];
            const data = docExistente.data();
            await updateDoc(doc(db, "registroInfractores", docExistente.id), {
              nombre: infractor.nombre || data.nombre,
              ciudad: infractor.ciudad || data.ciudad,
              tipoMaltrato: denuncia.tipoMaltrato || data.tipoMaltrato,
              descripcion: denuncia.descripcion || data.descripcion,
              denuncias: (data.denuncias || 1) + 1,
              ultimoCaso: denuncia.fechaCaso || data.ultimoCaso,
              estado: nuevoEstado,
              nivelRiesgo: riesgo,
            });
          }
        }
      }
      obtenerDatos();
      addToast(`Denuncia ${nuevoEstado} correctamente`, "success");
    } catch (error) {
      addToast("Error al cambiar estado de la denuncia", "error");
    }
  };

  const cambiarEstadoAdopcion = async (id, nuevoEstado) => {
    try {
      await updateDoc(doc(db, "adopciones", id), { estadoPublicacion: nuevoEstado });
      obtenerDatos();
      addToast(`Publicación ${nuevoEstado} correctamente`, "success");
    } catch (error) {
      addToast("Error al cambiar estado de la publicación", "error");
    }
  };

  const aprobarSolicitud = async (id, solicitanteId, animalNombre) => {
    try {
      await updateDoc(doc(db, "solicitudesAdopcion", id), { estado: "Aprobada" });
      await crearNotificacion(
        solicitanteId,
        "✅ Solicitud aprobada",
        `Tu solicitud para adoptar a ${animalNombre || "una mascota"} ha sido aprobada.`,
        "aprobacion"
      );
      obtenerDatos();
      addToast("Solicitud aprobada correctamente", "success");
    } catch (error) {
      addToast("Error al aprobar la solicitud", "error");
    }
  };

  const rechazarSolicitud = async (id, solicitanteId, animalNombre) => {
    try {
      await updateDoc(doc(db, "solicitudesAdopcion", id), { estado: "Rechazada" });
      await crearNotificacion(
        solicitanteId,
        "❌ Solicitud rechazada",
        `Tu solicitud para adoptar a ${animalNombre || "una mascota"} ha sido rechazada.`,
        "rechazo"
      );
      obtenerDatos();
      addToast("Solicitud rechazada", "warning");
    } catch (error) {
      addToast("Error al rechazar la solicitud", "error");
    }
  };

  const abrirModalFecha = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setFechaSeleccionada("");
    setMostrarModalFecha(true);
  };

  const guardarEncuentro = async () => {
    if (!fechaSeleccionada) {
      addToast("Por favor selecciona una fecha y hora", "warning");
      return;
    }
    try {
      await updateDoc(doc(db, "solicitudesAdopcion", solicitudSeleccionada.id), {
        estado: "Encuentro programado",
        fechaEncuentro: fechaSeleccionada,
      });
      await crearNotificacion(
        solicitudSeleccionada.solicitanteId,
        "📅 Encuentro programado",
        `Encuentro presencial para adopción el ${new Date(fechaSeleccionada).toLocaleString()}.`,
        "encuentro"
      );
      setMostrarModalFecha(false);
      setSolicitudSeleccionada(null);
      setFechaSeleccionada("");
      obtenerDatos();
      addToast("Encuentro programado correctamente", "success");
    } catch (error) {
      addToast("Error al programar el encuentro", "error");
    }
  };

  const abrirEdicion = (tipo, data) => {
    setEditForm(JSON.parse(JSON.stringify(data)));
    setModalEdicion({ visible: true, tipo, data });
  };

  const guardarEdicion = async () => {
    const { tipo, data } = modalEdicion;
    if (!data || !data.id) {
      addToast("Error: no se encontró el ID del documento", "error");
      return;
    }
    try {
      let updateData = {};
      switch (tipo) {
        case "denuncia":
          if (editForm.tipoAnimal !== undefined) updateData.tipoAnimal = editForm.tipoAnimal;
          if (editForm.tipoMaltrato !== undefined) updateData.tipoMaltrato = editForm.tipoMaltrato;
          if (editForm.descripcion !== undefined) updateData.descripcion = editForm.descripcion;
          if (editForm.fechaCaso !== undefined) updateData.fechaCaso = editForm.fechaCaso;
          if (editForm.direccion !== undefined) updateData.direccion = editForm.direccion;
          if (editForm.ubicacion !== undefined) updateData.ubicacion = editForm.ubicacion;
          if (editForm.evidencias !== undefined) updateData.evidencias = editForm.evidencias;
          if (editForm.presuntoInfractor !== undefined) updateData.presuntoInfractor = editForm.presuntoInfractor;
          if (editForm.denuncianteNombre !== undefined) updateData.denuncianteNombre = editForm.denuncianteNombre;
          if (editForm.denuncianteEmail !== undefined) updateData.denuncianteEmail = editForm.denuncianteEmail;
          if (editForm.denuncianteTelefono !== undefined) updateData.denuncianteTelefono = editForm.denuncianteTelefono;
          if (editForm.esEquino !== undefined) updateData.esEquino = editForm.esEquino;
          if (editForm.datosEquino !== undefined) updateData.datosEquino = editForm.datosEquino;
          break;
        case "adopcion":
          if (editForm.nombreAnimal !== undefined) updateData.nombreAnimal = editForm.nombreAnimal;
          if (editForm.especie !== undefined) updateData.especie = editForm.especie;
          if (editForm.edad !== undefined) updateData.edad = editForm.edad;
          if (editForm.ciudad !== undefined) updateData.ciudad = editForm.ciudad;
          if (editForm.descripcion !== undefined) updateData.descripcion = editForm.descripcion;
          if (editForm.fotos !== undefined) updateData.fotos = editForm.fotos;
          if (editForm.vacunado !== undefined) updateData.vacunado = editForm.vacunado;
          if (editForm.esterilizado !== undefined) updateData.esterilizado = editForm.esterilizado;
          if (editForm.socializado !== undefined) updateData.socializado = editForm.socializado;
          if (editForm.estadoPublicacion !== undefined) updateData.estadoPublicacion = editForm.estadoPublicacion;
          break;
        case "usuario":
          if (editForm.nombre !== undefined) updateData.nombre = editForm.nombre;
          if (editForm.email !== undefined) updateData.email = editForm.email;
          if (editForm.documento !== undefined) updateData.documento = editForm.documento;
          if (editForm.telefono !== undefined) updateData.telefono = editForm.telefono;
          if (editForm.fechaNacimiento !== undefined) updateData.fechaNacimiento = editForm.fechaNacimiento;
          if (editForm.ciudad !== undefined) updateData.ciudad = editForm.ciudad;
          break;
        case "solicitud":
          if (editForm.nombre !== undefined) updateData.nombre = editForm.nombre;
          if (editForm.telefono !== undefined) updateData.telefono = editForm.telefono;
          if (editForm.ciudad !== undefined) updateData.ciudad = editForm.ciudad;
          if (editForm.direccion !== undefined) updateData.direccion = editForm.direccion;
          if (editForm.tipoVivienda !== undefined) updateData.tipoVivienda = editForm.tipoVivienda;
          if (editForm.tienePatio !== undefined) updateData.tienePatio = editForm.tienePatio;
          if (editForm.viveConFamilia !== undefined) updateData.viveConFamilia = editForm.viveConFamilia;
          if (editForm.tieneMascotas !== undefined) updateData.tieneMascotas = editForm.tieneMascotas;
          if (editForm.experiencia !== undefined) updateData.experiencia = editForm.experiencia;
          if (editForm.motivo !== undefined) updateData.motivo = editForm.motivo;
          break;
        default:
          break;
      }
      if (Object.keys(updateData).length === 0) {
        addToast("No hay cambios para guardar", "warning");
        return;
      }
      let coleccion = "";
      if (tipo === "denuncia") coleccion = "denuncias";
      else if (tipo === "adopcion") coleccion = "adopciones";
      else if (tipo === "usuario") coleccion = "users";
      else if (tipo === "solicitud") coleccion = "solicitudesAdopcion";
      await updateDoc(doc(db, coleccion, data.id), updateData);
      await obtenerDatos();
      setModalEdicion({ visible: false, tipo: null, data: null });
      addToast("Guardado correctamente", "success");
    } catch (error) {
      console.error("Error al guardar:", error);
      addToast(`Error: ${error.message}`, "error");
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  if (!usuario || usuario.email !== "admin.natufauna@gmail.com") {
    return <h1 style={{ textAlign: "center", marginTop: "50px", color: "red" }}>Acceso denegado</h1>;
  }

  // Filtros
  const denunciasFiltradas = denuncias.filter((d) => {
    const texto = busqueda.toLowerCase();
    return (
      d.tipoAnimal?.toLowerCase().includes(texto) ||
      d.tipoMaltrato?.toLowerCase().includes(texto) ||
      d.estado?.toLowerCase().includes(texto) ||
      d.presuntoInfractor?.nombre?.toLowerCase().includes(texto) ||
      d.presuntoInfractor?.documento?.toLowerCase().includes(texto)
    );
  });

  const adopcionesFiltradas = adopciones.filter((a) => {
    const texto = busqueda.toLowerCase();
    return (
      a.nombreAnimal?.toLowerCase().includes(texto) ||
      a.especie?.toLowerCase().includes(texto) ||
      a.ciudad?.toLowerCase().includes(texto)
    );
  });

  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = busqueda.toLowerCase();
    return (
      u.email !== "admin.natufauna@gmail.com" &&
      (u.nombre?.toLowerCase().includes(texto) ||
        u.email?.toLowerCase().includes(texto) ||
        u.fechaNacimiento?.toLowerCase().includes(texto))
    );
  });

  const solicitudesFiltradas = solicitudes.filter((s) => {
    const texto = busqueda.toLowerCase();
    return (
      s.nombre?.toLowerCase().includes(texto) ||
      s.nombreAnimal?.toLowerCase().includes(texto) ||
      s.ciudad?.toLowerCase().includes(texto) ||
      s.estado?.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="admin-dashboard">
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      {/* MODAL DE EDICIÓN (completo) */}
      {modalEdicion.visible && (
        <div className="modal-overlay" onClick={() => setModalEdicion({ visible: false, tipo: null, data: null })}>
          <div className="modal-content modal-profesional" onClick={(e) => e.stopPropagation()}>
            <button className="modal-cerrar" onClick={() => setModalEdicion({ visible: false, tipo: null, data: null })}>✖</button>
            <div className="modal-header">
              <span className="modal-icon">
                {modalEdicion.tipo === "denuncia" && "⚖️"}
                {modalEdicion.tipo === "adopcion" && "🐕"}
                {modalEdicion.tipo === "usuario" && "👤"}
                {modalEdicion.tipo === "solicitud" && "📋"}
              </span>
              <h2>
                {modalEdicion.tipo === "denuncia" && "Editar denuncia"}
                {modalEdicion.tipo === "adopcion" && "Editar publicación"}
                {modalEdicion.tipo === "usuario" && "Editar usuario"}
                {modalEdicion.tipo === "solicitud" && "Editar solicitud"}
              </h2>
            </div>
            <div className="modal-body">
              {/* DENUNCIA */}
              {modalEdicion.tipo === "denuncia" && (
                <>
                  <div className="detalle-seccion">
                    <h3><span>🐾</span> Animal</h3>
                    <div className="detalle-grid">
                      <div><strong>Tipo:</strong> <input value={editForm.tipoAnimal || ""} onChange={(e) => setEditForm({ ...editForm, tipoAnimal: e.target.value })} /></div>
                      <div><strong>Raza/color:</strong> <input value={editForm.raza || ""} onChange={(e) => setEditForm({ ...editForm, raza: e.target.value })} /></div>
                    </div>
                  </div>
                  <div className="detalle-seccion">
                    <h3><span>⚠️</span> Maltrato</h3>
                    <div className="detalle-grid">
                      <div><strong>Tipo:</strong> <input value={editForm.tipoMaltrato || ""} onChange={(e) => setEditForm({ ...editForm, tipoMaltrato: e.target.value })} /></div>
                      <div style={{ gridColumn: "span 2" }}><strong>Descripción:</strong> <textarea rows={3} value={editForm.descripcion || ""} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} /></div>
                      <div><strong>Fecha del caso:</strong> <input type="date" value={editForm.fechaCaso || ""} onChange={(e) => setEditForm({ ...editForm, fechaCaso: e.target.value })} /></div>
                      <div><strong>Ubicación:</strong> <input value={editForm.ubicacion || ""} onChange={(e) => setEditForm({ ...editForm, ubicacion: e.target.value })} /></div>
                    </div>
                  </div>
                  <div className="detalle-seccion">
                    <h3><span>👤</span> Presunto infractor</h3>
                    <div className="detalle-grid">
                      {["nombre", "documento", "ciudad", "telefono", "correo"].map((campo) => (
                        <div key={campo}>
                          <strong>{campo.charAt(0).toUpperCase() + campo.slice(1)}:</strong>
                          <input value={editForm.presuntoInfractor?.[campo] || ""} onChange={(e) => setEditForm({ ...editForm, presuntoInfractor: { ...editForm.presuntoInfractor, [campo]: e.target.value } })} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="detalle-seccion">
                    <h3><span>👮</span> Denunciante</h3>
                    <div className="detalle-grid">
                      {["denuncianteNombre", "denuncianteEmail", "denuncianteTelefono"].map((campo) => (
                        <div key={campo}>
                          <strong>{campo.replace("denunciante", "")}:</strong>
                          <input value={editForm[campo] || ""} onChange={(e) => setEditForm({ ...editForm, [campo]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>
                  {editForm.evidencias?.length > 0 && (
                    <div className="detalle-seccion">
                      <h3><span>📎</span> Evidencias</h3>
                      <div className="evidencias-lista">
                        {editForm.evidencias.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noreferrer">Ver evidencia {idx + 1}</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {editForm.esEquino && (
                    <div className="detalle-seccion">
                      <h3><span>🐴</span> Datos equino / zorrero</h3>
                      <div className="detalle-grid">
                        <div><strong>Vehículo:</strong> <input value={editForm.datosEquino?.descripcionVehiculo || ""} onChange={(e) => setEditForm({ ...editForm, datosEquino: { ...editForm.datosEquino, descripcionVehiculo: e.target.value } })} /></div>
                        <div><strong>Zona habitual:</strong> <input value={editForm.datosEquino?.zonaHabitual || ""} onChange={(e) => setEditForm({ ...editForm, datosEquino: { ...editForm.datosEquino, zonaHabitual: e.target.value } })} /></div>
                        <div><strong>Condición animal:</strong> <textarea rows={2} value={editForm.datosEquino?.condicionAnimal || ""} onChange={(e) => setEditForm({ ...editForm, datosEquino: { ...editForm.datosEquino, condicionAnimal: e.target.value } })} /></div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ADOPCIÓN */}
              {modalEdicion.tipo === "adopcion" && (
                <>
                  {editForm.fotos?.length > 0 && (
                    <div className="detalle-foto-principal">
                      <img src={editForm.fotos[0]} alt="principal" style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
                    </div>
                  )}
                  <div className="detalle-seccion">
                    <h3>Información básica</h3>
                    <div className="detalle-grid">
                      <div><strong>Nombre:</strong> <input value={editForm.nombreAnimal || ""} onChange={(e) => setEditForm({ ...editForm, nombreAnimal: e.target.value })} /></div>
                      <div><strong>Especie:</strong> <input value={editForm.especie || ""} onChange={(e) => setEditForm({ ...editForm, especie: e.target.value })} /></div>
                      <div><strong>Edad:</strong> <input value={editForm.edad || ""} onChange={(e) => setEditForm({ ...editForm, edad: e.target.value })} /></div>
                      <div><strong>Ciudad:</strong> <input value={editForm.ciudad || ""} onChange={(e) => setEditForm({ ...editForm, ciudad: e.target.value })} /></div>
                      <div><strong>Estado publicación:</strong>
                        <select value={editForm.estadoPublicacion || ""} onChange={(e) => setEditForm({ ...editForm, estadoPublicacion: e.target.value })}>
                          <option value="Aprobada">Aprobada</option>
                          <option value="Rechazada">Rechazada</option>
                          <option value="Pendiente">Pendiente</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="detalle-seccion">
                    <h3>Descripción</h3>
                    <textarea rows={3} value={editForm.descripcion || ""} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} />
                  </div>
                  <div className="detalle-seccion">
                    <h3>Características</h3>
                    <label><input type="checkbox" checked={editForm.vacunado || false} onChange={(e) => setEditForm({ ...editForm, vacunado: e.target.checked })} /> Vacunado</label>
                    <label><input type="checkbox" checked={editForm.esterilizado || false} onChange={(e) => setEditForm({ ...editForm, esterilizado: e.target.checked })} /> Esterilizado</label>
                    <label><input type="checkbox" checked={editForm.socializado || false} onChange={(e) => setEditForm({ ...editForm, socializado: e.target.checked })} /> Socializado</label>
                  </div>
                </>
              )}

              {/* USUARIO */}
              {modalEdicion.tipo === "usuario" && (
                <div className="detalle-grid">
                  <div><strong>Nombre:</strong> <input value={editForm.nombre || ""} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} /></div>
                  <div><strong>Email:</strong> <input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                  <div><strong>Documento:</strong> <input value={editForm.documento || ""} onChange={(e) => setEditForm({ ...editForm, documento: e.target.value })} /></div>
                  <div><strong>Teléfono:</strong> <input value={editForm.telefono || ""} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} /></div>
                  <div><strong>Fecha nacimiento:</strong> <input type="date" value={editForm.fechaNacimiento || ""} onChange={(e) => setEditForm({ ...editForm, fechaNacimiento: e.target.value })} /></div>
                  <div><strong>Ciudad:</strong> <input value={editForm.ciudad || ""} onChange={(e) => setEditForm({ ...editForm, ciudad: e.target.value })} /></div>
                </div>
              )}

              {/* SOLICITUD */}
              {modalEdicion.tipo === "solicitud" && (
                <div className="detalle-grid">
                  <div><strong>Animal:</strong> {modalEdicion.data.nombreAnimal || "No especificado"}</div>
                  <div><strong>Solicitante:</strong> <input value={editForm.nombre || ""} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} /></div>
                  <div><strong>Teléfono:</strong> <input value={editForm.telefono || ""} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} /></div>
                  <div><strong>Ciudad:</strong> <input value={editForm.ciudad || ""} onChange={(e) => setEditForm({ ...editForm, ciudad: e.target.value })} /></div>
                  <div><strong>Dirección:</strong> <input value={editForm.direccion || ""} onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })} /></div>
                  <div><strong>Tipo vivienda:</strong> <input value={editForm.tipoVivienda || ""} onChange={(e) => setEditForm({ ...editForm, tipoVivienda: e.target.value })} /></div>
                  <div><strong>Patio:</strong> <input type="checkbox" checked={editForm.tienePatio || false} onChange={(e) => setEditForm({ ...editForm, tienePatio: e.target.checked })} /></div>
                  <div><strong>Vive con familia:</strong> <input type="checkbox" checked={editForm.viveConFamilia || false} onChange={(e) => setEditForm({ ...editForm, viveConFamilia: e.target.checked })} /></div>
                  <div><strong>Otras mascotas:</strong> <input type="checkbox" checked={editForm.tieneMascotas || false} onChange={(e) => setEditForm({ ...editForm, tieneMascotas: e.target.checked })} /></div>
                  <div><strong>Experiencia:</strong> <textarea rows={2} value={editForm.experiencia || ""} onChange={(e) => setEditForm({ ...editForm, experiencia: e.target.value })} /></div>
                  <div><strong>Motivo:</strong> <textarea rows={2} value={editForm.motivo || ""} onChange={(e) => setEditForm({ ...editForm, motivo: e.target.value })} /></div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-guardar-modal" onClick={guardarEdicion}>Guardar cambios</button>
              <button className="btn-cancelar-modal" onClick={() => setModalEdicion({ visible: false, tipo: null, data: null })}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGENDAR ENCUENTRO */}
      {mostrarModalFecha && (
        <div className="modal-overlay" onClick={() => setMostrarModalFecha(false)}>
          <div className="modal-content modal-agendar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">📅</span>
              <h2>Agendar encuentro presencial</h2>
            </div>
            <div className="modal-body">
              <div className="detalle-seccion">
                <h3><span>🐾</span> Solicitud de adopción</h3>
                <div className="detalle-grid">
                  <div><strong>Solicitante:</strong> {solicitudSeleccionada?.nombre || solicitudSeleccionada?.solicitanteEmail}</div>
                  <div><strong>Animal:</strong> {solicitudSeleccionada?.nombreAnimal || "No especificado"}</div>
                  <div><strong>Teléfono:</strong> {solicitudSeleccionada?.telefono || "—"}</div>
                  <div><strong>Ciudad:</strong> {solicitudSeleccionada?.ciudad || "—"}</div>
                </div>
              </div>
              <div className="detalle-seccion">
                <h3><span>⏰</span> Selecciona fecha y hora</h3>
                <div className="campo-fecha">
                  <input
                    type="datetime-local"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="input-datetime"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar-modal" onClick={() => setMostrarModalFecha(false)}>Cancelar</button>
              <button className="btn-guardar-modal" onClick={guardarEncuentro}>Confirmar encuentro</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER Y STATS */}
      <div className="admin-top">
        <div>
          <h1>🛡️ Panel Administrativo</h1>
          <p>Gestión de denuncias, adopciones, usuarios y solicitudes de adopción</p>
        </div>
        <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="admin-search" />
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card"><h2>{denuncias.length}</h2><p>Denuncias</p></div>
        <div className="admin-stat-card"><h2>{adopciones.length}</h2><p>Adopciones</p></div>
        <div className="admin-stat-card"><h2>{usuarios.length}</h2><p>Usuarios</p></div>
        <div className="admin-stat-card"><h2>{solicitudes.length}</h2><p>Solicitudes</p></div>
      </div>

      <div className="admin-tabs">
        <button className={tabActiva === "denuncias" ? "active-tab" : ""} onClick={() => setTabActiva("denuncias")}>📋 Denuncias</button>
        <button className={tabActiva === "adopciones" ? "active-tab" : ""} onClick={() => setTabActiva("adopciones")}>🐾 Adopciones</button>
        <button className={tabActiva === "usuarios" ? "active-tab" : ""} onClick={() => setTabActiva("usuarios")}>👥 Usuarios</button>
        <button className={tabActiva === "solicitudes" ? "active-tab" : ""} onClick={() => setTabActiva("solicitudes")}>📝 Solicitudes</button>
      </div>

      {/* TABLA DENUNCIAS */}
      {tabActiva === "denuncias" && (
        <div className="admin-table-card">
          <h2>📋 Denuncias Registradas</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Animal</th><th>Maltrato</th><th>Infractor</th><th>Documento</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {denunciasFiltradas.map((d) => (
                <tr key={d.id}>
                  <td>{d.tipoAnimal}</td>
                  <td>{d.tipoMaltrato}</td>
                  <td>{d.presuntoInfractor?.nombre || "No registrado"}</td>
                  <td>{d.presuntoInfractor?.documento || "No registrado"}</td>
                  <td>{d.estado}</td>
                  <td className="acciones-botones">
                    <button className="btn-editar" onClick={() => abrirEdicion("denuncia", d)}>Editar</button>
                    <button className="btn-revisar" onClick={() => cambiarEstadoDenuncia(d.id, "En revisión", d)}>Revisar</button>
                    <button className="btn-validar" onClick={() => cambiarEstadoDenuncia(d.id, "Validada", d)}>Validar</button>
                    <button className="btn-escalar" onClick={() => cambiarEstadoDenuncia(d.id, "Escalada", d)}>Escalar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLA ADOPCIONES */}
      {tabActiva === "adopciones" && (
        <div className="admin-table-card">
          <h2>🐾 Publicaciones de Adopción</h2>
          <table className="admin-table">
            <thead>
              <tr><th>Foto</th><th>Animal</th><th>Ciudad</th><th>Publicación</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {adopcionesFiltradas.map((a) => (
                <tr key={a.id}>
                  <td className="td-foto">
                    {a.fotos?.length > 0 ? (
                      <img src={a.fotos[0]} className="admin-thumb" alt="" />
                    ) : "Sin foto"}
                  </td>
                  <td>{a.nombreAnimal}</td>
                  <td>{a.ciudad}</td>
                  <td>
                    <span className={`estado-badge ${a.estadoPublicacion === "Aprobada" ? "estado-aprobada" : a.estadoPublicacion === "Rechazada" ? "estado-rechazada" : "estado-pendiente"}`}>
                      {a.estadoPublicacion}
                    </span>
                  </td>
                  <td className="acciones-botones">
                    <button className="btn-editar" onClick={() => abrirEdicion("adopcion", a)}>Editar</button>
                    <button className="btn-aprobar" onClick={() => cambiarEstadoAdopcion(a.id, "Aprobada")}>Aprobar</button>
                    <button className="btn-rechazar" onClick={() => cambiarEstadoAdopcion(a.id, "Rechazada")}>Rechazar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLA USUARIOS */}
      {tabActiva === "usuarios" && (
        <div className="admin-table-card">
          <h2>👥 Usuarios Registrados</h2>
          <table className="admin-table">
            <thead><tr><th>Nombre</th><th>Email</th><th>Documento</th><th>Acciones</th></tr></thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre || "Sin nombre"}</td>
                  <td>{u.email}</td>
                  <td>{u.documento}</td>
                  <td className="acciones-botones"><button className="btn-editar" onClick={() => abrirEdicion("usuario", u)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLA SOLICITUDES - FECHA EN COLUMNA SEPARADA */}
      {tabActiva === "solicitudes" && (
        <div className="admin-table-card">
          <h2>📋 Solicitudes de Adopción</h2>
          <table className="admin-table solicitudes-tabla">
            <thead>
              <tr>
                <th>Animal</th>
                <th>Solicitante</th>
                <th>Teléfono</th>
                <th>Ciudad</th>
                <th>Estado</th>
                <th>Fecha encuentro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map((s) => {
                let estadoClase = "";
                if (s.estado === "Aprobada") estadoClase = "estado-aprobada";
                else if (s.estado === "Rechazada") estadoClase = "estado-rechazada";
                else if (s.estado === "Pendiente") estadoClase = "estado-pendiente";
                else if (s.estado === "Encuentro programado") estadoClase = "estado-encuentro";
                else if (s.estado === "Cancelada") estadoClase = "estado-cancelada";

                return (
                  <tr key={s.id}>
                    <td><strong>{s.nombreAnimal || "No especificado"}</strong></td>
                    <td>{s.nombre || s.solicitanteEmail || "Anónimo"}</td>
                    <td>{s.telefono || "—"}</td>
                    <td>{s.ciudad || "—"}</td>
                    <td>
                      <span className={`estado-badge ${estadoClase}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td>
                      {s.fechaEncuentro
                        ? new Date(s.fechaEncuentro).toLocaleString()
                        : "—"}
                    </td>
                    <td className="acciones-botones">
                      <button className="btn-editar" onClick={() => abrirEdicion("solicitud", s)}>Editar</button>
                      <button className="btn-aprobar" onClick={() => aprobarSolicitud(s.id, s.solicitanteId, s.nombreAnimal)}>Aprobar</button>
                      <button className="btn-rechazar" onClick={() => rechazarSolicitud(s.id, s.solicitanteId, s.nombreAnimal)}>Rechazar</button>
                      <button className="btn-agendar" onClick={() => abrirModalFecha(s)}>Agendar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Admin;