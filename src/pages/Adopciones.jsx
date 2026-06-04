import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import app from "../firebase/config"
import "../Adopciones.css"
const db = getFirestore(app)

function Adopciones() {
  const [animales, setAnimales] = useState([])
  const [comentarios, setComentarios] = useState({})
  const [inputComentario, setInputComentario] = useState({})
  const [likes, setLikes] = useState({})
  const [expandidos, setExpandidos] = useState({})
  const [filtro, setFiltro] = useState("Todos")

  const obtenerAdopciones = async () => {
    const querySnapshot = await getDocs(collection(db, "adopciones"))
    const lista = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((animal) => animal.estadoPublicacion === "Aprobada")
    setAnimales(lista)

    const comsSnapshot = await getDocs(collection(db, "comentarios_adopcion"))
    const comsMap = {}
    comsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (!comsMap[data.animalId]) comsMap[data.animalId] = []
      comsMap[data.animalId].push({ id: doc.id, ...data })
    })
    setComentarios(comsMap)
  }

  useEffect(() => {
    obtenerAdopciones()
  }, [])

  const toggleLike = (id) => {
    setLikes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleExpandido = (id) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleComentario = async (animalId) => {
    const texto = inputComentario[animalId]?.trim()
    if (!texto) return
    const nuevo = { animalId, texto, fecha: new Date().toISOString(), autor: "Visitante" }
    await addDoc(collection(db, "comentarios_adopcion"), { ...nuevo, fecha: serverTimestamp() })
    setComentarios((prev) => ({
      ...prev,
      [animalId]: [...(prev[animalId] || []), { ...nuevo, id: Date.now().toString() }],
    }))
    setInputComentario((prev) => ({ ...prev, [animalId]: "" }))
  }

  const especies = ["Todos", ...new Set(animales.map((a) => a.especie).filter(Boolean))]
  const animalesFiltrados = filtro === "Todos" ? animales : animales.filter((a) => a.especie === filtro)

  return (
    <div className="adop-page">
      <section className="adop-hero">
        <div className="adop-hero-inner">
          <span className="adop-eyebrow">NatuFauna · Adopciones</span>
          <h1>🏠 Adopta un Amigo</h1>
          <p>Dale un hogar a un animal rescatado. Cada adopción es una segunda oportunidad.</p>
          <Link to="/publicar-adopcion" className="adop-btn-publicar">
            ➕ Publicar animal
          </Link>
        </div>
      </section>

      <div className="adop-layout">
        <aside className="adop-sidebar">
          <div className="adop-sidebar-card">
            <h3>Filtrar por especie</h3>
            <div className="adop-filtros">
              {especies.map((esp) => (
                <button
                  key={esp}
                  className={`adop-filtro-btn${filtro === esp ? " activo" : ""}`}
                  onClick={() => setFiltro(esp)}
                >
                  {esp}
                </button>
              ))}
            </div>
          </div>

          <div className="adop-sidebar-card">
            <h3>📋 Requisitos</h3>
            <ul className="adop-req-lista">
              <li><span>📄</span><div><strong>Documentación</strong><p>Cédula vigente y datos personales.</p></div></li>
              <li><span>🏠</span><div><strong>Espacio Adecuado</strong><p>Lugar seguro para el animal.</p></div></li>
              <li><span>💉</span><div><strong>Compromiso Vet.</strong><p>Vacunas y controles al día.</p></div></li>
              <li><span>❤️</span><div><strong>Responsabilidad</strong><p>Amor y cuidado permanente.</p></div></li>
            </ul>
          </div>

          <div className="adop-sidebar-card adop-proceso">
            <h3>🔄 Proceso</h3>
            <div className="adop-pasos">
              {[["1","Elige","Revisa los animales."],["2","Solicita","Llena el formulario."],["3","Validamos","Revisamos tus datos."],["4","Adopta","¡Llévalo a casa!"]].map(([n, t, d]) => (
                <div key={n} className="adop-paso">
                  <span className="adop-paso-num">{n}</span>
                  <div><strong>{t}</strong><p>{d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="adop-feed">
          {animalesFiltrados.length === 0 ? (
            <div className="adop-vacio">
              <p>No hay animales aprobados para adopción todavía.</p>
            </div>
          ) : (
            animalesFiltrados.map((animal) => {
              const coms = comentarios[animal.id] || []
              const expandido = expandidos[animal.id]
              const likeDado = likes[animal.id]

              return (
                <article className="adop-post" key={animal.id}>
                  <div className="adop-post-header">
                    <div className="adop-avatar">
                      {animal.especie?.[0] || "🐾"}
                    </div>
                    <div className="adop-post-meta">
                      <strong>{animal.nombreAnimal}</strong>
                      <span>{animal.especie} · {animal.ciudad}</span>
                    </div>
                    <span className={`adop-badge${animal.estadoAdopcion === "Disponible" ? " disponible" : " adoptado"}`}>
                      {animal.estadoAdopcion === "Disponible" ? "✅ Disponible" : animal.estadoAdopcion}
                    </span>
                  </div>

                  {animal.fotos?.[0] && (
                    <div className="adop-post-img">
                      <img src={animal.fotos[0]} alt={animal.nombreAnimal} />
                    </div>
                  )}

                  <div className="adop-post-body">
                    <div className="adop-tags">
                      {animal.vacunado && <span className="adop-tag">💉 Vacunado</span>}
                      {animal.esterilizado && <span className="adop-tag">✂️ Esterilizado</span>}
                      {animal.socializado && <span className="adop-tag">🏠 Socializado</span>}
                      <span className="adop-tag adop-tag-edad">{animal.edad}</span>
                    </div>

                    <p className="adop-descripcion">
                      {expandido ? animal.descripcion : `${animal.descripcion?.slice(0, 120)}${animal.descripcion?.length > 120 ? "..." : ""}`}
                    </p>
                    {animal.descripcion?.length > 120 && (
                      <button className="adop-ver-mas" onClick={() => toggleExpandido(animal.id)}>
                        {expandido ? "Ver menos" : "Ver más"}
                      </button>
                    )}

                    {animal.fotos?.length > 1 && (
                      <div className="adop-mini-fotos">
                        {animal.fotos.slice(1).map((foto, i) => (
                          <a key={i} href={foto} target="_blank" rel="noreferrer" className="adop-mini-foto">
                            <img src={foto} alt={`Foto ${i + 2}`} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="adop-post-acciones">
                    <button
                      className={`adop-accion-btn${likeDado ? " liked" : ""}`}
                      onClick={() => toggleLike(animal.id)}
                    >
                      {likeDado ? "❤️" : "🤍"} Me encanta
                    </button>
                    <button className="adop-accion-btn" onClick={() => setExpandidos((prev) => ({ ...prev, [`com_${animal.id}`]: !prev[`com_${animal.id}`] }))}>
                      💬 Comentar ({coms.length})
                    </button>
                    <Link
  to="/solicitar-adopcion"
  state={{ animal }}
  className="adop-accion-btn adop-accion-adoptar"
>
  Solicitar Adopción
</Link>
                  </div>

                  {expandidos[`com_${animal.id}`] && (
                    <div className="adop-comentarios">
                      {coms.length > 0 && (
                        <div className="adop-coms-lista">
                          {coms.map((com) => (
                            <div key={com.id} className="adop-com">
                              <div className="adop-com-avatar">{com.autor?.[0] || "V"}</div>
                              <div className="adop-com-burbuja">
                                <strong>{com.autor || "Visitante"}</strong>
                                <p>{com.texto}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="adop-com-input-fila">
                        <div className="adop-com-avatar">Tú</div>
                        <div className="adop-com-input-wrap">
                          <input
                            type="text"
                            placeholder="Escribe un comentario..."
                            value={inputComentario[animal.id] || ""}
                            onChange={(e) => setInputComentario((prev) => ({ ...prev, [animal.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleComentario(animal.id)}
                          />
                          <button onClick={() => handleComentario(animal.id)}>➤</button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </main>
      </div>

      <section className="adop-cta">
        <h2>🐾 ¿Listo para cambiar una vida?</h2>
        <p>Adoptar es dar amor, protección y una nueva oportunidad.</p>
        <Link to="/publicar-adopcion" className="adop-btn-publicar">Publicar un animal</Link>
      </section>
    </div>
  )
}

export default Adopciones