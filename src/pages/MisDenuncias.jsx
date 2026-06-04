import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

import { getAuth, onAuthStateChanged } from "firebase/auth";

import app from "../firebase/config";
import "../Misdenuncias.css";

const db = getFirestore(app);
const auth = getAuth(app);

function MisDenuncias() {
  // ---- Estado común ----
  const [tabActiva, setTabActiva] = useState("denuncias");
  const [cargando, setCargando] = useState(null);
  const navigate = useNavigate();

  // ---- Estados para denuncias ----
  const [denuncias, setDenuncias] = useState([]);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState(null);
  const [busquedaDenuncias, setBusquedaDenuncias] = useState("");
  const [editandoDenuncia, setEditandoDenuncia] = useState(false);
  const [formEditDenuncia, setFormEditDenuncia] = useState({
    tipoAnimal: "",
    tipoMaltrato: "",
    descripcion: "",
    fechaCaso: "",
    direccion: "",
    zona: "",
    evidencias: [],
    presuntoInfractor: { nombre: "", documento: "", ciudad: "", telefono: "", correo: "" },
    denuncianteNombre: "",
    denuncianteEmail: "",
    denuncianteTelefono: "",
    esEquino: false,
    datosEquino: { descripcionVehiculo: "", zonaHabitual: "", condicionAnimal: "" },
  });

  // ---- Estados para solicitudes ----
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [busquedaSolicitudes, setBusquedaSolicitudes] = useState("");
  const [editandoSolicitud, setEditandoSolicitud] = useState(false);
  const [formEditSolicitud, setFormEditSolicitud] = useState({
    nombre: "",
    telefono: "",
    ciudad: "",
    direccion: "",
    tipoVivienda: "",
    tienePatio: false,
    viveConFamilia: false,
    tieneMascotas: false,
    experiencia: "",
    motivo: "",
  });

  // ---- Modal de confirmación personalizado ----
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    onConfirm: null,
    message: "",
    itemId: null,
    tipo: null,
  });

  // ---- Toasts ----
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // ==================== DENUNCIAS ====================
  const obtenerMisDenuncias = async (usuario) => {
    const q = query(collection(db, "denuncias"), where("denuncianteId", "==", usuario.uid));
    const snap = await getDocs(q);
    setDenuncias(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const verDetalleDenuncia = (denuncia) => {
    setEditandoDenuncia(false);
    setDenunciaSeleccionada(denuncia);
  };

  const editarDenuncia = (denuncia) => {
    setEditandoDenuncia(true);
    setFormEditDenuncia({
      tipoAnimal: denuncia.tipoAnimal || "",
      tipoMaltrato: denuncia.tipoMaltrato || "",
      descripcion: denuncia.descripcion || "",
      fechaCaso: denuncia.fechaCaso || "",
      direccion: denuncia.direccion || "",
      zona: denuncia.zona || "",
      evidencias: denuncia.evidencias || [],
      presuntoInfractor: {
        nombre: denuncia.presuntoInfractor?.nombre || "",
        documento: denuncia.presuntoInfractor?.documento || "",
        ciudad: denuncia.presuntoInfractor?.ciudad || "",
        telefono: denuncia.presuntoInfractor?.telefono || "",
        correo: denuncia.presuntoInfractor?.correo || "",
      },
      denuncianteNombre: denuncia.denuncianteNombre || "",
      denuncianteEmail: denuncia.denuncianteEmail || "",
      denuncianteTelefono: denuncia.denuncianteTelefono || "",
      esEquino: denuncia.esEquino || false,
      datosEquino: {
        descripcionVehiculo: denuncia.datosEquino?.descripcionVehiculo || "",
        zonaHabitual: denuncia.datosEquino?.zonaHabitual || "",
        condicionAnimal: denuncia.datosEquino?.condicionAnimal || "",
      },
    });
    setDenunciaSeleccionada(denuncia);
  };

  const ejecutarCancelarDenuncia = async (id) => {
    try {
      await updateDoc(doc(db, "denuncias", id), { estado: "Cancelada" });
      const user = auth.currentUser;
      if (user) obtenerMisDenuncias(user);
      setConfirmModal({ visible: false, onConfirm: null, message: "", itemId: null, tipo: null });
      addToast("Denuncia cancelada correctamente", "success");
    } catch (error) {
      addToast("Error al cancelar: " + error.message, "error");
    }
  };

  const guardarEdicionDenuncia = async () => {
    try {
      const updateData = {
        tipoAnimal: formEditDenuncia.tipoAnimal,
        tipoMaltrato: formEditDenuncia.tipoMaltrato,
        descripcion: formEditDenuncia.descripcion,
        fechaCaso: formEditDenuncia.fechaCaso,
        direccion: formEditDenuncia.direccion,
        zona: formEditDenuncia.zona,
        evidencias: formEditDenuncia.evidencias,
        presuntoInfractor: formEditDenuncia.presuntoInfractor,
        denuncianteNombre: formEditDenuncia.denuncianteNombre,
        denuncianteEmail: formEditDenuncia.denuncianteEmail,
        denuncianteTelefono: formEditDenuncia.denuncianteTelefono,
        esEquino: formEditDenuncia.esEquino,
        datosEquino: formEditDenuncia.datosEquino,
      };
      await updateDoc(doc(db, "denuncias", denunciaSeleccionada.id), updateData);
      const user = auth.currentUser;
      if (user) obtenerMisDenuncias(user);
      setDenunciaSeleccionada(null);
      setEditandoDenuncia(false);
      addToast("Denuncia actualizada correctamente", "success");
    } catch (error) {
      addToast("Error al guardar: " + error.message, "error");
    }
  };

  // ==================== SOLICITUDES ====================
  const obtenerMisSolicitudes = async (usuario) => {
    const q = query(collection(db, "solicitudesAdopcion"), where("solicitanteId", "==", usuario.uid));
    const snap = await getDocs(q);
    const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    lista.sort((a, b) => (b.creadoEn?.toDate?.() || 0) - (a.creadoEn?.toDate?.() || 0));
    setSolicitudes(lista);
  };

  const verDetalleSolicitud = (solicitud) => {
    setEditandoSolicitud(false);
    setSolicitudSeleccionada(solicitud);
  };

  const editarSolicitud = (solicitud) => {
    setEditandoSolicitud(true);
    setFormEditSolicitud({
      nombre: solicitud.nombre || "",
      telefono: solicitud.telefono || "",
      ciudad: solicitud.ciudad || "",
      direccion: solicitud.direccion || "",
      tipoVivienda: solicitud.tipoVivienda || "",
      tienePatio: solicitud.tienePatio || false,
      viveConFamilia: solicitud.viveConFamilia || false,
      tieneMascotas: solicitud.tieneMascotas || false,
      experiencia: solicitud.experiencia || "",
      motivo: solicitud.motivo || "",
    });
    setSolicitudSeleccionada(solicitud);
  };

  const ejecutarCancelarSolicitud = async (id) => {
    try {
      await updateDoc(doc(db, "solicitudesAdopcion", id), { estado: "Cancelada" });
      const user = auth.currentUser;
      if (user) obtenerMisSolicitudes(user);
      setConfirmModal({ visible: false, onConfirm: null, message: "", itemId: null, tipo: null });
      addToast("Solicitud cancelada", "success");
    } catch (error) {
      addToast("Error al cancelar: " + error.message, "error");
    }
  };

  const guardarEdicionSolicitud = async () => {
    if (!solicitudSeleccionada) return;
    try {
      const updateData = {
        nombre: formEditSolicitud.nombre,
        telefono: formEditSolicitud.telefono,
        ciudad: formEditSolicitud.ciudad,
        direccion: formEditSolicitud.direccion,
        tipoVivienda: formEditSolicitud.tipoVivienda,
        tienePatio: formEditSolicitud.tienePatio,
        viveConFamilia: formEditSolicitud.viveConFamilia,
        tieneMascotas: formEditSolicitud.tieneMascotas,
        experiencia: formEditSolicitud.experiencia,
        motivo: formEditSolicitud.motivo,
      };
      await updateDoc(doc(db, "solicitudesAdopcion", solicitudSeleccionada.id), updateData);
      const user = auth.currentUser;
      if (user) obtenerMisSolicitudes(user);
      setSolicitudSeleccionada(null);
      setEditandoSolicitud(false);
      addToast("Solicitud actualizada correctamente", "success");
    } catch (error) {
      addToast("Error al actualizar: " + error.message, "error");
    }
  };

  // ==================== CARGA INICIAL ====================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setCargando(true);
        await Promise.all([obtenerMisDenuncias(usuario), obtenerMisSolicitudes(usuario)]);
        setCargando(false);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  // ==================== RENDER ====================
  const claseEstadoDenuncia = (estado) => {
    if (estado === "Validada") return "badge-validada";
    if (estado === "Escalada") return "badge-escalada";
    if (estado === "En revisión") return "badge-revision";
    if (estado === "Cancelada") return "badge-cancelada";
    return "badge-recibida";
  };

  const claseEstadoSolicitud = (estado) => {
    if (estado === "Aprobada") return "badge-validada";
    if (estado === "Pendiente") return "badge-revision";
    if (estado === "Rechazada") return "badge-escalada";
    if (estado === "Encuentro programado") return "badge-encuentro";
    if (estado === "Cancelada") return "badge-cancelada";
    return "badge-recibida";
  };

  const denunciasFiltradas = denuncias.filter((d) => {
    const texto = busquedaDenuncias.toLowerCase();
    return (
      !busquedaDenuncias ||
      d.tipoAnimal?.toLowerCase().includes(texto) ||
      d.tipoMaltrato?.toLowerCase().includes(texto) ||
      d.direccion?.toLowerCase().includes(texto)
    );
  });

  const solicitudesFiltradas = solicitudes.filter((s) => {
    const texto = busquedaSolicitudes.toLowerCase();
    return (
      !busquedaSolicitudes ||
      s.nombreAnimal?.toLowerCase().includes(texto) ||
      s.nombre?.toLowerCase().includes(texto) ||
      s.ciudad?.toLowerCase().includes(texto)
    );
  });

  const totalDenuncias = denuncias.length;
  const validadas = denuncias.filter((d) => d.estado === "Validada").length;
  const escaladas = denuncias.filter((d) => d.estado === "Escalada").length;
  const enRevision = denuncias.filter((d) => d.estado === "En revisión").length;

  const totalSolicitudes = solicitudes.length;
  const aprobadasSolicitudes = solicitudes.filter((s) => s.estado === "Aprobada").length;
  const pendientesSolicitudes = solicitudes.filter((s) => s.estado === "Pendiente").length;
  const rechazadasSolicitudes = solicitudes.filter((s) => s.estado === "Rechazada").length;
  const encuentrosSolicitudes = solicitudes.filter((s) => s.estado === "Encuentro programado").length;

  if (cargando === null || cargando === true) {
    return (
      <div className="md-page">
        <div className="md-vacio">
          <span className="md-vacio-icono">⏳</span>
          <p>Cargando tu información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="md-page">
      {/* Contenedor de toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Modal de confirmación personalizado */}
      {confirmModal.visible && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, visible: false })}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">⚠️</span>
              <h2>Confirmar acción</h2>
            </div>
            <div className="modal-body">
              <p>{confirmModal.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar-modal" onClick={() => setConfirmModal({ ...confirmModal, visible: false })}>No</button>
              <button className="btn-guardar-modal" onClick={() => confirmModal.onConfirm(confirmModal.itemId)}>Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="md-header">
        <div className="md-header-texto">
          <span className="md-eyebrow">Mi panel</span>
          <h1>Mis gestiones</h1>
          <p>Administra tus denuncias y solicitudes de adopción.</p>
        </div>
        <div className="md-header-buttons">
          {tabActiva === "denuncias" ? (
            <Link to="/denuncia" className="md-btn-nueva">+ Nueva denuncia</Link>
          ) : (
            <Link to="/adopciones" className="md-btn-nueva">+ Solicitar adopción</Link>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="admin-tabs" style={{ marginBottom: "1.75rem" }}>
        <button className={tabActiva === "denuncias" ? "active-tab" : ""} onClick={() => setTabActiva("denuncias")}>📋 Mis denuncias</button>
        <button className={tabActiva === "adopciones" ? "active-tab" : ""} onClick={() => setTabActiva("adopciones")}>🐾 Solicitudes de adopción</button>
      </div>

      {/* ========== TABLA DENUNCIAS ========== */}
      {tabActiva === "denuncias" && (
        <>
          <div className="md-stats">
            <div className="md-stat"><span className="md-stat-num">{totalDenuncias}</span><span className="md-stat-label">Total</span></div>
            <div className="md-stat md-stat-blue"><span className="md-stat-num">{validadas}</span><span className="md-stat-label">Validadas</span></div>
            <div className="md-stat md-stat-orange"><span className="md-stat-num">{escaladas}</span><span className="md-stat-label">Escaladas</span></div>
            <div className="md-stat md-stat-purple"><span className="md-stat-num">{enRevision}</span><span className="md-stat-label">En revisión</span></div>
          </div>

          <div className="md-card">
            <div className="md-card-top">
              <h2>Historial de denuncias</h2>
              <input className="md-busqueda" type="text" placeholder="Buscar..." value={busquedaDenuncias} onChange={(e) => setBusquedaDenuncias(e.target.value)} />
            </div>
            {denunciasFiltradas.length === 0 ? (
              <div className="md-vacio"><span className="md-vacio-icono">📋</span><p>{busquedaDenuncias ? "Sin resultados." : "Aún no tienes denuncias."}</p></div>
            ) : (
              <div className="md-tabla-wrap">
                <table className="md-tabla">
                  <thead>
                    <tr><th>Código</th><th>Tipo</th><th>Animal</th><th>Dirección</th><th>Fecha</th><th>Estado</th><th>Evidencias</th><th></th></tr>
                  </thead>
                  <tbody>
                    {denunciasFiltradas.map((d, idx) => (
                      <tr key={d.id}>
                        <td><span className="md-codigo">#DEN-{String(idx+1).padStart(4,"0")}</span></td>
                        <td>{d.tipoMaltrato}</td>
                        <td>{d.tipoAnimal}</td>
                        <td className="md-direccion">{d.direccion}</td>
                        <td>{d.fechaCaso}</td>
                        <td><span className={`md-badge ${claseEstadoDenuncia(d.estado)}`}>{d.estado}</span></td>
                        <td>
                          {d.evidencias?.length ? (
                            <div className="md-evidencias">{d.evidencias.map((u,i)=><a key={i} href={u} className="md-ev-link">Ver {i+1}</a>)}</div>
                          ) : <span className="md-sin-ev">—</span>}
                        </td>
                        <td>
                          <div className="md-acciones">
                            <button className="md-btn-detalle" onClick={() => verDetalleDenuncia(d)}>Detalle</button>
                            <button className="md-btn-editar" onClick={() => editarDenuncia(d)}>Editar</button>
                            <button className="md-btn-cancelar" onClick={() => setConfirmModal({ visible: true, onConfirm: ejecutarCancelarDenuncia, message: "¿Estás seguro de cancelar esta denuncia?", itemId: d.id, tipo: "denuncia" })}>Cancelar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========== TABLA SOLICITUDES - FECHA ELIMINADA DE LA COLUMNA ESTADO ========== */}
      {tabActiva === "adopciones" && (
        <>
          <div className="md-stats">
            <div className="md-stat"><span className="md-stat-num">{totalSolicitudes}</span><span className="md-stat-label">Total</span></div>
            <div className="md-stat md-stat-blue"><span className="md-stat-num">{aprobadasSolicitudes}</span><span className="md-stat-label">Aprobadas</span></div>
            <div className="md-stat md-stat-orange"><span className="md-stat-num">{pendientesSolicitudes}</span><span className="md-stat-label">Pendientes</span></div>
            <div className="md-stat md-stat-purple"><span className="md-stat-num">{rechazadasSolicitudes}</span><span className="md-stat-label">Rechazadas</span></div>
            <div className="md-stat" style={{ borderTopColor: "#1e40af" }}><span className="md-stat-num">{encuentrosSolicitudes}</span><span className="md-stat-label">Encuentros</span></div>
          </div>

          <div className="md-card">
            <div className="md-card-top">
              <h2>Mis solicitudes</h2>
              <input className="md-busqueda" type="text" placeholder="Buscar por animal, nombre o ciudad..." value={busquedaSolicitudes} onChange={(e) => setBusquedaSolicitudes(e.target.value)} />
            </div>
            {solicitudesFiltradas.length === 0 ? (
              <div className="md-vacio"><span className="md-vacio-icono">🐾</span><p>{busquedaSolicitudes ? "Sin resultados." : "Aún no has enviado solicitudes."}</p></div>
            ) : (
              <div className="md-tabla-wrap">
                <table className="md-tabla">
                  <thead>
                    <tr>
                      <th>Animal</th>
                      <th>Solicitante</th>
                      <th>Teléfono</th>
                      <th>Ciudad</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudesFiltradas.map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.nombreAnimal || "—"}</strong></td>
                        <td>{s.nombre || s.solicitanteEmail || "Anónimo"}</td>
                        <td>{s.telefono || "—"}</td>
                        <td>{s.ciudad || "—"}</td>
                        <td>
                          {/* Solo el badge, sin fecha del encuentro */}
                          <span className={`md-badge ${claseEstadoSolicitud(s.estado)}`}>
                            {s.estado}
                          </span>
                        </td>
                        <td>{s.creadoEn?.toDate?.().toLocaleDateString() || "—"}</td>
                        <td>
                          <div className="md-acciones">
                            <button className="md-btn-detalle" onClick={() => verDetalleSolicitud(s)}>Detalle</button>
                            <button className="md-btn-editar" onClick={() => editarSolicitud(s)}>Editar</button>
                            {s.estado === "Pendiente" && (
                              <button className="md-btn-cancelar" onClick={() => setConfirmModal({ 
                                visible: true, 
                                onConfirm: ejecutarCancelarSolicitud, 
                                message: "¿Cancelar esta solicitud de adopción?", 
                                itemId: s.id, 
                                tipo: "solicitud" 
                              })}>Cancelar</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL PROFESIONAL PARA DENUNCIAS */}
      {denunciaSeleccionada && (
        <div className="modal-overlay" onClick={() => setDenunciaSeleccionada(null)}>
          <div className="modal-content modal-profesional" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">⚖️</span>
              <h2>{editandoDenuncia ? "Editar denuncia" : "Detalle de la denuncia"}</h2>
              <button className="modal-cerrar" onClick={() => setDenunciaSeleccionada(null)}>✖</button>
            </div>
            <div className="modal-body">
              {/* contenido del modal (se mantiene igual) */}
              <div className="detalle-seccion">
                <h3><span>🐾</span> Animal</h3>
                <div className="detalle-grid">
                  <div><strong>Tipo:</strong> {editandoDenuncia ? <input value={formEditDenuncia.tipoAnimal} onChange={e => setFormEditDenuncia({...formEditDenuncia, tipoAnimal: e.target.value})} /> : denunciaSeleccionada.tipoAnimal}</div>
                  <div><strong>Raza/color:</strong> {editandoDenuncia ? <input value={formEditDenuncia.raza} onChange={e => setFormEditDenuncia({...formEditDenuncia, raza: e.target.value})} /> : denunciaSeleccionada.raza || "—"}</div>
                </div>
              </div>
              <div className="detalle-seccion">
                <h3><span>⚠️</span> Maltrato</h3>
                <div className="detalle-grid">
                  <div><strong>Tipo:</strong> {editandoDenuncia ? <input value={formEditDenuncia.tipoMaltrato} onChange={e => setFormEditDenuncia({...formEditDenuncia, tipoMaltrato: e.target.value})} /> : denunciaSeleccionada.tipoMaltrato}</div>
                  <div style={{ gridColumn: "span 2" }}><strong>Descripción:</strong> {editandoDenuncia ? <textarea rows={3} value={formEditDenuncia.descripcion} onChange={e => setFormEditDenuncia({...formEditDenuncia, descripcion: e.target.value})} /> : denunciaSeleccionada.descripcion || "Sin descripción"}</div>
                  <div><strong>Fecha:</strong> {editandoDenuncia ? <input type="date" value={formEditDenuncia.fechaCaso} onChange={e => setFormEditDenuncia({...formEditDenuncia, fechaCaso: e.target.value})} /> : denunciaSeleccionada.fechaCaso}</div>
                  <div><strong>Dirección:</strong> {editandoDenuncia ? <input value={formEditDenuncia.direccion} onChange={e => setFormEditDenuncia({...formEditDenuncia, direccion: e.target.value})} /> : denunciaSeleccionada.direccion}</div>
                </div>
              </div>
              <div className="detalle-seccion">
                <h3><span>👤</span> Presunto infractor</h3>
                <div className="detalle-grid">
                  {["nombre","documento","ciudad","telefono","correo"].map(campo => (
                    <div key={campo}>
                      <strong>{campo.charAt(0).toUpperCase()+campo.slice(1)}:</strong>
                      {editandoDenuncia ? <input value={formEditDenuncia.presuntoInfractor[campo]} onChange={e => setFormEditDenuncia({...formEditDenuncia, presuntoInfractor: {...formEditDenuncia.presuntoInfractor, [campo]: e.target.value}})} /> : denunciaSeleccionada.presuntoInfractor?.[campo] || "No registrado"}
                    </div>
                  ))}
                </div>
              </div>
              <div className="detalle-seccion">
                <h3><span>👮</span> Denunciante</h3>
                <div className="detalle-grid">
                  <div><strong>Nombre:</strong> {editandoDenuncia ? <input value={formEditDenuncia.denuncianteNombre} onChange={e => setFormEditDenuncia({...formEditDenuncia, denuncianteNombre: e.target.value})} /> : denunciaSeleccionada.denuncianteNombre || "Anónimo"}</div>
                  <div><strong>Email:</strong> {editandoDenuncia ? <input value={formEditDenuncia.denuncianteEmail} onChange={e => setFormEditDenuncia({...formEditDenuncia, denuncianteEmail: e.target.value})} /> : denunciaSeleccionada.denuncianteEmail || "—"}</div>
                  <div><strong>Teléfono:</strong> {editandoDenuncia ? <input value={formEditDenuncia.denuncianteTelefono} onChange={e => setFormEditDenuncia({...formEditDenuncia, denuncianteTelefono: e.target.value})} /> : denunciaSeleccionada.denuncianteTelefono || "—"}</div>
                </div>
              </div>
              {denunciaSeleccionada.evidencias?.length > 0 && (
                <div className="detalle-seccion">
                  <h3><span>📎</span> Evidencias</h3>
                  <div className="evidencias-lista">{denunciaSeleccionada.evidencias.map((url,i)=> <a key={i} href={url} target="_blank">Ver evidencia {i+1}</a>)}</div>
                </div>
              )}
              {denunciaSeleccionada.esEquino && (
                <div className="detalle-seccion">
                  <h3><span>🐴</span> Datos equino / zorrero</h3>
                  <div className="detalle-grid">
                    <div><strong>Vehículo:</strong> {editandoDenuncia ? <input value={formEditDenuncia.datosEquino.descripcionVehiculo} onChange={e => setFormEditDenuncia({...formEditDenuncia, datosEquino: {...formEditDenuncia.datosEquino, descripcionVehiculo: e.target.value}})} /> : denunciaSeleccionada.datosEquino?.descripcionVehiculo || "—"}</div>
                    <div><strong>Zona habitual:</strong> {editandoDenuncia ? <input value={formEditDenuncia.datosEquino.zonaHabitual} onChange={e => setFormEditDenuncia({...formEditDenuncia, datosEquino: {...formEditDenuncia.datosEquino, zonaHabitual: e.target.value}})} /> : denunciaSeleccionada.datosEquino?.zonaHabitual || "—"}</div>
                    <div><strong>Condición:</strong> {editandoDenuncia ? <textarea rows={2} value={formEditDenuncia.datosEquino.condicionAnimal} onChange={e => setFormEditDenuncia({...formEditDenuncia, datosEquino: {...formEditDenuncia.datosEquino, condicionAnimal: e.target.value}})} /> : denunciaSeleccionada.datosEquino?.condicionAnimal || "—"}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {editandoDenuncia ? (
                <>
                  <button className="btn-guardar-modal" onClick={guardarEdicionDenuncia}>Guardar cambios</button>
                  <button className="btn-cancelar-modal" onClick={() => setDenunciaSeleccionada(null)}>Cancelar</button>
                </>
              ) : (
                <button className="btn-editar-modal" onClick={() => setEditandoDenuncia(true)}>Editar denuncia</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROFESIONAL PARA SOLICITUDES */}
      {solicitudSeleccionada && (
        <div className="modal-overlay" onClick={() => setSolicitudSeleccionada(null)}>
          <div className="modal-content modal-profesional" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">📋</span>
              <h2>{editandoSolicitud ? "Editar solicitud" : "Detalle de la solicitud"}</h2>
              <button className="modal-cerrar" onClick={() => setSolicitudSeleccionada(null)}>✖</button>
            </div>
            <div className="modal-body">
              {/* contenido del modal de solicitud (se mantiene igual) */}
              <div className="detalle-seccion">
                <h3><span>🐶</span> Animal solicitado</h3>
                <div className="detalle-grid"><div><strong>Nombre:</strong> {solicitudSeleccionada.nombreAnimal || "—"}</div></div>
              </div>
              <div className="detalle-seccion">
                <h3><span>👤</span> Datos del solicitante</h3>
                <div className="detalle-grid">
                  <div><strong>Nombre:</strong> {editandoSolicitud ? <input value={formEditSolicitud.nombre} onChange={e => setFormEditSolicitud({...formEditSolicitud, nombre: e.target.value})} /> : solicitudSeleccionada.nombre || "—"}</div>
                  <div><strong>Teléfono:</strong> {editandoSolicitud ? <input value={formEditSolicitud.telefono} onChange={e => setFormEditSolicitud({...formEditSolicitud, telefono: e.target.value})} /> : solicitudSeleccionada.telefono || "—"}</div>
                  <div><strong>Ciudad:</strong> {editandoSolicitud ? <input value={formEditSolicitud.ciudad} onChange={e => setFormEditSolicitud({...formEditSolicitud, ciudad: e.target.value})} /> : solicitudSeleccionada.ciudad || "—"}</div>
                  <div><strong>Dirección:</strong> {editandoSolicitud ? <input value={formEditSolicitud.direccion} onChange={e => setFormEditSolicitud({...formEditSolicitud, direccion: e.target.value})} /> : solicitudSeleccionada.direccion || "—"}</div>
                </div>
              </div>
              <div className="detalle-seccion">
                <h3><span>🏠</span> Información del hogar</h3>
                <div className="detalle-grid">
                  <div><strong>Tipo vivienda:</strong> {editandoSolicitud ? <select value={formEditSolicitud.tipoVivienda} onChange={e => setFormEditSolicitud({...formEditSolicitud, tipoVivienda: e.target.value})}><option value="">Seleccionar</option><option>Casa</option><option>Apartamento</option><option>Finca</option></select> : solicitudSeleccionada.tipoVivienda || "—"}</div>
                  <div><strong>Patio:</strong> {editandoSolicitud ? <input type="checkbox" checked={formEditSolicitud.tienePatio} onChange={e => setFormEditSolicitud({...formEditSolicitud, tienePatio: e.target.checked})} /> : (solicitudSeleccionada.tienePatio ? "Sí" : "No")}</div>
                  <div><strong>Vive con familia:</strong> {editandoSolicitud ? <input type="checkbox" checked={formEditSolicitud.viveConFamilia} onChange={e => setFormEditSolicitud({...formEditSolicitud, viveConFamilia: e.target.checked})} /> : (solicitudSeleccionada.viveConFamilia ? "Sí" : "No")}</div>
                </div>
              </div>
              <div className="detalle-seccion">
                <h3><span>🐾</span> Experiencia y motivo</h3>
                <div className="detalle-grid">
                  <div><strong>Otras mascotas:</strong> {editandoSolicitud ? <input type="checkbox" checked={formEditSolicitud.tieneMascotas} onChange={e => setFormEditSolicitud({...formEditSolicitud, tieneMascotas: e.target.checked})} /> : (solicitudSeleccionada.tieneMascotas ? "Sí" : "No")}</div>
                  <div style={{ gridColumn: "span 2" }}><strong>Experiencia:</strong> {editandoSolicitud ? <textarea rows={2} value={formEditSolicitud.experiencia} onChange={e => setFormEditSolicitud({...formEditSolicitud, experiencia: e.target.value})} /> : solicitudSeleccionada.experiencia || "—"}</div>
                  <div style={{ gridColumn: "span 2" }}><strong>Motivo:</strong> {editandoSolicitud ? <textarea rows={2} value={formEditSolicitud.motivo} onChange={e => setFormEditSolicitud({...formEditSolicitud, motivo: e.target.value})} /> : solicitudSeleccionada.motivo || "—"}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {editandoSolicitud ? (
                <>
                  <button className="btn-guardar-modal" onClick={guardarEdicionSolicitud}>Guardar cambios</button>
                  <button className="btn-cancelar-modal" onClick={() => setSolicitudSeleccionada(null)}>Cancelar</button>
                </>
              ) : (
                <button className="btn-editar-modal" onClick={() => setEditandoSolicitud(true)}>Editar solicitud</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MisDenuncias;