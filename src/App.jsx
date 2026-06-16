import { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Nav from './components/Nav'
import LoginPage from './components/LoginPage'
import ApiKeyModal from './components/ApiKeyModal'
import InputPage from './pages/InputPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'

function AppInner() {
  const { user, loading } = useAuth()
  const [apiKeyOpen, setApiKeyOpen] = useState(false)

  if (loading) return (
    <div className="splash">
      <div className="loading-spinner" />
    </div>
  )

  if (!user) return <LoginPage />

  return (
    <>
      <Nav onApiKeyClick={() => setApiKeyOpen(true)} />
      {apiKeyOpen && <ApiKeyModal onClose={() => setApiKeyOpen(false)} />}
      <Routes>
        <Route path="/"        element={<InputPage onApiKeyClick={() => setApiKeyOpen(true)} />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <AppInner />
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
