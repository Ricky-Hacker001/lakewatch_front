import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import MapPage from './pages/MapPage'
import ReportPage from './pages/ReportPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: '#060d1a' }}>
        <Navbar />
        <Routes>
          <Route path="/"       element={<MapPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/admin"  element={<AdminPage />} />
          <Route path="/login"  element={<LoginPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
