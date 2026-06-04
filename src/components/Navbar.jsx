import { useEffect, useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "firebase/auth"

import app from "../firebase/config"

const auth = getAuth(app)

function Navbar() {

  const [usuario, setUsuario] = useState(null)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(auth, (user) => {

        setUsuario(user)

      })

    return () => unsubscribe()

  }, [])

  const cerrarSesion = async () => {

    await signOut(auth)

    navigate("/login")

  }

  const esAdmin =
    usuario?.email === "admin.natufauna@gmail.com"

  const isActive = (path) =>
    location.pathname === path
      ? "nb-link active"
      : "nb-link"

  return (

    <nav className="nb">

      <Link to="/" className="nb-logo">

   

        <span className="nb-logo-text">
          NatuFauna
        </span>

      </Link>

      <div className="nb-links">

        <Link
          to="/"
          className={isActive("/")}
        >
          Inicio
        </Link>

        {usuario && (

          <Link
            to={esAdmin ? "/admin" : "/mis-denuncias"}
            className={isActive(
              esAdmin
                ? "/admin"
                : "/mis-denuncias"
            )}
          >
            Mi panel
          </Link>

        )}

       

        <Link
          to="/registro-publico"
          className={isActive("/registro-publico")}
        >
          Registro público
        </Link>

        <Link
          to="/adopciones"
          className={isActive("/adopciones")}
        >
          Adopciones
        </Link>

       

      </div>

      <div className="nb-user">

        {!usuario ? (

          <div className="nb-auth">

            <Link
              to="/login"
              className="nb-auth-link"
            >
              Iniciar sesión
            </Link>

            <Link
              to="/registro"
              className="nb-auth-link primary"
            >
              Registrarse
            </Link>

          </div>

        ) : (

          <>

            <div className="nb-avatar">

              {usuario.email
                .charAt(0)
                .toUpperCase()}

            </div>

            <span className="nb-username">

              {usuario.email
                .split("@")[0]}

            </span>

            <button
              className="nb-btn"
              onClick={cerrarSesion}
            >
              ↪ Salir
            </button>

          </>

        )}

      </div>

    </nav>

  )
}

export default Navbar