import { useState } from "react"
import { useLocation } from "react-router-dom"

import {
  getFirestore,
  collection,
  addDoc,
} from "firebase/firestore"

import {
  getAuth,
} from "firebase/auth"

import app from "../firebase/config"
import "../Denuncia.css"

const db = getFirestore(app)
const auth = getAuth(app)

const PASOS = [
  "Información",
  "Hogar",
  "Experiencia",
  "Confirmación",
]

function SolicitarAdopcion() {

  const location = useLocation()

  const animal = location.state?.animal

  const [paso, setPaso] = useState(0)

  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [direccion, setDireccion] = useState("")

  const [tipoVivienda, setTipoVivienda] = useState("")
  const [tienePatio, setTienePatio] = useState(false)
  const [viveConFamilia, setViveConFamilia] = useState(false)

  const [tieneMascotas, setTieneMascotas] = useState(false)
  const [experiencia, setExperiencia] = useState("")
  const [motivo, setMotivo] = useState("")

  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const siguiente = () => {
    setPaso((prev) => prev + 1)
  }

  const anterior = () => {
    setPaso((prev) => prev - 1)
  }

  const enviarSolicitud = async () => {

    try {

      setEnviando(true)

      const user = auth.currentUser

      await addDoc(
        collection(db, "solicitudesAdopcion"),
        {
          animalId: animal?.id || null,
          nombreAnimal: animal?.nombreAnimal || "",
          solicitanteId: user?.uid || null,
          solicitanteEmail: user?.email || null,

          nombre,
          telefono,
          ciudad,
          direccion,

          tipoVivienda,
          tienePatio,
          viveConFamilia,

          tieneMascotas,
          experiencia,
          motivo,

          estado: "Pendiente",
          creadoEn: new Date(),
        }
      )

      setEnviado(true)

    } catch (error) {

      alert(error.message)

    } finally {

      setEnviando(false)

    }
  }

  if (enviado) {
    return (
      <div className="den-page">
        <div className="den-exito">

          <div className="den-exito-check">
            ✓
          </div>

          <h2>Solicitud enviada</h2>

          <p>
            Tu solicitud de adopción fue registrada correctamente.
            El equipo de NatuFauna revisará tu información.
          </p>

        </div>
      </div>
    )
  }

  return (
    <div className="den-page">

      <div className="den-header">

        <span className="den-eyebrow">
          NatuFauna · Adopciones
        </span>

        <h1>Solicitud de adopción</h1>

        <p>
          Completa el formulario para darle un hogar a esta mascota.
        </p>

      </div>

      <div className="den-stepper">

        {PASOS.map((nombrePaso, i) => (

          <div
            key={i}
            className={`den-step ${i === paso ? "activo" : ""} ${i < paso ? "completo" : ""}`}
          >

            <div className="den-step-circulo">
              {i < paso ? "✓" : i + 1}
            </div>

            <span className="den-step-nombre">
              {nombrePaso}
            </span>

            {i < PASOS.length - 1 && (
              <div className="den-step-linea" />
            )}

          </div>
        ))}

      </div>

      <div className="den-card">

        {paso === 0 && (

          <div className="den-seccion">

            <div className="den-sec-titulo">
              <span className="den-sec-icono">👤</span>
              <h2>Información personal</h2>
            </div>

            <div className="den-fila-2">

              <div className="den-campo">
                <label>Nombre completo</label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="den-campo">
                <label>Teléfono</label>

                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

            </div>

            <div className="den-fila-2">

              <div className="den-campo">
                <label>Ciudad</label>

                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                />
              </div>

              <div className="den-campo">
                <label>Dirección</label>

                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>

            </div>

          </div>
        )}

        {paso === 1 && (

          <div className="den-seccion">

            <div className="den-sec-titulo">
              <span className="den-sec-icono">🏠</span>
              <h2>Información del hogar</h2>
            </div>

            <div className="den-campo">

              <label>Tipo de vivienda</label>

              <select
                value={tipoVivienda}
                onChange={(e) => setTipoVivienda(e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Finca">Finca</option>
              </select>

            </div>

            <div className="checkbox-inline">

              <input
                type="checkbox"
                checked={tienePatio}
                onChange={(e) => setTienePatio(e.target.checked)}
              />

              <span>Tiene patio o espacio amplio</span>

            </div>

            <div className="checkbox-inline">

              <input
                type="checkbox"
                checked={viveConFamilia}
                onChange={(e) => setViveConFamilia(e.target.checked)}
              />

              <span>Vive con familia</span>

            </div>

          </div>
        )}

        {paso === 2 && (

          <div className="den-seccion">

            <div className="den-sec-titulo">
              <span className="den-sec-icono">🐾</span>
              <h2>Experiencia con mascotas</h2>
            </div>

            <div className="checkbox-inline">

              <input
                type="checkbox"
                checked={tieneMascotas}
                onChange={(e) => setTieneMascotas(e.target.checked)}
              />

              <span>Tiene otras mascotas</span>

            </div>

            <div className="den-campo">

              <label>Experiencia cuidando animales</label>

              <textarea
                rows={4}
                value={experiencia}
                onChange={(e) => setExperiencia(e.target.value)}
              />

            </div>

            <div className="den-campo">

              <label>¿Por qué deseas adoptar?</label>

              <textarea
                rows={4}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />

            </div>

          </div>
        )}

        {paso === 3 && (

          <div className="den-seccion">

            <div className="den-sec-titulo">
              <span className="den-sec-icono">✅</span>
              <h2>Confirmación</h2>
            </div>

            <div className="den-resumen">

              <h3>Resumen</h3>

              <div className="den-resumen-grid">

                <div>
                  <span>Nombre</span>
                  <strong>{nombre}</strong>
                </div>

                <div>
                  <span>Ciudad</span>
                  <strong>{ciudad}</strong>
                </div>

                <div>
                  <span>Animal</span>
                  <strong>{animal?.nombreAnimal}</strong>
                </div>

                <div>
                  <span>Tipo vivienda</span>
                  <strong>{tipoVivienda}</strong>
                </div>

              </div>

            </div>

          </div>
        )}

        <div className="den-nav">

          {paso > 0 ? (

            <button
              className="den-btn-sec"
              onClick={anterior}
            >
              ← Anterior
            </button>

          ) : (
            <div />
          )}

          {paso < PASOS.length - 1 ? (

            <button
              className="den-btn-prim"
              onClick={siguiente}
            >
              Siguiente →
            </button>

          ) : (

            <button
              className="den-btn-prim"
              onClick={enviarSolicitud}
              disabled={enviando}
            >
              {enviando
                ? "Enviando..."
                : "Enviar solicitud"}
            </button>

          )}

        </div>

      </div>
    </div>
  )
}

export default SolicitarAdopcion