import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import app from "../firebase/config";
import "../Registro.css";

const db = getFirestore(app);

function RegistroPublico() {
  const [denunciasValidadas, setDenunciasValidadas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState(null);

  const obtenerDenunciasValidadas = async () => {
    const qValid = query(collection(db, "denuncias"), where("estado", "in", ["Validada", "Escalada"]));
    const snapshot = await getDocs(qValid);
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    lista.sort((a, b) => (b.fechaCaso || "").localeCompare(a.fechaCaso || ""));
    setDenunciasValidadas(lista);
  };

  useEffect(() => {
    obtenerDenunciasValidadas();
  }, []);

  const denunciasFiltradas = denunciasValidadas.filter((den) => {
    const texto = busqueda.toLowerCase();
    return (
      den.tipoAnimal?.toLowerCase().includes(texto) ||
      den.tipoMaltrato?.toLowerCase().includes(texto) ||
      den.descripcion?.toLowerCase().includes(texto) ||
      den.presuntoInfractor?.nombre?.toLowerCase().includes(texto) ||
      den.presuntoInfractor?.documento?.toLowerCase().includes(texto) ||
      den.ciudad?.toLowerCase().includes(texto)
    );
  });

  const claseEstado = (estado) => {
    if (estado === "Validada") return "estado-validada";
    if (estado === "Escalada") return "estado-escalada";
    return "";
  };

  const claseRiesgo = (prioridad) => {
    if (prioridad === "Alta") return "riesgo-alto";
    return "riesgo-bajo";
  };

  const abrirModal = (denuncia) => {
    setDenunciaSeleccionada(denuncia);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setDenunciaSeleccionada(null);
  };

  return (
    <div className="registro-publico-page">
      <div className="registro-header">
        <h1>🚨 Registro Público de Casos Validados</h1>
        <p>
          Consulta las denuncias que han sido validadas o escaladas por maltrato animal.
        </p>
      </div>

      <div className="buscador-card">
        <input
          type="text"
          placeholder="Buscar por animal, maltrato, infractor, ciudad..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="table-card">
        <h2>Denuncias validadas y escaladas</h2>

        {denunciasFiltradas.length === 0 ? (
          <p>No se encontraron denuncias validadas.</p>
        ) : (
          <table className="denuncias-table">
            <thead>
              <tr>
                <th>Animal</th>
                <th>Tipo maltrato</th>
                <th>Infractor</th>
                <th>Documento</th>
                <th>Ciudad</th>
                <th>Descripción del caso</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Riesgo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {denunciasFiltradas.map((den) => (
                <tr key={den.id}>
                  <td>{den.tipoAnimal || "—"}</td>
                  <td>{den.tipoMaltrato || "—"}</td>
                  <td>{den.presuntoInfractor?.nombre || "No registrado"}</td>
                  <td>{den.presuntoInfractor?.documento || "No registrado"}</td>
                  <td>{den.ciudad || "Sogamoso"}</td>
                  <td style={{ maxWidth: "350px", wordBreak: "break-word" }}>
                    {den.descripcion || "Sin descripción"}
                  </td>
                  <td>{den.fechaCaso || "—"}</td>
                  <td>
                    <span className={`estado-badge ${claseEstado(den.estado)}`}>
                      {den.estado}
                    </span>
                  </td>
                  <td>
                    <span className={`riesgo-badge ${claseRiesgo(den.prioridad)}`}>
                      {den.prioridad}
                    </span>
                  </td>
                  <td className="acciones-cell">
                    <button className="btn-detalle" onClick={() => abrirModal(den)}>Ver detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE DETALLES */}
      {modalAbierto && denunciaSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">⚖️</span>
              <h2>Detalle de la denuncia</h2>
              <button className="modal-cerrar" onClick={cerrarModal}>✖</button>
            </div>
            <div className="modal-body">
              <div className="detalle-seccion">
                <h3><span>🐾</span> Animal y maltrato</h3>
                <div className="detalle-grid">
                  <div><strong>Tipo de animal:</strong> {denunciaSeleccionada.tipoAnimal || "—"}</div>
                  <div><strong>Tipo de maltrato:</strong> {denunciaSeleccionada.tipoMaltrato || "—"}</div>
                  <div><strong>Descripción:</strong> {denunciaSeleccionada.descripcion || "Sin descripción"}</div>
                  <div><strong>Fecha del caso:</strong> {denunciaSeleccionada.fechaCaso || "—"}</div>
                  <div><strong>Ubicación:</strong> {denunciaSeleccionada.ubicacion || denunciaSeleccionada.direccion || "—"}</div>
                  <div><strong>Ciudad:</strong> {denunciaSeleccionada.ciudad || "Sogamoso"}</div>
                </div>
              </div>
              <div className="detalle-seccion">
                <h3><span>👤</span> Presunto infractor</h3>
                <div className="detalle-grid">
                  <div><strong>Nombre:</strong> {denunciaSeleccionada.presuntoInfractor?.nombre || "No registrado"}</div>
                  <div><strong>Documento:</strong> {denunciaSeleccionada.presuntoInfractor?.documento || "No registrado"}</div>
                  <div><strong>Ciudad:</strong> {denunciaSeleccionada.presuntoInfractor?.ciudad || "No registrada"}</div>
                  <div><strong>Dirección:</strong> {denunciaSeleccionada.presuntoInfractor?.direccion || "No registrada"}</div>
                  <div><strong>Teléfono:</strong> {denunciaSeleccionada.presuntoInfractor?.telefono || "No registrado"}</div>
                  <div><strong>Correo:</strong> {denunciaSeleccionada.presuntoInfractor?.correo || "No registrado"}</div>
                </div>
              </div>
              <div className="detalle-seccion">
                <h3><span>👮</span> Denunciante</h3>
                <div className="detalle-grid">
                  <div><strong>Nombre:</strong> {denunciaSeleccionada.denuncianteNombre || "Anónimo"}</div>
                  <div><strong>Correo:</strong> {denunciaSeleccionada.denuncianteEmail || "No registrado"}</div>
                  <div><strong>Teléfono:</strong> {denunciaSeleccionada.denuncianteTelefono || "No registrado"}</div>
                </div>
              </div>
              {denunciaSeleccionada.evidencias?.length > 0 && (
                <div className="detalle-seccion">
                  <h3><span>📎</span> Evidencias</h3>
                  <div className="evidencias-lista">
                    {denunciaSeleccionada.evidencias.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">Ver evidencia {idx + 1}</a>
                    ))}
                  </div>
                </div>
              )}
              <div className="detalle-seccion">
                <h3><span>📌</span> Estado y prioridad</h3>
                <div className="detalle-grid">
                  <div><strong>Estado:</strong> <span className={`estado-badge ${claseEstado(denunciaSeleccionada.estado)}`}>{denunciaSeleccionada.estado}</span></div>
                  <div><strong>Prioridad:</strong> <span className={`riesgo-badge ${claseRiesgo(denunciaSeleccionada.prioridad)}`}>{denunciaSeleccionada.prioridad}</span></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cerrar-modal" onClick={cerrarModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistroPublico;