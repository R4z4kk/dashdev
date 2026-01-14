import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { ConsoleDrawer } from './components/ConsoleDrawer'

export function Layout() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark'
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')

    const primaryColor = localStorage.getItem('primaryColor')
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary', primaryColor)
    }
  }, [])

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <main className="flex-1 overflow-auto p-8 pb-12">
          <Outlet />
        </main>
        <ConsoleDrawer />
      </div>
    </div>
  )
}
