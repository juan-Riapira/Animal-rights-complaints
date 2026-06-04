import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"

import {
  getAuth,
  signInWithEmailAndPassword
} from "firebase/auth"

import app from "../firebase/config"
import "../Login.css"

const auth = getAuth(app)

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [cargando, setCargando] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      setCargando(true)

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      const usuario = userCredential.user

      if (usuario.email === "admin.natufauna@gmail.com") {
        navigate("/admin")
      } else {
        navigate("/")
      }
    } catch (error) {
      alert("Correo o contraseña incorrectos")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-overlay"></div>

      <div className="login-container">
        <section className="login-info">
          <span className="login-badge">
            NatuFauna
          </span>

          <h1>
            Cada denuncia puede salvar una vida
          </h1>

          <p>
            Inicia sesión para reportar casos de maltrato,
            hacer seguimiento a tus denuncias y participar
            en procesos de adopción responsable.
          </p>

          <div className="login-benefits">
            <div>🚨 Denuncia casos de maltrato</div>
            <div>🐾 Consulta adopciones disponibles</div>
            <div>🛡️ Ayuda a proteger a los animales</div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-header">
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa tus datos para continuar</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label>Correo electrónico</label>

              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label>Contraseña</label>

              <div className="password-box">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {mostrarPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              className="login-btn"
              type="submit"
              disabled={cargando}
            >
              {cargando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              ¿No tienes cuenta?{" "}
              <Link to="/registro">
                Regístrate aquí
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

export default Login