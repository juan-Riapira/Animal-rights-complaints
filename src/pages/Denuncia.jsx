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
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

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

  const mostrarToast = (message, type = "error") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000)
  }

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

  const validarPasoActual = () => {
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

    if (paso === 1) {
      if (!nombreInfractor.trim()) e.nombreInfractor = "Ingresa el nombre del presunto infractor"
      if (!direccionInfractor.trim()) e.direccionInfractor = "Ingresa la dirección del infractor"
      if (!descripcionInfractor.trim()) e.descripcionInfractor = "Describe al infractor (físico, vehículo, etc.)"
    }

    if (paso === 2) {
      const urlsValidas = evidencias.filter(u => u.trim() !== "")
      if (urlsValidas.length === 0) {
        e.evidencias = "Debes agregar al menos una evidencia (foto o video)"
      }
    }

    setErrores(e)
    return Object.keys(e).length === 0
  }

  const validarCamposObligatorios = () => {
    if (!tipoAnimal) { mostrarToast(" Debes seleccionar el tipo de animal."); return false }
    if (!tipoMaltrato) { mostrarToast(" Debes seleccionar el tipo de maltrato."); return false }
    if (!descripcion.trim()) { mostrarToast(" Debes escribir una descripción del caso."); return false }
    if (!fechaCaso) { mostrarToast(" Debes indicar la fecha del caso."); return false }
    if (fechaCaso && fechaCaso > fechaHoy) { mostrarToast(" La fecha del caso no puede ser futura."); return false }
    if (!zona) { mostrarToast(" Debes seleccionar la zona (Urbana o Campo)."); return false }
    if (!direccion.trim()) { mostrarToast(" Debes ingresar la dirección del incidente."); return false }
    if (!nombreInfractor.trim()) { mostrarToast(" Debes ingresar el nombre del presunto infractor."); return false }
    if (!direccionInfractor.trim()) { mostrarToast(" Debes ingresar la dirección del presunto infractor."); return false }
    if (!descripcionInfractor.trim()) { mostrarToast(" Debes describir al presunto infractor (características, vehículo, etc.)."); return false }
    const urlsValidas = evidencias.filter(u => u.trim() !== "")
    if (urlsValidas.length === 0) { mostrarToast(" Debes agregar al menos una evidencia (enlace a foto o video)."); return false }
    return true
  }

  const siguiente = () => {
    if (validarPasoActual()) setPaso((p) => p + 1)
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
    if (!validarCamposObligatorios()) return

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
        datosEquino: esEquino ? { descripcionVehiculo, zonaHabitual, condicionAnimal } : null,
        estado: "Recibida",
        prioridad: esEquino ? "Alta" : "Normal",
        creadoEn: new Date(),
      })
      setEnviado(true)
    } catch (err) {
      mostrarToast("Error al enviar: " + err.message, "error")
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
          <button className="den-btn-prim" onClick={() => { setEnviado(false); limpiarFormulario() }}>
            Nueva denuncia
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="den-page">
      {/* Toast notification */}
      {toast.show && (
        <div className={`den-toast den-toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button className="den-toast-close" onClick={() => setToast({ show: false, message: "", type: "" })}>✖</button>
        </div>
      )}

      <div className="den-header">
        <span className="den-eyebrow">NatuFauna · Reportes</span>
        <h1>Nueva denuncia</h1>
        <p>Completa los datos del caso. Tu reporte puede salvar una vida.</p>
      </div>

      <div className="den-stepper">
        {PASOS.map((nombre, i) => (
          <div key={i} className={`den-step ${i === paso ? "activo" : ""} ${i < paso ? "completo" : ""}`}>
            <div className="den-step-circulo">{i < paso ? "✓" : i + 1}</div>
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
                <select value={tipoAnimal} onChange={(e) => cambiarTipoAnimal(e.target.value)} className={errores.tipoAnimal ? "campo-error" : ""}>
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
                <select value={tipoMaltrato} onChange={(e) => setTipoMaltrato(e.target.value)} className={errores.tipoMaltrato ? "campo-error" : ""}>
                  <option value="">Seleccionar...</option>
                  {(esEquino ? tiposMaltratoEquino : tiposMaltratoBase).map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                {errores.tipoMaltrato && <span className="den-error-msg">{errores.tipoMaltrato}</span>}
              </div>
            </div>
            {/* Resto del paso 0 igual */}
            <div className="den-fila-2">
              <div className="den-campo">
                <label>Fecha del caso <span className="den-req">*</span></label>
                <input type="date" value={fechaCaso} max={fechaHoy} onChange={(e) => setFechaCaso(e.target.value)} className={errores.fechaCaso ? "campo-error" : ""} />
                {errores.fechaCaso && <span className="den-error-msg">{errores.fechaCaso}</span>}
              </div>
              <div className="den-campo">
                <label>Zona <span className="den-req">*</span></label>
                <select value={zona} onChange={(e) => setZona(e.target.value)} className={errores.zona ? "campo-error" : ""}>
                  <option value="">Seleccionar...</option>
                  <option value="Zona Urbana">🏙️ Zona Urbana</option>
                  <option value="Campo">🌿 Campo</option>
                </select>
                {errores.zona && <span className="den-error-msg">{errores.zona}</span>}
              </div>
            </div>
            <div className="den-campo">
              <label>Dirección del incidente <span className="den-req">*</span></label>
              <input type="text" placeholder="Barrio, calle, vereda, referencia..." value={direccion} onChange={(e) => setDireccion(e.target.value)} className={errores.direccion ? "campo-error" : ""} />
              {errores.direccion && <span className="den-error-msg">{errores.direccion}</span>}
            </div>
            <div className="den-campo">
              <label>Descripción del caso <span className="den-req">*</span></label>
              <textarea rows={4} placeholder="Describe con detalle lo que observaste..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={errores.descripcion ? "campo-error" : ""} />
              {errores.descripcion && <span className="den-error-msg">{errores.descripcion}</span>}
            </div>
            {esEquino && (
              <div className="den-subseccion">
                <h3>Datos equino / zorrero</h3>
                <div className="den-campo">
                  <label>Descripción del vehículo o carreta</label>
                  <input type="text" placeholder="Color, tipo de carreta, placa..." value={descripcionVehiculo} onChange={(e) => setDescripcionVehiculo(e.target.value)} />
                </div>
                <div className="den-fila-2">
                  <div className="den-campo">
                    <label>Zona o ruta habitual</label>
                    <input type="text" placeholder="Barrio o sector" value={zonaHabitual} onChange={(e) => setZonaHabitual(e.target.value)} />
                  </div>
                  <div className="den-campo">
                    <label>Condición del animal</label>
                    <textarea rows={2} placeholder="Heridas, desnutrición..." value={condicionAnimal} onChange={(e) => setCondicionAnimal(e.target.value)} />
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
            <p className="den-nota">Todos los campos son obligatorios para poder procesar la denuncia.</p>
            <div className="den-campo">
              <label>Nombre del infractor <span className="den-req">*</span></label>
              <input type="text" placeholder="Nombre completo" value={nombreInfractor} onChange={(e) => setNombreInfractor(e.target.value)} className={errores.nombreInfractor ? "campo-error" : ""} />
              {errores.nombreInfractor && <span className="den-error-msg">{errores.nombreInfractor}</span>}
            </div>
            <div className="den-campo">
              <label>Dirección aproximada <span className="den-req">*</span></label>
              <input type="text" placeholder="Casa, barrio, local, finca..." value={direccionInfractor} onChange={(e) => setDireccionInfractor(e.target.value)} className={errores.direccionInfractor ? "campo-error" : ""} />
              {errores.direccionInfractor && <span className="den-error-msg">{errores.direccionInfractor}</span>}
            </div>
            <div className="den-campo">
              <label>Descripción física o adicional <span className="den-req">*</span></label>
              <textarea rows={4} placeholder="Características físicas, vehículo, referencias, rutina..." value={descripcionInfractor} onChange={(e) => setDescripcionInfractor(e.target.value)} className={errores.descripcionInfractor ? "campo-error" : ""} />
              {errores.descripcionInfractor && <span className="den-error-msg">{errores.descripcionInfractor}</span>}
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="den-seccion">
            <div className="den-sec-titulo">
              <span className="den-sec-icono">📎</span>
              <h2>Evidencias</h2>
            </div>
            <p className="den-nota">Agrega enlaces a fotos o videos. <strong>Al menos una evidencia es obligatoria.</strong></p>
            <div className="den-evidencias-lista">
              {evidencias.map((url, i) => (
                <div className="den-evidencia-fila" key={i}>
                  <span className="den-ev-num">{i + 1}</span>
                  <input type="url" placeholder="https://..." value={url} onChange={(e) => cambiarEvidencia(i, e.target.value)} />
                  {evidencias.length > 1 && (
                    <button type="button" className="den-btn-eliminar" onClick={() => eliminarEvidencia(i)}>×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="den-btn-agregar" onClick={agregarEvidencia}>+ Agregar enlace</button>
            {errores.evidencias && <span className="den-error-msg" style={{ display: "block", marginTop: "8px" }}>{errores.evidencias}</span>}
            <div className="den-resumen">
              <h3>Resumen del reporte</h3>
              <div className="den-resumen-grid">
                <div><span>Animal</span><strong>{tipoAnimal || "—"}</strong></div>
                <div><span>Maltrato</span><strong>{tipoMaltrato || "—"}</strong></div>
                <div><span>Fecha</span><strong>{fechaCaso || "—"}</strong></div>
                <div><span>Zona</span><strong>{zona || "—"}</strong></div>
                <div><span>Dirección</span><strong>{direccion || "—"}</strong></div>
              </div>
            </div>
          </div>
        )}

        <div className="den-nav">
          {paso > 0 ? <button type="button" className="den-btn-sec" onClick={anterior}>← Anterior</button> : <div />}
          {paso < PASOS.length - 1 ? (
            <button type="button" className="den-btn-prim" onClick={siguiente}>Siguiente →</button>
          ) : (
            <button type="button" className="den-btn-prim" onClick={handleSubmit} disabled={enviando}>
              {enviando ? "Enviando..." : "Registrar denuncia"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Denuncia