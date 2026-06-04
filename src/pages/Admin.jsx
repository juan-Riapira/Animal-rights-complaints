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
            denuncias: (data.denuncias || 1) + 1,
            ultimoCaso: denuncia.fechaCaso || data.ultimoCaso,
            estado: nuevoEstado,
            nivelRiesgo: riesgo,
          });
        }
      }
    }
    obtenerDatos();
  };

  const cambiarEstadoAdopcion = async (id, nuevoEstado) => {
    await updateDoc(doc(db, "adopciones", id), { estadoPublicacion: nuevoEstado });
    obtenerDatos();
  };

  const aprobarSolicitud = async (id, solicitanteId, animalNombre) => {
    await updateDoc(doc(db, "solicitudesAdopcion", id), { estado: "Aprobada" });
    await crearNotificacion(
      solicitanteId,
      "✅ Solicitud aprobada",
      `Tu solicitud para adoptar a ${animalNombre || "una mascota"} ha sido aprobada.`,
      "aprobacion"
    );
    obtenerDatos();
  };

  const rechazarSolicitud = async (id, solicitanteId, animalNombre) => {
    await updateDoc(doc(db, "solicitudesAdopcion", id), { estado: "Rechazada" });
    await crearNotificacion(
      solicitanteId,
      "❌ Solicitud rechazada",
      `Tu solicitud para adoptar a ${animalNombre || "una mascota"} ha sido rechazada.`,
      "rechazo"
    );
    obtenerDatos();
  };

  const abrirModalFecha = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setFechaSeleccionada("");
    setMostrarModalFecha(true);
  };

  const guardarEncuentro = async () => {
    if (!fechaSeleccionada) {
      alert("Por favor selecciona una fecha y hora");
      return;
    }
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
  };

  const abrirEdicion = (tipo, data) => {
    setEditForm(JSON.parse(JSON.stringify(data)));
    setModalEdicion({ visible: true, tipo, data });
  };

  const guardarEdicion = async () => {
    const { tipo, data } = modalEdicion;
    try {
      let updateData = {};
      switch (tipo) {
        case "denuncia":
          updateData = {
            tipoAnimal: editForm.tipoAnimal,
            tipoMaltrato: editForm.tipoMaltrato,
            descripcion: editForm.descripcion,
            fechaCaso: editForm.fechaCaso,
            direccion: editForm.direccion,
            ubicacion: editForm.ubicacion,
            evidencias: editForm.evidencias,
            presuntoInfractor: editForm.presuntoInfractor,
            denuncianteNombre: editForm.denuncianteNombre,
            denuncianteEmail: editForm.denuncianteEmail,
            denuncianteTelefono: editForm.denuncianteTelefono,
            esEquino: editForm.esEquino,
            datosEquino: editForm.datosEquino,
          };
          await updateDoc(doc(db, "denuncias", data.id), updateData);
          break;
        case "adopcion":
          updateData = {
            nombreAnimal: editForm.nombreAnimal,
            especie: editForm.especie,
            edad: editForm.edad,
            ciudad: editForm.ciudad,
            descripcion: editForm.descripcion,
            fotos: editForm.fotos,
            vacunado: editForm.vacunado,
            esterilizado: editForm.esterilizado,
            socializado: editForm.socializado,
            estadoPublicacion: editForm.estadoPublicacion,
          };
          await updateDoc(doc(db, "adopciones", data.id), updateData);
          break;
        case "usuario":
          updateData = {
            nombre: editForm.nombre,
            email: editForm.email,
            documento: editForm.documento,
            telefono: editForm.telefono,
            fechaNacimiento: editForm.fechaNacimiento,
            ciudad: editForm.ciudad,
          };
          await updateDoc(doc(db, "users", data.id), updateData);
          break;
        case "solicitud":
          updateData = {
            nombre: editForm.nombre,
            telefono: editForm.telefono,
            ciudad: editForm.ciudad,
            direccion: editForm.direccion,
            tipoVivienda: editForm.tipoVivienda,
            tienePatio: editForm.tienePatio,
            viveConFamilia: editForm.viveConFamilia,
            tieneMascotas: editForm.tieneMascotas,
            experiencia: editForm.experiencia,
            motivo: editForm.motivo,
          };
          await updateDoc(doc(db, "solicitudesAdopcion", data.id), updateData);
          break;
        default:
          break;
      }
      await obtenerDatos();
      setModalEdicion({ visible: false, tipo: null, data: null });
      alert("Guardado correctamente");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo guardar el cambio");
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  if (!usuario || usuario.email !== "admin.natufauna@gmail.com") {
    return <h1 style={{ textAlign: "center", marginTop: "50px", color: "red" }}>Acceso denegado</h1>;
  }

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
      {/* MODAL DE EDICIÓN (estilo MisDenuncias) */}
      {modalEdicion.visible && (
        <div className="modal-overlay" onClick={() => setModalEdicion({ visible: false, tipo: null, data: null })}>
          <div className="modal-content modal-profesional" onClick={(e) => e.stopPropagation()}>
            <button className="modal-cerrar" onClick={() => setModalEdicion({ visible: false, tipo: null, data: null })}>
              ✖
            </button>
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
                      <div>
                        <strong>Tipo:</strong>
                        <input value={editForm.tipoAnimal || ""} onChange={(e) => setEditForm({ ...editForm, tipoAnimal: e.target.value })} />
                      </div>
                      <div>
                        <strong>Raza/color:</strong>
                        <input value={editForm.raza || ""} onChange={(e) => setEditForm({ ...editForm, raza: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="detalle-seccion">
                    <h3><span>⚠️</span> Maltrato</h3>
                    <div className="detalle-grid">
                      <div>
                        <strong>Tipo:</strong>
                        <input value={editForm.tipoMaltrato || ""} onChange={(e) => setEditForm({ ...editForm, tipoMaltrato: e.target.value })} />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <strong>Descripción:</strong>
                        <textarea rows={3} value={editForm.descripcion || ""} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} />
                      </div>
                      <div>
                        <strong>Fecha del caso:</strong>
                        <input type="date" value={editForm.fechaCaso || ""} onChange={(e) => setEditForm({ ...editForm, fechaCaso: e.target.value })} />
                      </div>
                      <div>
                        <strong>Ubicación:</strong>
                        <input value={editForm.ubicacion || ""} onChange={(e) => setEditForm({ ...editForm, ubicacion: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="detalle-seccion">
                    <h3><span>👤</span> Presunto infractor</h3>
                    <div className="detalle-grid">
                      {["nombre", "documento", "ciudad", "telefono", "correo"].map((campo) => (
                        <div key={campo}>
                          <strong>{campo.charAt(0).toUpperCase() + campo.slice(1)}:</strong>
                          <input
                            value={editForm.presuntoInfractor?.[campo] || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                presuntoInfractor: { ...editForm.presuntoInfractor, [campo]: e.target.value },
                              })
                            }
                          />
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
                        <div>
                          <strong>Vehículo:</strong>
                          <input value={editForm.datosEquino?.descripcionVehiculo || ""} onChange={(e) => setEditForm({ ...editForm, datosEquino: { ...editForm.datosEquino, descripcionVehiculo: e.target.value } })} />
                        </div>
                        <div>
                          <strong>Zona habitual:</strong>
                          <input value={editForm.datosEquino?.zonaHabitual || ""} onChange={(e) => setEditForm({ ...editForm, datosEquino: { ...editForm.datosEquino, zonaHabitual: e.target.value } })} />
                        </div>
                        <div>
                          <strong>Condición animal:</strong>
                          <textarea rows={2} value={editForm.datosEquino?.condicionAnimal || ""} onChange={(e) => setEditForm({ ...editForm, datosEquino: { ...editForm.datosEquino, condicionAnimal: e.target.value } })} />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {/* ADOPCIÓN */}
              {modalEdicion.tipo === "adopcion" && (
                <div className="detalle-grid">
                  <div><strong>Nombre:</strong> <input value={editForm.nombreAnimal || ""} onChange={(e) => setEditForm({ ...editForm, nombreAnimal: e.target.value })} /></div>
                  <div><strong>Especie:</strong> <input value={editForm.especie || ""} onChange={(e) => setEditForm({ ...editForm, especie: e.target.value })} /></div>
                  <div><strong>Edad:</strong> <input value={editForm.edad || ""} onChange={(e) => setEditForm({ ...editForm, edad: e.target.value })} /></div>
                  <div><strong>Ciudad:</strong> <input value={editForm.ciudad || ""} onChange={(e) => setEditForm({ ...editForm, ciudad: e.target.value })} /></div>
                  <div><strong>Descripción:</strong> <textarea rows={3} value={editForm.descripcion || ""} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} /></div>
                  <div><strong>Estado:</strong> <select value={editForm.estadoPublicacion || ""} onChange={(e) => setEditForm({ ...editForm, estadoPublicacion: e.target.value })}><option>Aprobada</option><option>Rechazada</option><option>Pendiente</option></select></div>
                </div>
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
                  <div><strong>Email:</strong> {modalEdicion.data.solicitanteEmail || "No registrado"}</div>
                  <div><strong>Teléfono:</strong> <input value={editForm.telefono || ""} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} /></div>
                  <div><strong>Ciudad:</strong> <input value={editForm.ciudad || ""} onChange={(e) => setEditForm({ ...editForm, ciudad: e.target.value })} /></div>
                  <div><strong>Dirección:</strong> <input value={editForm.direccion || ""} onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })} /></div>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📅 Agendar encuentro presencial</h3>
            <p>Solicitud de: <strong>{solicitudSeleccionada?.nombre || solicitudSeleccionada?.solicitanteEmail}</strong></p>
            <input type="datetime-local" value={fechaSeleccionada} onChange={(e) => setFechaSeleccionada(e.target.value)} style={{ width: "100%", margin: "10px 0" }} />
            <div className="modal-buttons">
              <button className="btn-cancelar-modal" onClick={() => setMostrarModalFecha(false)}>Cancelar</button>
              <button className="btn-guardar-modal" onClick={guardarEncuentro}>Confirmar</button>
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

      {/* TABLA DENUNCIAS - solo botón Editar */}
      {tabActiva === "denuncias" && (
        <div className="admin-table-card">
          <h2>📋 Denuncias Registradas</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Animal</th>
                <th>Maltrato</th>
                <th>Infractor</th>
                <th>Documento</th>
                <th>Estado</th>
                <th>Acciones</th>
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

      {/* TABLA ADOPCIONES - solo botón Editar */}
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
                  <td>{a.fotos?.length > 0 ? <img src={a.fotos[0]} className="admin-thumb" alt="" /> : "Sin foto"}</td>
                  <td>{a.nombreAnimal}</td>
                  <td>{a.ciudad}</td>
                  <td>{a.estadoPublicacion}</td>
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

      {/* TABLA USUARIOS - solo botón Editar */}
      {tabActiva === "usuarios" && (
        <div className="admin-table-card">
          <h2>👥 Usuarios Registrados</h2>
          <table className="admin-table">
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Documento</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre || "Sin nombre"}</td>
                  <td>{u.email}</td>
                  <td>{u.documento}</td>
                  <td className="acciones-botones">
                    <button className="btn-editar" onClick={() => abrirEdicion("usuario", u)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLA SOLICITUDES - solo botón Editar (y otros de estado) */}
      {tabActiva === "solicitudes" && (
        <div className="admin-table-card">
          <h2>📋 Solicitudes de Adopción</h2>
          <table className="admin-table">
            <thead>
              <tr><th>Animal</th><th>Solicitante</th><th>Teléfono</th><th>Ciudad</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombreAnimal || "No especificado"}</td>
                  <td>{s.nombre || s.solicitanteEmail || "Anónimo"}</td>
                  <td>{s.telefono || "—"}</td>
                  <td>{s.ciudad || "—"}</td>
                  <td>
                    {s.estado}
                    {s.fechaEncuentro && <small>📅 {new Date(s.fechaEncuentro).toLocaleString()}</small>}
                  </td>
                  <td className="acciones-botones">
                    <button className="btn-editar" onClick={() => abrirEdicion("solicitud", s)}>Editar</button>
                    <button className="btn-aprobar" onClick={() => aprobarSolicitud(s.id, s.solicitanteId, s.nombreAnimal)}>Aprobar</button>
                    <button className="btn-rechazar" onClick={() => rechazarSolicitud(s.id, s.solicitanteId, s.nombreAnimal)}>Rechazar</button>
                    <button className="btn-agendar" onClick={() => abrirModalFecha(s)}>Agendar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Admin;