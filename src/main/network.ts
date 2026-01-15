import { networkInterfaces } from 'os'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Evilscan = require('evilscan')

export class NetworkScanner {
  getInterfaces(): {
    name: string
    address: string
    family: string
    mac: string
    internal: boolean
    subnet: string
  }[] {
    const nets = networkInterfaces()
    const results: any[] = []

    for (const name of Object.keys(nets)) {
      const interfaces = nets[name]
      if (interfaces) {
        for (const net of interfaces) {
          // Return all IPv4 interfaces so the user can see them
          if (net.family === 'IPv4') {
            const parts = net.address.split('.')
            parts.pop()
            const subnet = parts.join('.') + '.0/24'
            results.push({
              name,
              address: net.address,
              family: net.family,
              mac: net.mac,
              internal: net.internal,
              subnet
            })
          }
        }
      }
    }
    return results
  }

  async scan(target?: string, port: number = 22): Promise<any[]> {
    if (!target) {
      // Fallback to finding a likely candidate if no target provided
      const interfaces = this.getInterfaces()
      const candidate = interfaces.find(
        (i) => !i.internal && (i.address.startsWith('192.168.') || i.address.startsWith('10.'))
      )
      if (candidate) {
        target = candidate.subnet
      } else {
        // Fallback to first non-internal or local
        target = interfaces.find((i) => !i.internal)?.subnet || '127.0.0.1/32'
      }
    }

    const options = {
      target: target,
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
