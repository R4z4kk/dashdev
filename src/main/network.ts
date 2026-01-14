import { networkInterfaces } from 'os'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Evilscan = require('evilscan')

export class NetworkScanner {
  private getLocalSubnet(): string | null {
    const nets = networkInterfaces()
    // 1. Try to find 192.168.x.x or 10.x.x.x (typical local networks)
    for (const name of Object.keys(nets)) {
      const interfaces = nets[name]
      if (interfaces) {
        for (const net of interfaces) {
          if (net.family === 'IPv4' && !net.internal) {
            if (net.address.startsWith('192.168.') || net.address.startsWith('10.')) {
              const parts = net.address.split('.')
              parts.pop()
              return parts.join('.') + '.0/24'
            }
          }
        }
      }
    }

    // 2. Fallback to any non-internal IPv4
    for (const name of Object.keys(nets)) {
      const interfaces = nets[name]
      if (interfaces) {
        for (const net of interfaces) {
          if (net.family === 'IPv4' && !net.internal) {
            const parts = net.address.split('.')
            parts.pop()
            return parts.join('.') + '.0/24'
          }
        }
      }
    }
    return null
  }

  async scan(port: number = 22): Promise<any[]> {
    const subnet = this.getLocalSubnet()
    if (!subnet) {
      console.warn('No local subnet found')
      return []
    }

    const options = {
      target: subnet,
      port: port.toString(),
      status: 'O', // Open
      banner: true
    }

    return new Promise((resolve, reject) => {
      const scanner = new Evilscan(options)
      const results: any[] = []

      scanner.on('result', (data) => {
        results.push(data)
      })

      scanner.on('error', (err) => {
        console.error('Scan error:', err)
        reject(err)
      })

      scanner.on('done', () => {
        resolve(results)
      })

      scanner.run()
    })
  }
}
