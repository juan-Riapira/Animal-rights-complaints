import { useState } from "react";
import { useLocation } from "react-router-dom";

import {
  getFirestore,
  collection,
  addDoc,
} from "firebase/firestore";

import {
  getAuth,
} from "firebase/auth";

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

function SolicitarAdopcion() {
  const location = useLocation();
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

  // Función para validar que el teléfono solo contenga dígitos
  const esTelefonoValido = (tel) => /^\d+$/.test(tel);

  // Validar el paso actual
  const validarPaso = () => {
    const nuevosErrores = {};

    if (paso === 0) {
      if (!nombre.trim()) nuevosErrores.nombre = "El nombre completo es obligatorio";
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

  const siguiente = () => {
    if (validarPaso()) {
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

    // Paso 0
    if (!nombre.trim()) nuevosErrores.nombre = "El nombre completo es obligatorio";
    if (!telefono.trim()) nuevosErrores.telefono = "El teléfono es obligatorio";
    else if (!esTelefonoValido(telefono.trim())) nuevosErrores.telefono = "El teléfono solo debe contener números";
    if (!ciudad.trim()) nuevosErrores.ciudad = "La ciudad es obligatoria";
    if (!direccion.trim()) nuevosErrores.direccion = "La dirección es obligatoria";

    // Paso 1
    if (!tipoVivienda) nuevosErrores.tipoVivienda = "Selecciona el tipo de vivienda";

    // Paso 2
    if (!experiencia.trim()) nuevosErrores.experiencia = "Cuéntanos tu experiencia cuidando animales";
    if (!motivo.trim()) nuevosErrores.motivo = "¿Por qué deseas adoptar?";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      // Redirigir al paso correspondiente
      if (!nombre.trim() || !telefono.trim() || !ciudad.trim() || !direccion.trim() || (telefono.trim() && !esTelefonoValido(telefono.trim()))) setPaso(0);
      else if (!tipoVivienda) setPaso(1);
      else if (!experiencia.trim() || !motivo.trim()) setPaso(2);
      return;
    }

    setEnviando(true);
    try {
      const user = auth.currentUser;
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
    } catch (error) {
      alert("Error al enviar la solicitud: " + error.message);
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
                />
                {errores.nombre && <span className="den-error-msg">{errores.nombre}</span>}
              </div>

              <div className="den-campo">
                <label>Teléfono <span className="den-req">*</span></label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={errores.telefono ? "campo-error" : ""}
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
              />
              {errores.motivo && <span className="den-error-msg">{errores.motivo}</span>}
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