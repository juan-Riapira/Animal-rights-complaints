import { Link } from "react-router-dom"
import "../Home.css"

const recentCases = [
  {
    icon: "🐕",
    name: "Perro rescatado en Bogotá",
    location: "Bogotá · hace 2 horas",
    tag: "Urgente",
    tagClass: "tag-warn",
  },
  {
    icon: "🐈",
    name: "Gata en adopción",
    location: "Medellín · hace 5 horas",
    tag: "Adopción",
    tagClass: "tag-ok",
  },
  {
    icon: "🐾",
    name: "Caso validado en Cali",
    location: "Cali · ayer",
    tag: "Resuelto",
    tagClass: "tag-info",
  },
]

function Home() {
  return (
    <div className="home-page">

      {/* HERO FULLSCREEN */}

      <section className="hero-section full-hero">

        <img
          className="hero-bg"
          src="https://cdn.zonebourse.com/static/resize/768/432//images/ImagesTagged/zbimg_8634_800.png"
          alt="Animal protegido"
        />

        <div className="hero-overlay"></div>

        <div className="hero-content-full">

          <span className="hero-badge">
            🐾 Protección animal en Colombia
          </span>

          <h2>
            Los animales también sienten,
            aman y merecen protección
          </h2>

          <p>
            NatuFauna conecta denuncias, rescates y adopciones
            para construir un país más consciente y responsable
            con la vida animal.
          </p>

          <div className="hero-buttons">

            <Link
              to="/denuncia"
              className="btn-primary"
            >
              🚨 Reportar maltrato
            </Link>

            <Link
              to="/adopciones"
              className="btn-secondary"
            >
              🐾 Adoptar un animal
            </Link>

          </div>

        </div>

      </section>

      {/* STATS */}

      <section className="stats-strip">

        <div className="stat-block">
          <div className="stat-num">+250</div>
          <div className="stat-label">
            Denuncias registradas
          </div>
        </div>

        <div className="stat-block">
          <div className="stat-num">+80</div>
          <div className="stat-label">
            Animales rescatados
          </div>
        </div>

        <div className="stat-block">
          <div className="stat-num">+45</div>
          <div className="stat-label">
            Adopciones exitosas
          </div>
        </div>

      </section>

      {/* IMPORTANCIA */}

      <section className="importance-section">

        <div className="importance-content">

          <div className="importance-text">

            <span className="section-eyebrow">
              Conciencia animal
            </span>

            <h2>
              ¿Por qué es importante proteger a los animales?
            </h2>

            <p>
              Los animales son seres sintientes que cumplen un papel esencial
              en el equilibrio ambiental y emocional de nuestra sociedad.
            </p>

            <div className="importance-list">

              <div className="importance-item">
                ❤️ Evitar el sufrimiento y abandono animal
              </div>

              <div className="importance-item">
                🌎 Proteger el equilibrio de los ecosistemas
              </div>

              <div className="importance-item">
                🐾 Promover adopciones responsables
              </div>

              <div className="importance-item">
                👨‍👩‍👧 Educar comunidades más conscientes
              </div>

            </div>

          </div>

          <div className="importance-image">

            <img
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&q=80"
              alt="Animal protegido"
            />

          </div>

        </div>

      </section>

      {/* FEATURES */}

      <section className="features-section">

        <div className="section-header">

          <p className="section-eyebrow">
            Funcionalidades
          </p>

          <h2>
            ¿Qué puedes hacer en NatuFauna?
          </h2>

          <p className="section-sub">
            Herramientas diseñadas para proteger y conectar.
          </p>

        </div>

        <div className="features-grid">

          <div className="feature-card c1">

            <div className="feature-icon">
              🚨
            </div>

            <h3>Denuncias</h3>

            <p>
              Reporta casos de maltrato con evidencias y seguimiento.
            </p>

            <Link
              to="/denuncia"
              className="feat-link"
            >
              Reportar caso →
            </Link>

          </div>

          <div className="feature-card c2">

            <div className="feature-icon">
              🐾
            </div>

            <h3>Adopciones</h3>

            <p>
              Encuentra animales que buscan una segunda oportunidad.
            </p>

            <Link
              to="/adopciones"
              className="feat-link"
            >
              Explorar animales →
            </Link>

          </div>

          <div className="feature-card c3">

            <div className="feature-icon">
              🛡️
            </div>

            <h3>Registro público</h3>

            <p>
              Consulta infractores registrados en casos validados.
            </p>

            <Link
              to="/registro-publico"
              className="feat-link"
            >
              Consultar →
            </Link>

          </div>

        </div>

      </section>

      {/* BOTTOM */}

      <section className="bottom-split">

        <div className="cta-card">

          <div>

            <h2>
              Cada denuncia puede salvar una vida
            </h2>

            <p>
              Únete a la comunidad que está cambiando la realidad
              de los animales en Colombia.
            </p>

          </div>

          <Link
            to="/registro"
            className="cta-btn"
          >
            Crear cuenta gratis
          </Link>

        </div>

        <div className="urgency-card">

          <h3>Casos recientes</h3>

          <ul className="urgency-list">

            {recentCases.map((c, i) => (

              <li className="urgency-item" key={i}>

                <div className="urgency-avatar">
                  {c.icon}
                </div>

                <div className="urgency-info">

                  <div className="urgency-name">
                    {c.name}
                  </div>

                  <div className="urgency-loc">
                    {c.location}
                  </div>

                </div>

                <span className={`tag ${c.tagClass}`}>
                  {c.tag}
                </span>

              </li>

            ))}

          </ul>

        </div>

      </section>

    </div>
  )
}

export default Home