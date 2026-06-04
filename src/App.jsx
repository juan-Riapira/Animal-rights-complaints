import { BrowserRouter, Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar"

import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Denuncia from "./pages/Denuncia"
import Admin from "./pages/Admin"
import MisDenuncias from "./pages/MisDenuncias"
import RegistroPublico from "./pages/RegistroPublico"
import Adopciones from "./pages/Adopciones"
import PublicarAdopcion from "./pages/PublicarAdopcion"
import SolicitarAdopcion from "./pages/SolicitarAdopcion"

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/denuncia" element={<Denuncia />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/mis-denuncias" element={<MisDenuncias />} />
        <Route path="/registro-publico" element={<RegistroPublico />} />
        <Route path="/adopciones" element={<Adopciones />} />
        <Route path="/publicar-adopcion" element={<PublicarAdopcion />} />
        <Route path="/solicitar-adopcion" element={<SolicitarAdopcion />}
/>
      </Routes>
    </BrowserRouter>
  )
}

export default App