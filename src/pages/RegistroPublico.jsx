import { useEffect, useState } from "react"

import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore"

import app from "../firebase/config"
import "../Registro.css"

const db = getFirestore(app)

function RegistroPublico() {
  const [infractores, setInfractores] = useState([])
  const [busqueda, setBusqueda] = useState("")

  const obtenerInfractores = async () => {
    const querySnapshot = await getDocs(
      collection(db, "registroInfractores")
    )

    const lista = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    setInfractores(lista)
  }

  useEffect(() => {
    obtenerInfractores()
  }, [])

  const infractoresFiltrados = infractores.filter((infractor) => {
    const textoBusqueda = busqueda.toLowerCase()

    return (
      infractor.nombre?.toLowerCase().includes(textoBusqueda) ||
      infractor.documento?.toLowerCase().includes(textoBusqueda) ||
      infractor.ciudad?.toLowerCase().includes(textoBusqueda)
    )
  })

  const claseRiesgo = (riesgo) => {
    if (riesgo === "Alto") return "riesgo-alto"
    if (riesgo === "Medio") return "riesgo-medio"
    return "riesgo-bajo"
  }

  return (
    <div className="registro-publico-page">
      <div className="registro-header">
        <h1>🚨 Registro Público de Infractores</h1>
        <p>
          Consulta personas registradas por casos validados de maltrato animal.
        </p>
      </div>

      <div className="buscador-card">
        <input
          type="text"
          placeholder="Buscar por nombre, documento o ciudad..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="table-card">
        <h2>Listado de infractores</h2>

        {infractoresFiltrados.length === 0 ? (
          <p>No se encontraron registros.</p>
        ) : (
          <table className="denuncias-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Ciudad</th>
                <th>Tipo de maltrato</th>
                <th>Denuncias</th>
                <th>Último caso</th>
                <th>Estado</th>
                <th>Riesgo</th>
              </tr>
            </thead>

            <tbody>
              {infractoresFiltrados.map((infractor) => (
                <tr key={infractor.id}>
                  <td>{infractor.nombre}</td>
                  <td>{infractor.documento}</td>
                  <td>{infractor.ciudad}</td>
                  <td>{infractor.tipoMaltrato}</td>
                  <td>{infractor.denuncias}</td>
                  <td>{infractor.ultimoCaso}</td>
                  <td>
                    <span className="estado-badge estado-validada">
                      {infractor.estado}
                    </span>
                  </td>
                  <td>
                    <span className={`riesgo-badge ${claseRiesgo(infractor.nivelRiesgo)}`}>
                      {infractor.nivelRiesgo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default RegistroPublico