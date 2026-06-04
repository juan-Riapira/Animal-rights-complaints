import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../PublicarAdopcion.css"

import {
  getFirestore,
  collection,
  addDoc,
} from "firebase/firestore"

import { getAuth } from "firebase/auth"

import app from "../firebase/config"

const db = getFirestore(app)
const auth = getAuth(app)

function PublicarAdopcion() {
  const navigate = useNavigate()

  const [nombreAnimal, setNombreAnimal] = useState("")
  const [especie, setEspecie] = useState("")
  const [edad, setEdad] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fotos, setFotos] = useState([""])
  const [vacunado, setVacunado] = useState(false)
  const [esterilizado, setEsterilizado] = useState(false)
  const [socializado, setSocializado] = useState(false)
  const [contacto, setContacto] = useState("")

  const agregarFoto = () => {
    setFotos([...fotos, ""])
  }

  const cambiarFoto = (index, valor) => {
    const nuevasFotos = [...fotos]
    nuevasFotos[index] = valor
    setFotos(nuevasFotos)
  }

  const eliminarFoto = (index) => {
    const nuevasFotos = fotos.filter((_, i) => i !== index)
    setFotos(nuevasFotos.length > 0 ? nuevasFotos : [""])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const usuario = auth.currentUser

    if (!usuario) {
      alert("Debes iniciar sesión para publicar un animal en adopción")
      navigate("/login")
      return
    }

    try {
      await addDoc(collection(db, "adopciones"), {
        creadoPor: usuario.uid,        // ← campo usado para filtrar "Mis adopciones"
        usuarioId: usuario.uid,        // opcional: por compatibilidad
        usuarioEmail: usuario.email,

        nombreAnimal,
        especie,
        edad,
        ciudad,
        descripcion,
        fotos: fotos.filter((foto) => foto.trim() !== ""),
        contacto,

        vacunado,
        esterilizado,
        socializado,                   // ← añadido

        estadoPublicacion: "Pendiente",
        estadoAdopcion: "Disponible",

        creadoEn: new Date(),
      })

      alert("Publicación enviada. Un administrador la revisará.")

      // Limpiar formulario
      setNombreAnimal("")
      setEspecie("")
      setEdad("")
      setCiudad("")
      setDescripcion("")
      setFotos([""])
      setContacto("")
      setVacunado(false)
      setEsterilizado(false)
      setSocializado(false)

      navigate("/adopciones")
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div className="publicar-adopcion-page">
      <div className="publicar-card">
        <h1>🐾 Publicar Animal en Adopción</h1>

        <p>
          Registra la información del animal. La publicación quedará pendiente
          hasta que un administrador la apruebe.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre del animal"
            value={nombreAnimal}
            onChange={(e) => setNombreAnimal(e.target.value)}
            required
          />

          <select
            value={especie}
            onChange={(e) => setEspecie(e.target.value)}
            required
          >
            <option value="">Seleccione especie</option>
            <option value="Perro">Perro</option>
            <option value="Gato">Gato</option>
            <option value="Ave">Ave</option>
            <option value="Conejo">Conejo</option>
            <option value="Otro">Otro</option>
          </select>

          <input
            type="text"
            placeholder="Edad aproximada"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Ciudad"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            required
          />

          <textarea
            placeholder="Descripción del animal"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />

          <h3>Fotos del animal</h3>

          {fotos.map((foto, index) => (
            <div className="foto-row" key={index}>
              <input
                type="url"
                placeholder={`URL foto ${index + 1}`}
                value={foto}
                onChange={(e) => cambiarFoto(index, e.target.value)}
                required={index === 0}
              />

              <button
                type="button"
                className="btn-eliminar-foto"
                onClick={() => eliminarFoto(index)}
              >
                Eliminar
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn-agregar-foto"
            onClick={agregarFoto}
          >
            ➕ Agregar otra foto
          </button>

          <input
            type="text"
            placeholder="Contacto para adopción"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            required
          />

          <div className="checks-adopcion">
            <label>
              <input
                type="checkbox"
                checked={vacunado}
                onChange={(e) => setVacunado(e.target.checked)}
              />
              Vacunado
            </label>

            <label>
              <input
                type="checkbox"
                checked={esterilizado}
                onChange={(e) => setEsterilizado(e.target.checked)}
              />
              Esterilizado
            </label>

            <label>
              <input
                type="checkbox"
                checked={socializado}
                onChange={(e) => setSocializado(e.target.checked)}
              />
              Socializado
            </label>
          </div>

          <button type="submit">
            Enviar publicación
          </button>
        </form>
      </div>
    </div>
  )
}

export default PublicarAdopcion