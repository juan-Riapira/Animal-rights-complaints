import { useState } from "react"
import { getFirestore, collection, addDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import app from "../firebase/config"
import "../Denuncia.css"

const db = getFirestore(app)
const auth = getAuth(app)

const PASOS = ["Caso", "Infractor", "Evidencias"]

const tiposMaltratoBase = [
  "Golpes o agresión física",
  "Desnutrición",
  "Abandono",
  "Encadenamiento excesivo",
  "Sobreexplotación laboral",
  "Falta de atención veterinaria",
  "Condiciones insalubres",
  "Otro",
]

const tiposMaltratoEquino = [
  ...tiposMaltratoBase,
  "Maltrato a equino/zorrero",
]

function Denuncia() {
  const [paso, setPaso] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [errores, setErrores] = useState({})

  const [tipoAnimal, setTipoAnimal] = useState("")
  const [tipoMaltrato, setTipoMaltrato] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fechaCaso, setFechaCaso] = useState("")
  const [zona, setZona] = useState("")
  const [direccion, setDireccion] = useState("")

  const [evidencias, setEvidencias] = useState([""])

  const [nombreInfractor, setNombreInfractor] = useState("")
  const [direccionInfractor, setDireccionInfractor] = useState("")
  const [descripcionInfractor, setDescripcionInfractor] = useState("")

  const [descripcionVehiculo, setDescripcionVehiculo] = useState("")
  const [zonaHabitual, setZonaHabitual] = useState("")
  const [condicionAnimal, setCondicionAnimal] = useState("")

  const fechaHoy = new Date().toISOString().split("T")[0]
  const esEquino = tipoAnimal === "Caballo"

  const agregarEvidencia = () => setEvidencias([...evidencias, ""])

  const cambiarEvidencia = (i, v) => {
    const arr = [...evidencias]
    arr[i] = v
    setEvidencias(arr)
  }

  const eliminarEvidencia = (i) => {
    const arr = evidencias.filter((_, idx) => idx !== i)
    setEvidencias(arr.length ? arr : [""])
  }

  const cambiarTipoAnimal = (valor) => {
    setTipoAnimal(valor)
    if (valor !== "Caballo" && tipoMaltrato === "Maltrato a equino/zorrero") {
      setTipoMaltrato("")
    }
    if (valor !== "Caballo") {
      setDescripcionVehiculo("")
      setZonaHabitual("")
      setCondicionAnimal("")
    }
  }

  const validar = () => {
    const e = {}

    if (paso === 0) {
      if (!tipoAnimal) e.tipoAnimal = "Selecciona un tipo de animal"
      if (!tipoMaltrato) e.tipoMaltrato = "Selecciona el tipo de maltrato"
      if (!descripcion.trim()) e.descripcion = "Describe el caso"
      if (!fechaCaso) e.fechaCaso = "Indica la fecha"
      if (fechaCaso && fechaCaso > fechaHoy) e.fechaCaso = "La fecha no puede ser futura"
      if (!zona) e.zona = "Selecciona la zona"
      if (!direccion.trim()) e.direccion = "Ingresa la dirección"
    }

    setErrores(e)
    return Object.keys(e).length === 0
  }

  const siguiente = () => {
    if (validar()) setPaso((p) => p + 1)
  }

  const anterior = () => {
    setErrores({})
    setPaso((p) => p - 1)
  }

  const limpiarFormulario = () => {
    setPaso(0)
    setTipoAnimal("")
    setTipoMaltrato("")
    setDescripcion("")
    setFechaCaso("")
    setZona("")
    setDireccion("")
    setEvidencias([""])
    setNombreInfractor("")
    setDireccionInfractor("")
    setDescripcionInfractor("")
    setDescripcionVehiculo("")
    setZonaHabitual("")
    setCondicionAnimal("")
  }

  const handleSubmit = async () => {
    const user = auth.currentUser
    setEnviando(true)

    try {
      await addDoc(collection(db, "denuncias"), {
        denuncianteId: user?.uid ?? null,
        denuncianteEmail: user?.email ?? null,

        tipoAnimal,
        tipoMaltrato,
        descripcion,
        fechaCaso,

        departamento: "Boyacá",
        ciudad: "Sogamoso",
        zona,
        direccion,

        evidencias: evidencias.filter((u) => u.trim() !== ""),

        presuntoInfractor: {
          nombre: nombreInfractor,
          direccion: direccionInfractor,
          descripcion: descripcionInfractor,
        },

        esEquino,

        datosEquino: esEquino
          ? { descripcionVehiculo, zonaHabitual, condicionAnimal }
          : null,

        estado: "Recibida",
        prioridad: esEquino ? "Alta" : "Normal",
        creadoEn: new Date(),
      })

      setEnviado(true)
    } catch (err) {
      alert(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="den-page">
        <div className="den-exito">
          <div className="den-exito-check">✓</div>
          <h2>Denuncia registrada</h2>
          <p>Tu reporte fue recibido. Lo revisaremos y te notificaremos sobre su estado.</p>
          <button
            className="den-btn-prim"
            onClick={() => { setEnviado(false); limpiarFormulario() }}
          >
            Nueva denuncia
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="den-page">
      <div className="den-header">
        <span className="den-eyebrow">NatuFauna · Reportes</span>
        <h1>Nueva denuncia</h1>
        <p>Completa los datos del caso. Tu reporte puede salvar una vida.</p>
      </div>

      <div className="den-stepper">
        {PASOS.map((nombre, i) => (
          <div
            key={i}
            className={`den-step ${i === paso ? "activo" : ""} ${i < paso ? "completo" : ""}`}
          >
            <div className="den-step-circulo">
              {i < paso ? "✓" : i + 1}
            </div>
            <span className="den-step-nombre">{nombre}</span>
            {i < PASOS.length - 1 && <div className="den-step-linea" />}
          </div>
        ))}
      </div>

      <div className="den-card">
        {paso === 0 && (
          <div className="den-seccion">
            <div className="den-sec-titulo">
              <span className="den-sec-icono">🐾</span>
              <h2>Información del caso</h2>
            </div>

            <div className="den-fila-2">
              <div className="den-campo">
                <label>Tipo de animal <span className="den-req">*</span></label>
                <select
                  value={tipoAnimal}
                  onChange={(e) => cambiarTipoAnimal(e.target.value)}
                  className={errores.tipoAnimal ? "campo-error" : ""}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Ave">Ave</option>
                  <option value="Caballo">Caballo</option>
                  <option value="Otro">Otro</option>
                </select>
                {errores.tipoAnimal && <span className="den-error-msg">{errores.tipoAnimal}</span>}
              </div>

              <div className="den-campo">
                <label>Tipo de maltrato <span className="den-req">*</span></label>
                <select
                  value={tipoMaltrato}
                  onChange={(e) => setTipoMaltrato(e.target.value)}
                  className={errores.tipoMaltrato ? "campo-error" : ""}
                >
                  <option value="">Seleccionar...</option>
                  {(esEquino ? tiposMaltratoEquino : tiposMaltratoBase).map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                {errores.tipoMaltrato && <span className="den-error-msg">{errores.tipoMaltrato}</span>}
              </div>
            </div>

            <div className="den-fila-2">
              <div className="den-campo">
                <label>Fecha del caso <span className="den-req">*</span></label>
                <input
                  type="date"
                  value={fechaCaso}
                  max={fechaHoy}
                  onChange={(e) => setFechaCaso(e.target.value)}
                  className={errores.fechaCaso ? "campo-error" : ""}
                />
                {errores.fechaCaso && <span className="den-error-msg">{errores.fechaCaso}</span>}
              </div>

              <div className="den-campo">
                <label>Zona <span className="den-req">*</span></label>
                <select
                  value={zona}
                  onChange={(e) => setZona(e.target.value)}
                  className={errores.zona ? "campo-error" : ""}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Zona Urbana">🏙️ Zona Urbana</option>
                  <option value="Campo">🌿 Campo</option>
                </select>
                {errores.zona && <span className="den-error-msg">{errores.zona}</span>}
              </div>
            </div>

            <div className="den-campo">
              <label>Dirección del incidente <span className="den-req">*</span></label>
              <input
                type="text"
                placeholder="Barrio, calle, vereda, referencia..."
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className={errores.direccion ? "campo-error" : ""}
              />
              {errores.direccion && <span className="den-error-msg">{errores.direccion}</span>}
            </div>

            <div className="den-campo">
              <label>Descripción del caso <span className="den-req">*</span></label>
              <textarea
                rows={4}
                placeholder="Describe con detalle lo que observaste..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={errores.descripcion ? "campo-error" : ""}
              />
              {errores.descripcion && <span className="den-error-msg">{errores.descripcion}</span>}
            </div>

            {esEquino && (
              <div className="den-subseccion">
                <h3>Datos equino / zorrero</h3>

                <div className="den-campo">
                  <label>Descripción del vehículo o carreta</label>
                  <input
                    type="text"
                    placeholder="Color, tipo de carreta, placa si aplica..."
                    value={descripcionVehiculo}
                    onChange={(e) => setDescripcionVehiculo(e.target.value)}
                  />
                </div>

                <div className="den-fila-2">
                  <div className="den-campo">
                    <label>Zona o ruta habitual</label>
                    <input
                      type="text"
                      placeholder="Barrio o sector donde transita"
                      value={zonaHabitual}
                      onChange={(e) => setZonaHabitual(e.target.value)}
                    />
                  </div>

                  <div className="den-campo">
                    <label>Condición del animal</label>
                    <textarea
                      rows={2}
                      placeholder="Heridas, desnutrición, sobrecarga..."
                      value={condicionAnimal}
                      onChange={(e) => setCondicionAnimal(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {paso === 1 && (
          <div className="den-seccion">
            <div className="den-sec-titulo">
              <span className="den-sec-icono">👤</span>
              <h2>Presunto infractor</h2>
            </div>

            <p className="den-nota">
              Esta información es opcional. Si no conoces a la persona, puedes dejarla vacía o describirla.
            </p>

            <div className="den-campo">
              <label>Nombre si lo conoce</label>
              <input
                type="text"
                placeholder="Nombre del presunto responsable"
                value={nombreInfractor}
                onChange={(e) => setNombreInfractor(e.target.value)}
              />
            </div>

            <div className="den-campo">
              <label>Dirección aproximada donde vive o se ubica</label>
              <input
                type="text"
                placeholder="Casa, barrio, local, finca, sector..."
                value={direccionInfractor}
                onChange={(e) => setDireccionInfractor(e.target.value)}
              />
            </div>

            <div className="den-campo">
              <label>Descripción física o información adicional</label>
              <textarea
                rows={4}
                placeholder="Ejemplo: características físicas, vehículo, referencias, rutina..."
                value={descripcionInfractor}
                onChange={(e) => setDescripcionInfractor(e.target.value)}
              />
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="den-seccion">
            <div className="den-sec-titulo">
              <span className="den-sec-icono">📎</span>
              <h2>Evidencias</h2>
            </div>

            <p className="den-nota">
              Agrega enlaces a fotos o videos: Google Drive, Imgur, YouTube, etc.
            </p>

            <div className="den-evidencias-lista">
              {evidencias.map((url, i) => (
                <div className="den-evidencia-fila" key={i}>
                  <span className="den-ev-num">{i + 1}</span>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => cambiarEvidencia(i, e.target.value)}
                  />
                  {evidencias.length > 1 && (
                    <button
                      type="button"
                      className="den-btn-eliminar"
                      onClick={() => eliminarEvidencia(i)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="den-btn-agregar" onClick={agregarEvidencia}>
              + Agregar enlace
            </button>

            <div className="den-resumen">
              <h3>Resumen del reporte</h3>

              <div className="den-resumen-grid">
                <div>
                  <span>Animal</span>
                  <strong>{tipoAnimal || "—"}</strong>
                </div>
                <div>
                  <span>Maltrato</span>
                  <strong>{tipoMaltrato || "—"}</strong>
                </div>
                <div>
                  <span>Fecha</span>
                  <strong>{fechaCaso || "—"}</strong>
                </div>
                <div>
                  <span>Zona</span>
                  <strong>{zona || "—"}</strong>
                </div>
                <div>
                  <span>Dirección</span>
                  <strong>{direccion || "—"}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="den-nav">
          {paso > 0 ? (
            <button type="button" className="den-btn-sec" onClick={anterior}>
              ← Anterior
            </button>
          ) : (
            <div />
          )}

          {paso < PASOS.length - 1 ? (
            <button type="button" className="den-btn-prim" onClick={siguiente}>
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              className="den-btn-prim"
              onClick={handleSubmit}
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Registrar denuncia"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Denuncia