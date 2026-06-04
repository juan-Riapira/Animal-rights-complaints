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
  const [tabActiva, setTabActiva] = useState("denuncias"); // "denuncias" o "adopciones"
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

  // ---- Estados para solicitudes de adopción ----
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

  // ==================== FUNCIONES PARA DENUNCIAS ====================
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

  const cancelarDenuncia = async (denuncia) => {
    const confirmar = window.confirm("¿Estás seguro de cancelar esta denuncia? Esta acción no se puede deshacer.");
    if (!confirmar) return;
    try {
      await updateDoc(doc(db, "denuncias", denuncia.id), { estado: "Cancelada" });
      const user = auth.currentUser;
      if (user) obtenerMisDenuncias(user);
      setDenunciaSeleccionada(null);
    } catch (error) {
      alert("Error al cancelar: " + error.message);
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
      alert("Denuncia actualizada correctamente");
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  // ==================== FUNCIONES PARA SOLICITUDES ====================
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

  const cancelarSolicitud = async (solicitud) => {
    if (solicitud.estado !== "Pendiente") {
      alert("Solo puedes cancelar solicitudes que estén pendientes.");
      return;
    }
    const confirmar = window.confirm("¿Cancelar esta solicitud de adopción?");
    if (!confirmar) return;
    try {
      await updateDoc(doc(db, "solicitudesAdopcion", solicitud.id), { estado: "Cancelada" });
      const user = auth.currentUser;
      if (user) obtenerMisSolicitudes(user);
      setSolicitudSeleccionada(null);
    } catch (error) {
      alert("Error al cancelar: " + error.message);
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
      alert("Solicitud actualizada correctamente");
    } catch (error) {
      alert("Error al actualizar: " + error.message);
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

  // ==================== RENDERIZADO CONDICIONAL ====================
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
      <div className="md-header">
        <div className="md-header-texto">
          <span className="md-eyebrow">Mi panel</span>
          <h1>Mis gestiones</h1>
          <p>Administra tus denuncias y solicitudes de adopción.</p>
        </div>
        <div className="md-header-buttons">
          {tabActiva === "denuncias" ? (
            <Link to="/denuncia" className="md-btn-nueva">
              + Nueva denuncia
            </Link>
          ) : (
            <Link to="/adopciones" className="md-btn-nueva">
              + Solicitar adopción
            </Link>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="admin-tabs" style={{ marginBottom: "1.75rem" }}>
        <button
          className={tabActiva === "denuncias" ? "active-tab" : ""}
          onClick={() => setTabActiva("denuncias")}
        >
          📋 Mis denuncias
        </button>
        <button
          className={tabActiva === "adopciones" ? "active-tab" : ""}
          onClick={() => setTabActiva("adopciones")}
        >
          🐾 Solicitudes de adopción
        </button>
      </div>

      {/* ========== CONTENIDO DENUNCIAS ========== */}
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
              <input
                className="md-busqueda"
                type="text"
                placeholder="Buscar por animal, maltrato, dirección..."
                value={busquedaDenuncias}
                onChange={(e) => setBusquedaDenuncias(e.target.value)}
              />
            </div>

            {denunciasFiltradas.length === 0 ? (
              <div className="md-vacio">
                <span className="md-vacio-icono">📋</span>
                <p>{busquedaDenuncias ? "Sin resultados para tu búsqueda." : "Aún no tienes denuncias registradas."}</p>
                {!busquedaDenuncias && <Link to="/denuncia" className="md-btn-nueva">Crear primera denuncia</Link>}
              </div>
            ) : (
              <div className="md-tabla-wrap">
                <table className="md-tabla">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Tipo</th>
                      <th>Animal</th>
                      <th>Dirección</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Evidencias</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {denunciasFiltradas.map((denuncia, index) => (
                      <tr key={denuncia.id}>
                        <td><span className="md-codigo">#DEN-{String(index + 1).padStart(4, "0")}</span></td>
                        <td>{denuncia.tipoMaltrato}</td>
                        <td>{denuncia.tipoAnimal}</td>
                        <td className="md-direccion">{denuncia.direccion}</td>
                        <td>{denuncia.fechaCaso}</td>
                        <td><span className={`md-badge ${claseEstadoDenuncia(denuncia.estado)}`}>{denuncia.estado}</span></td>
                        <td>
                          {denuncia.evidencias?.length > 0 ? (
                            <div className="md-evidencias">
                              {denuncia.evidencias.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer" className="md-ev-link">Ver {i+1}</a>
                              ))}
                            </div>
                          ) : <span className="md-sin-ev">—</span>}
                        </td>
                        <td>
                          <div className="md-acciones">
                            <button className="md-btn-detalle" onClick={() => verDetalleDenuncia(denuncia)}>Detalle</button>
                            <button className="md-btn-editar" onClick={() => editarDenuncia(denuncia)}>Editar</button>
                            <button className="md-btn-cancelar" onClick={() => cancelarDenuncia(denuncia)}>Cancelar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal de Denuncia */}
          {denunciaSeleccionada && (
            <div className="md-modal-fondo" onClick={() => setDenunciaSeleccionada(null)}>
              <div className="md-modal" onClick={(e) => e.stopPropagation()}>
                <div className="md-modal-header">
                  <div>
                    <span className="md-eyebrow">{editandoDenuncia ? "Editar reporte" : "Reporte completo"}</span>
                    <h2>{editandoDenuncia ? "Editar denuncia" : "Detalle de la denuncia"}</h2>
                  </div>
                  <button className="md-btn-cerrar" onClick={() => setDenunciaSeleccionada(null)}>×</button>
                </div>
                <div className="md-modal-body">
                  <div className="md-modal-seccion">
                    <h3>Animal y maltrato</h3>
                    <div className="md-modal-grid">
                      <div><span>Tipo de animal</span>{editandoDenuncia ? <input value={formEditDenuncia.tipoAnimal} onChange={e => setFormEditDenuncia({...formEditDenuncia, tipoAnimal: e.target.value})} /> : <strong>{denunciaSeleccionada.tipoAnimal}</strong>}</div>
                      <div><span>Tipo de maltrato</span>{editandoDenuncia ? <input value={formEditDenuncia.tipoMaltrato} onChange={e => setFormEditDenuncia({...formEditDenuncia, tipoMaltrato: e.target.value})} /> : <strong>{denunciaSeleccionada.tipoMaltrato}</strong>}</div>
                      <div><span>Fecha</span>{editandoDenuncia ? <input type="date" value={formEditDenuncia.fechaCaso} onChange={e => setFormEditDenuncia({...formEditDenuncia, fechaCaso: e.target.value})} /> : <strong>{denunciaSeleccionada.fechaCaso}</strong>}</div>
                      <div><span>Estado</span><span className={`md-badge ${claseEstadoDenuncia(denunciaSeleccionada.estado)}`}>{denunciaSeleccionada.estado}</span></div>
                      <div><span>Prioridad</span><strong>{denunciaSeleccionada.prioridad}</strong></div>
                      <div><span>Dirección</span>{editandoDenuncia ? <input value={formEditDenuncia.direccion} onChange={e => setFormEditDenuncia({...formEditDenuncia, direccion: e.target.value})} /> : <strong>{denunciaSeleccionada.direccion}</strong>}</div>
                    </div>
                    <div className="md-descripcion">
                      <span>Descripción</span>
                      {editandoDenuncia ? <textarea rows={3} value={formEditDenuncia.descripcion} onChange={e => setFormEditDenuncia({...formEditDenuncia, descripcion: e.target.value})} /> : <p>{denunciaSeleccionada.descripcion || "Sin descripción"}</p>}
                    </div>
                  </div>
                  <div className="md-modal-seccion">
                    <h3>Presunto infractor</h3>
                    <div className="md-modal-grid">
                      {["nombre", "documento", "ciudad", "telefono", "correo"].map(campo => (
                        <div key={campo}>
                          <span>{campo.charAt(0).toUpperCase() + campo.slice(1)}</span>
                          {editandoDenuncia ? <input value={formEditDenuncia.presuntoInfractor[campo]} onChange={e => setFormEditDenuncia({...formEditDenuncia, presuntoInfractor: {...formEditDenuncia.presuntoInfractor, [campo]: e.target.value}})} /> : <strong>{denunciaSeleccionada.presuntoInfractor?.[campo] || "No registrado"}</strong>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md-modal-seccion">
                    <h3>Evidencias</h3>
                    {editandoDenuncia ? (
                      <div className="edit-evidencias">
                        {formEditDenuncia.evidencias.map((url, idx) => (
                          <div key={idx} className="edit-evidencia-fila">
                            <input type="url" value={url} onChange={e => { const newEv = [...formEditDenuncia.evidencias]; newEv[idx] = e.target.value; setFormEditDenuncia({...formEditDenuncia, evidencias: newEv}); }} />
                            <button onClick={() => { const newEv = formEditDenuncia.evidencias.filter((_, i) => i !== idx); setFormEditDenuncia({...formEditDenuncia, evidencias: newEv.length ? newEv : [""]}); }}>×</button>
                          </div>
                        ))}
                        <button className="md-btn-agregar-evid" onClick={() => setFormEditDenuncia({...formEditDenuncia, evidencias: [...formEditDenuncia.evidencias, ""]})}>+ Agregar enlace</button>
                      </div>
                    ) : (
                      denunciaSeleccionada.evidencias?.length > 0 ? (
                        <div className="md-modal-evidencias">
                          {denunciaSeleccionada.evidencias.map((url, i) => <a key={i} href={url} target="_blank" rel="noreferrer" className="md-modal-ev-link">🔗 Evidencia {i+1}</a>)}
                        </div>
                      ) : <p className="md-sin-ev">No hay evidencias registradas.</p>
                    )}
                  </div>
                  {denunciaSeleccionada.esEquino && (
                    <div className="md-modal-seccion">
                      <h3>Datos equino / zorrero</h3>
                      <div className="md-modal-grid">
                        <div><span>Vehículo</span>{editandoDenuncia ? <input value={formEditDenuncia.datosEquino.descripcionVehiculo} onChange={e => setFormEditDenuncia({...formEditDenuncia, datosEquino: {...formEditDenuncia.datosEquino, descripcionVehiculo: e.target.value}})} /> : <strong>{denunciaSeleccionada.datosEquino?.descripcionVehiculo || "—"}</strong>}</div>
                        <div><span>Zona habitual</span>{editandoDenuncia ? <input value={formEditDenuncia.datosEquino.zonaHabitual} onChange={e => setFormEditDenuncia({...formEditDenuncia, datosEquino: {...formEditDenuncia.datosEquino, zonaHabitual: e.target.value}})} /> : <strong>{denunciaSeleccionada.datosEquino?.zonaHabitual || "—"}</strong>}</div>
                        <div><span>Condición animal</span>{editandoDenuncia ? <textarea rows={2} value={formEditDenuncia.datosEquino.condicionAnimal} onChange={e => setFormEditDenuncia({...formEditDenuncia, datosEquino: {...formEditDenuncia.datosEquino, condicionAnimal: e.target.value}})} /> : <strong>{denunciaSeleccionada.datosEquino?.condicionAnimal || "—"}</strong>}</div>
                      </div>
                    </div>
                  )}
                  {editandoDenuncia && (
                    <div className="md-modal-footer">
                      <button className="md-btn-guardar" onClick={guardarEdicionDenuncia}>💾 Guardar cambios</button>
                      <button className="md-btn-cancelar-edicion" onClick={() => setDenunciaSeleccionada(null)}>Cancelar</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== MIS SOLICITUDES DE ADOPCIÓN ========== */}
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
              <h2>Mis solicitudes de adopción</h2>
              <input
                className="md-busqueda"
                type="text"
                placeholder="Buscar por animal, nombre o ciudad..."
                value={busquedaSolicitudes}
                onChange={(e) => setBusquedaSolicitudes(e.target.value)}
              />
            </div>

            {solicitudesFiltradas.length === 0 ? (
              <div className="md-vacio">
                <span className="md-vacio-icono">🐾</span>
                <p>{busquedaSolicitudes ? "Sin resultados." : "Aún no has enviado solicitudes de adopción."}</p>
                {!busquedaSolicitudes && <Link to="/adopciones" className="md-btn-nueva">Solicitar adopción</Link>}
              </div>
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
                          <span className={`md-badge ${claseEstadoSolicitud(s.estado)}`}>{s.estado}</span>
                          {s.fechaEncuentro && <div><small>📅 {new Date(s.fechaEncuentro).toLocaleDateString()}</small></div>}
                        </td>
                        <td>{s.creadoEn?.toDate?.().toLocaleDateString() || "—"}</td>
                        <td>
                          <div className="md-acciones">
                            <button className="md-btn-detalle" onClick={() => verDetalleSolicitud(s)}>Detalle</button>
                            <button className="md-btn-editar" onClick={() => editarSolicitud(s)}>Editar</button>
                            {s.estado === "Pendiente" && <button className="md-btn-cancelar" onClick={() => cancelarSolicitud(s)}>Cancelar</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal de Solicitud */}
          {solicitudSeleccionada && (
            <div className="md-modal-fondo" onClick={() => setSolicitudSeleccionada(null)}>
              <div className="md-modal" onClick={(e) => e.stopPropagation()}>
                <div className="md-modal-header">
                  <div>
                    <span className="md-eyebrow">{editandoSolicitud ? "Editar solicitud" : "Detalle de solicitud"}</span>
                    <h2>Solicitud para {solicitudSeleccionada.nombreAnimal || "adoptar"}</h2>
                  </div>
                  <button className="md-btn-cerrar" onClick={() => setSolicitudSeleccionada(null)}>×</button>
                </div>
                <div className="md-modal-body">
                  {!editandoSolicitud ? (
                    <>
                      <div className="md-modal-grid">
                        <div><span>Animal</span><strong>{solicitudSeleccionada.nombreAnimal || "—"}</strong></div>
                        <div><span>Solicitante</span><strong>{solicitudSeleccionada.nombre || "—"}</strong></div>
                        <div><span>Email</span><strong>{solicitudSeleccionada.solicitanteEmail || "—"}</strong></div>
                        <div><span>Teléfono</span><strong>{solicitudSeleccionada.telefono || "—"}</strong></div>
                        <div><span>Ciudad</span><strong>{solicitudSeleccionada.ciudad || "—"}</strong></div>
                        <div><span>Dirección</span><strong>{solicitudSeleccionada.direccion || "—"}</strong></div>
                        <div><span>Tipo vivienda</span><strong>{solicitudSeleccionada.tipoVivienda || "—"}</strong></div>
                        <div><span>Patio</span><strong>{solicitudSeleccionada.tienePatio ? "Sí" : "No"}</strong></div>
                        <div><span>Vive con familia</span><strong>{solicitudSeleccionada.viveConFamilia ? "Sí" : "No"}</strong></div>
                        <div><span>Otras mascotas</span><strong>{solicitudSeleccionada.tieneMascotas ? "Sí" : "No"}</strong></div>
                        <div><span>Estado</span><span className={`md-badge ${claseEstadoSolicitud(solicitudSeleccionada.estado)}`}>{solicitudSeleccionada.estado}</span></div>
                        {solicitudSeleccionada.fechaEncuentro && <div><span>Encuentro</span><strong>{new Date(solicitudSeleccionada.fechaEncuentro).toLocaleString()}</strong></div>}
                      </div>
                      <div className="md-descripcion"><span>Experiencia</span><p>{solicitudSeleccionada.experiencia || "—"}</p></div>
                      <div className="md-descripcion"><span>Motivo</span><p>{solicitudSeleccionada.motivo || "—"}</p></div>
                    </>
                  ) : (
                    <>
                      <div className="md-modal-grid">
                        <div><span>Nombre</span><input value={formEditSolicitud.nombre} onChange={e => setFormEditSolicitud({...formEditSolicitud, nombre: e.target.value})} /></div>
                        <div><span>Teléfono</span><input value={formEditSolicitud.telefono} onChange={e => setFormEditSolicitud({...formEditSolicitud, telefono: e.target.value})} /></div>
                        <div><span>Ciudad</span><input value={formEditSolicitud.ciudad} onChange={e => setFormEditSolicitud({...formEditSolicitud, ciudad: e.target.value})} /></div>
                        <div><span>Dirección</span><input value={formEditSolicitud.direccion} onChange={e => setFormEditSolicitud({...formEditSolicitud, direccion: e.target.value})} /></div>
                        <div><span>Tipo vivienda</span>
                          <select value={formEditSolicitud.tipoVivienda} onChange={e => setFormEditSolicitud({...formEditSolicitud, tipoVivienda: e.target.value})}>
                            <option value="">Seleccionar</option>
                            <option value="Casa">Casa</option>
                            <option value="Apartamento">Apartamento</option>
                            <option value="Finca">Finca</option>
                          </select>
                        </div>
                        <div><label><input type="checkbox" checked={formEditSolicitud.tienePatio} onChange={e => setFormEditSolicitud({...formEditSolicitud, tienePatio: e.target.checked})} /> Tiene patio</label></div>
                        <div><label><input type="checkbox" checked={formEditSolicitud.viveConFamilia} onChange={e => setFormEditSolicitud({...formEditSolicitud, viveConFamilia: e.target.checked})} /> Vive con familia</label></div>
                        <div><label><input type="checkbox" checked={formEditSolicitud.tieneMascotas} onChange={e => setFormEditSolicitud({...formEditSolicitud, tieneMascotas: e.target.checked})} /> Tiene otras mascotas</label></div>
                      </div>
                      <div className="md-descripcion"><span>Experiencia</span><textarea rows={2} value={formEditSolicitud.experiencia} onChange={e => setFormEditSolicitud({...formEditSolicitud, experiencia: e.target.value})} /></div>
                      <div className="md-descripcion"><span>Motivo</span><textarea rows={2} value={formEditSolicitud.motivo} onChange={e => setFormEditSolicitud({...formEditSolicitud, motivo: e.target.value})} /></div>
                    </>
                  )}
                </div>
                {editandoSolicitud && (
                  <div className="md-modal-footer">
                    <button className="md-btn-guardar" onClick={guardarEdicionSolicitud}>Guardar cambios</button>
                    <button className="md-btn-cancelar-edicion" onClick={() => setSolicitudSeleccionada(null)}>Cancelar</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MisDenuncias;