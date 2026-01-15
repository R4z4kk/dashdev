import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Server,
  GitBranch,
  Settings as SettingsIcon,
  Shield,
  Rocket,
  HardDrive
} from 'lucide-react'
import { cn } from '../lib/utils'

export function Sidebar() {
  const location = useLocation()

  const items = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'SSH Keys', icon: Shield, path: '/ssh-keys' },
    { name: 'Network Scanning', icon: Server, path: '/scan' },
    { name: 'My Servers', icon: HardDrive, path: '/servers' },
    { name: 'Repositories', icon: GitBranch, path: '/repos' },
    { name: 'Deployments', icon: Rocket, path: '/deployments' },
    { name: 'Settings', icon: SettingsIcon, path: '/settings' }
  ]

  return (
    <div className="w-64 border-r bg-card h-screen p-4 flex flex-col">
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'hover:bg-accent hover:text-accent-foreground text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
