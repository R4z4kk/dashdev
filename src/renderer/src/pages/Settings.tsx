import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Moon, Sun, Palette } from 'lucide-react'

export function Settings() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [primaryColor, setPrimaryColor] = useState(
    localStorage.getItem('primaryColor') || '210 40% 98%'
  )

  const applySettings = useCallback(() => {
    // Theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)

    // Primary Color
    document.documentElement.style.setProperty('--primary', primaryColor)

    // Calculate foreground color
    // If primary is the default white (dark mode default), use dark text
    // Otherwise (presets), use white text
    const isDefaultWhite = primaryColor === '210 40% 98%'
    const fgColor = isDefaultWhite ? '222.2 47.4% 11.2%' : '210 40% 98%'

    document.documentElement.style.setProperty('--primary-foreground', fgColor)

    localStorage.setItem('primaryColor', primaryColor)
  }, [theme, primaryColor])

  useEffect(() => {
    applySettings()
  }, [applySettings])

  const colorPresets = [
    { name: 'Default Blue', value: '222.2 47.4% 11.2%' },
    { name: 'Emerald', value: '142.1 76.2% 36.3%' },
    { name: 'Rose', value: '346.8 77.2% 49.8%' },
    { name: 'Amber', value: '37.9 92.1% 50.2%' },
    { name: 'Violet', value: '262.1 83.3% 57.8%' }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize how Dashdev looks on your screen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Dark Mode</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Colors
            </CardTitle>
            <CardDescription>Choose your primary accent color</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {colorPresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant={primaryColor === preset.value ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start truncate"
                  onClick={() => setPrimaryColor(preset.value)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: `hsl(${preset.value})` }}
                  />
                  {preset.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
