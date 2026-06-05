import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import { getAuth } from "firebase/auth";

import app from "../firebase/config";
import "../Denuncia.css";

const db = getFirestore(app);
const auth = getAuth(app);

const PASOS = [
  "Información",
  "Hogar",
  "Experiencia",
  "Confirmación",
];

// Normalizar texto (minúsculas, sin acentos, sin espacios extras)
const normalizarTexto = (texto) => {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

function SolicitarAdopcion() {
  const location = useLocation();
  const navigate = useNavigate();
  const animal = location.state?.animal;

  const [paso, setPaso] = useState(0);
  const [errores, setErrores] = useState({});

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");

  const [tipoVivienda, setTipoVivienda] = useState("");
  const [tienePatio, setTienePatio] = useState(false);
  const [viveConFamilia, setViveConFamilia] = useState(false);

  const [tieneMascotas, setTieneMascotas] = useState(false);
  const [experiencia, setExperiencia] = useState("");
  const [motivo, setMotivo] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Validación de nombre completo (mínimo 4 palabras, cada una >= 2 letras)
  const validarNombreCompleto = (nombreStr) => {
    const partes = nombreStr.trim().split(/\s+/);
    if (partes.length < 4) {
      return "Debes ingresar nombre completo (mínimo 4 palabras: primer nombre, segundo nombre, primer apellido, segundo apellido)";
    }
    for (let parte of partes) {
      if (parte.length < 2) {
        return "Cada nombre/apellido debe tener al menos 2 caracteres";
      }
    }
    return null;
  };

  // Validar que el teléfono solo tenga dígitos
  const esTelefonoValido = (tel) => /^\d+$/.test(tel);

  // Verificar si el nombre coincide con algún infractor (tabla registroInfractores)
  const verificarNombreInfractor = async (nombreCompleto) => {
    const querySnapshot = await getDocs(collection(db, "registroInfractores"));
    const nombreNormalizado = normalizarTexto(nombreCompleto);
    const palabrasSolicitante = nombreNormalizado.split(/\s+/);

    for (const docInf of querySnapshot.docs) {
      const nombreInfractor = docInf.data().nombre;
      if (!nombreInfractor) continue;
      const nombreInfNormalizado = normalizarTexto(nombreInfractor);
      const palabrasInfractor = nombreInfNormalizado.split(/\s+/);
      
      if (nombreNormalizado === nombreInfNormalizado) return true;
      const palabrasComunes = palabrasSolicitante.filter(p => palabrasInfractor.includes(p));
      if (palabrasComunes.length >= 2) return true; // Ajustado a 2 para mayor sensibilidad
      if (nombreNormalizado.includes(nombreInfNormalizado)) return true;
      if (nombreInfNormalizado.includes(nombreNormalizado)) return true;
    }
    return false;
  };

  // NUEVA FUNCIÓN: Verificar si el nombre aparece en alguna denuncia como presunto infractor o denunciante
  const verificarNombreEnDenuncias = async (nombreCompleto) => {
    const querySnapshot = await getDocs(collection(db, "denuncias"));
    const nombreNormalizado = normalizarTexto(nombreCompleto);
    const palabrasSolicitante = nombreNormalizado.split(/\s+/);

    for (const docDen of querySnapshot.docs) {
      const data = docDen.data();
      // Revisar presuntoInfractor.nombre
      const nombreInfractor = data.presuntoInfractor?.nombre;
      if (nombreInfractor) {
        const nombreInfNormalizado = normalizarTexto(nombreInfractor);
        const palabrasInfractor = nombreInfNormalizado.split(/\s+/);
        if (nombreNormalizado === nombreInfNormalizado) return true;
        const palabrasComunes = palabrasSolicitante.filter(p => palabrasInfractor.includes(p));
        if (palabrasComunes.length >= 2) return true;
        if (nombreNormalizado.includes(nombreInfNormalizado)) return true;
        if (nombreInfNormalizado.includes(nombreNormalizado)) return true;
      }
      // Opcional: también verificar denuncianteNombre (si se quiere bloquear por ser quien denunció)
      const denunciante = data.denuncianteNombre;
      if (denunciante) {
        const denunNormalizado = normalizarTexto(denunciante);
        const palabrasDenun = denunNormalizado.split(/\s+/);
        if (nombreNormalizado === denunNormalizado) return true;
        const palabrasComunes = palabrasSolicitante.filter(p => palabrasDenun.includes(p));
        if (palabrasComunes.length >= 2) return true;
        if (nombreNormalizado.includes(denunNormalizado)) return true;
        if (denunNormalizado.includes(nombreNormalizado)) return true;
      }
    }
    return false;
  };

  // Verificar si el usuario es agresor (documento, correo, nombre en infractores o en denuncias)
  const verificarAgresor = async (usuario) => {
    if (!usuario) return false;
    
    // 1. Por documento
    const userDocRef = doc(db, "users", usuario.uid);
    const userDocSnap = await getDoc(userDocRef);
    let documento = userDocSnap.exists() ? userDocSnap.data().documento : null;
    if (documento) {
      const q = query(collection(db, "registroInfractores"), where("documento", "==", documento));
      const snap = await getDocs(q);
      if (!snap.empty) return true;
    }
    
    // 2. Por correo
    const qEmail = query(collection(db, "registroInfractores"), where("correo", "==", usuario.email));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) return true;
    
    // 3. Por nombre en registroInfractores
    if (await verificarNombreInfractor(nombre)) return true;
    
    // 4. Por nombre en denuncias (nuevo)
    if (await verificarNombreEnDenuncias(nombre)) return true;
    
    return false;
  };

  // Validar paso actual
  const validarPaso = async () => {
    const nuevosErrores = {};

    if (paso === 0) {
      if (!nombre.trim()) nuevosErrores.nombre = "El nombre completo es obligatorio";
      else {
        const errorNombre = validarNombreCompleto(nombre);
        if (errorNombre) nuevosErrores.nombre = errorNombre;
      }
      if (!telefono.trim()) nuevosErrores.telefono = "El teléfono es obligatorio";
      else if (!esTelefonoValido(telefono.trim())) nuevosErrores.telefono = "El teléfono solo debe contener números";
      if (!ciudad.trim()) nuevosErrores.ciudad = "La ciudad es obligatoria";
      if (!direccion.trim()) nuevosErrores.direccion = "La dirección es obligatoria";
    }

    if (paso === 1) {
      if (!tipoVivienda) nuevosErrores.tipoVivienda = "Selecciona el tipo de vivienda";
    }

    if (paso === 2) {
      if (!experiencia.trim()) nuevosErrores.experiencia = "Cuéntanos tu experiencia cuidando animales";
      if (!motivo.trim()) nuevosErrores.motivo = "¿Por qué deseas adoptar?";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const siguiente = async () => {
    if (await validarPaso()) {
      setPaso((prev) => prev + 1);
      setErrores({});
    }
  };

  const anterior = () => {
    setPaso((prev) => prev - 1);
    setErrores({});
  };

  const enviarSolicitud = async () => {
    // Validación completa antes de enviar
    const nuevosErrores = {};
    if (!nombre.trim()) nuevosErrores.nombre = "El nombre completo es obligatorio";
    else {
      const errorNombre = validarNombreCompleto(nombre);
      if (errorNombre) nuevosErrores.nombre = errorNombre;
    }
    if (!telefono.trim()) nuevosErrores.telefono = "El teléfono es obligatorio";
    else if (!esTelefonoValido(telefono.trim())) nuevosErrores.telefono = "El teléfono solo debe contener números";
    if (!ciudad.trim()) nuevosErrores.ciudad = "La ciudad es obligatoria";
    if (!direccion.trim()) nuevosErrores.direccion = "La dirección es obligatoria";
    if (!tipoVivienda) nuevosErrores.tipoVivienda = "Selecciona el tipo de vivienda";
    if (!experiencia.trim()) nuevosErrores.experiencia = "Cuéntanos tu experiencia cuidando animales";
    if (!motivo.trim()) nuevosErrores.motivo = "¿Por qué deseas adoptar?";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      if (!nombre.trim() || !telefono.trim() || !ciudad.trim() || !direccion.trim() || (telefono.trim() && !esTelefonoValido(telefono.trim()))) setPaso(0);
      else if (!tipoVivienda) setPaso(1);
      else if (!experiencia.trim() || !motivo.trim()) setPaso(2);
      return;
    }

    setEnviando(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addToast("Debes iniciar sesión para enviar una solicitud", "error");
        navigate("/login");
        return;
      }

      const esAgresor = await verificarAgresor(user);
      if (esAgresor) {
        addToast(" No se ha podido completar el procedimiento. Tu nombre está asociado a una denuncia o registro de maltrato animal.", "error");
        setEnviando(false);
        return;
      }

      await addDoc(collection(db, "solicitudesAdopcion"), {
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
      });
      setEnviado(true);
      addToast("Solicitud enviada correctamente", "success");
    } catch (error) {
      addToast("Error al enviar la solicitud: " + error.message, "error");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="den-page">
        <div className="den-exito">
          <div className="den-exito-check">✓</div>
          <h2>Solicitud enviada</h2>
          <p>
            Tu solicitud de adopción fue registrada correctamente.
            El equipo de NatuFauna revisará tu información.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="den-page">
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      <div className="den-header">
        <span className="den-eyebrow">NatuFauna · Adopciones</span>
        <h1>Solicitud de adopción</h1>
        <p>Completa el formulario para darle un hogar a esta mascota.</p>
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
            <span className="den-step-nombre">{nombrePaso}</span>
            {i < PASOS.length - 1 && <div className="den-step-linea" />}
          </div>
        ))}
      </div>

      <div className="den-card">
        {/* Paso 0 - Información personal */}
        {paso === 0 && (
          <div className="den-seccion">
            <div className="den-sec-titulo">
              <span className="den-sec-icono">👤</span>
              <h2>Información personal</h2>
            </div>

            <div className="den-fila-2">
              <div className="den-campo">
                <label>Nombre completo <span className="den-req">*</span></label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={errores.nombre ? "campo-error" : ""}
                  placeholder="Ej: Juan Carlos Pérez López"
                />
                {errores.nombre && <span className="den-error-msg">{errores.nombre}</span>}
                <small style={{ fontSize: "10px", color: "#8fa07a" }}>Mínimo 4 palabras (primer nombre, segundo nombre, primer apellido, segundo apellido)</small>
              </div>

              <div className="den-campo">
                <label>Teléfono <span className="den-req">*</span></label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={errores.telefono ? "campo-error" : ""}
                  placeholder="Solo números"
                />
                {errores.telefono && <span className="den-error-msg">{errores.telefono}</span>}
              </div>
            </div>

            <div className="den-fila-2">
              <div className="den-campo">
                <label>Ciudad <span className="den-req">*</span></label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className={errores.ciudad ? "campo-error" : ""}
                />
                {errores.ciudad && <span className="den-error-msg">{errores.ciudad}</span>}
              </div>

              <div className="den-campo">
                <label>Dirección <span className="den-req">*</span></label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className={errores.direccion ? "campo-error" : ""}
                />
                {errores.direccion && <span className="den-error-msg">{errores.direccion}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Paso 1 - Información del hogar */}
        {paso === 1 && (
          <div className="den-seccion">
            <div className="den-sec-titulo">
              <span className="den-sec-icono">🏠</span>
              <h2>Información del hogar</h2>
            </div>

            <div className="den-campo">
              <label>Tipo de vivienda <span className="den-req">*</span></label>
              <select
                value={tipoVivienda}
                onChange={(e) => setTipoVivienda(e.target.value)}
                className={errores.tipoVivienda ? "campo-error" : ""}
              >
                <option value="">Seleccionar</option>
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Finca">Finca</option>
              </select>
              {errores.tipoVivienda && <span className="den-error-msg">{errores.tipoVivienda}</span>}
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

        {/* Paso 2 - Experiencia con mascotas */}
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
              <label>Experiencia cuidando animales <span className="den-req">*</span></label>
              <textarea
                rows={4}
                value={experiencia}
                onChange={(e) => setExperiencia(e.target.value)}
                className={errores.experiencia ? "campo-error" : ""}
                placeholder="Cuéntanos tu experiencia previa (si tienes)"
              />
              {errores.experiencia && <span className="den-error-msg">{errores.experiencia}</span>}
            </div>

            <div className="den-campo">
              <label>¿Por qué deseas adoptar? <span className="den-req">*</span></label>
              <textarea
                rows={4}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className={errores.motivo ? "campo-error" : ""}
                placeholder="Explícanos tu motivación"
              />
              {errores.motivo && <span className="den-error-msg">{errores.motivo}</span>}
            </div>
          </div>
        )}

        {/* Paso 3 - Confirmación */}
        {paso === 3 && (
          <div className="den-seccion">
            <div className="den-sec-titulo">
              <span className="den-sec-icono">✅</span>
              <h2>Confirmación</h2>
            </div>

            <div className="den-resumen">
              <h3>Resumen</h3>
              <div className="den-resumen-grid">
                <div><span>Nombre</span><strong>{nombre}</strong></div>
                <div><span>Ciudad</span><strong>{ciudad}</strong></div>
                <div><span>Animal</span><strong>{animal?.nombreAnimal}</strong></div>
                <div><span>Tipo vivienda</span><strong>{tipoVivienda}</strong></div>
              </div>
            </div>
          </div>
        )}

        <div className="den-nav">
          {paso > 0 ? (
            <button className="den-btn-sec" onClick={anterior}>
              ← Anterior
            </button>
          ) : (
            <div />
          )}

          {paso < PASOS.length - 1 ? (
            <button className="den-btn-prim" onClick={siguiente}>
              Siguiente →
            </button>
          ) : (
            <button
              className="den-btn-prim"
              onClick={enviarSolicitud}
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Enviar solicitud"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SolicitarAdopcion;