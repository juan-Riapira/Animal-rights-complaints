import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"

import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth"

import {
  getFirestore,
  doc,
  setDoc,
} from "firebase/firestore"

import app from "../firebase/config"
import "../Register.css"

const auth = getAuth(app)
const db = getFirestore(app)

function Register() {
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [cargando, setCargando] = useState(false)

  const navigate = useNavigate()

  const fechaHoy = new Date().toISOString().split("T")[0]

  const handleRegister = async (e) => {
    e.preventDefault()

    if (password !== confirmarPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    if (fechaNacimiento > fechaHoy) {
      alert("La fecha de nacimiento no puede ser futura")
      return
    }

    try {
      setCargando(true)

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      const user = userCredential.user

      await setDoc(doc(db, "users", user.uid), {
        nombre,
        telefono,
        fechaNacimiento,
        email,
        rol: "ciudadano",
        createdAt: new Date(),
      })

      // Cerrar sesión inmediatamente para forzar login manual
      await signOut(auth)

      alert("Cuenta creada correctamente. Ahora inicia sesión.")
      navigate("/login")
    } catch (error) {
      alert(error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <section className="register-visual">
          <div className="register-badge">
            🐾 NatuFauna
          </div>

          <h1>
            Únete a una comunidad que protege la vida animal
          </h1>

          <p>
            Crea tu cuenta para denunciar casos de maltrato, publicar animales
            en adopción y apoyar procesos responsables de protección animal.
          </p>

          <div className="register-animal-card">
            <span>🐴</span>
            <div>
              <strong>Protección para todos</strong>
              <p>Equinos, perros, gatos y animales en situación vulnerable.</p>
            </div>
          </div>
        </section>

        <section className="register-card">
          <div className="register-header">
            <h2>Crear cuenta</h2>
            <p>Completa tus datos para comenzar</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="register-field">
              <label>Nombre completo</label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="register-field">
              <label>Teléfono</label>
              <input
                type="text"
                placeholder="Número de contacto"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
              />
            </div>

            <div className="register-field">
              <label>Fecha de nacimiento</label>
              <input
                type="date"
                value={fechaNacimiento}
                max={fechaHoy}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                required
              />
            </div>

            <div className="register-field">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="register-field">
              <label>Contraseña</label>

              <div className="register-password-box">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="Crea una contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />

                <button
                  type="button"
                  className="register-toggle-password"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                >
                  {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="register-field">
              <label>Confirmar contraseña</label>

              <div className="register-password-box">
                <input
                  type={mostrarConfirmacion ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  required
                  minLength={6}
                />

                <button
                  type="button"
                  className="register-toggle-password"
                  onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)}
                >
                  {mostrarConfirmacion ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="register-btn"
              disabled={cargando}
            >
              {cargando ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>

          <div className="register-footer">
            <p>
              ¿Ya tienes cuenta?{" "}
              <Link to="/login">
                Inicia sesión
              </Link>
            </p>

            <Link to="/">
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Register