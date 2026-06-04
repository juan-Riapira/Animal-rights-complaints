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

  const obtenerDenunciasValidadas = async () => {
    // Traer denuncias con estado "Validada" o "Escalada"
    const qValid = query(collection(db, "denuncias"), where("estado", "in", ["Validada", "Escalada"]));
    const snapshot = await getDocs(qValid);
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    // Ordenar por fecha del caso descendente
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default RegistroPublico;