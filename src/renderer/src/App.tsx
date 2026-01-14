import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './Layout'
import { Dashboard } from './pages/Dashboard'
import { Servers } from './pages/Servers'
import { Repos } from './pages/Repos'
import { Settings } from './pages/Settings'
import { SSHKeys } from './pages/SSHKeys'
import { NetworkScan } from './pages/NetworkScan'
import { Deployments } from './pages/Deployments'

import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Initial theme setup
    const theme = localStorage.getItem('theme') || 'dark'
    const primaryColor = localStorage.getItem('primaryColor') || '210 40% 98%'

    // Apply dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Apply colors
    document.documentElement.style.setProperty('--primary', primaryColor)

    // Calculate foreground
    const isDefaultWhite = primaryColor === '210 40% 98%'
    const fgColor = isDefaultWhite ? '222.2 47.4% 11.2%' : '210 40% 98%'
    document.documentElement.style.setProperty('--primary-foreground', fgColor)
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="servers" element={<Servers />} />
          <Route path="ssh-keys" element={<SSHKeys />} />
          <Route path="scan" element={<NetworkScan />} />
          <Route path="deployments" element={<Deployments />} />
          <Route path="repos" element={<Repos />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
