export interface ServerMetrics {
  cpu: {
    usage: number
    loadAvg: [number, number, number]
  }
  ram: {
    total: number
    used: number
    free: number
    cached: number
    swapTotal: number
    swapUsed: number
  }
  disk: {
    total: string
    used: string
    free: string
    usagePercent: number
    inodesTotal: string
    inodesUsed: string
    inodesFree: string
    inodesPercent: number
  }
  network: {
    rxBytes: number
    txBytes: number
    connections: number
  }
  system: {
    uptime: string
    failedSSH: number
  }
  io: {
    read: number // KB/s (approx)
    write: number // KB/s (approx)
  }
}

export const fetchServerMetrics = async (server: {
  host: string
  port: string
  username: string
  keyName: string
}): Promise<ServerMetrics> => {
  // Command Chaining for efficiency
  // 1. CPU Load & Usage: top -bn1 | grep "Cpu(s)" && cat /proc/loadavg
  // 2. Memory: free -m
  // 3. Disk: df -h / && df -i / (inodes)
  // 4. Network: cat /proc/net/dev
  // 5. Uptime: uptime -p
  // 6. Connections: netstat -an | grep ESTABLISHED | wc -l (or ss -s)
  // 7. Disk IO: vmstat 1 2 (take second line)

  // Constructing a single complex command is faster but harder to parse.
  // We'll execute a script or a chained command.

  const cmd = `
    export LC_ALL=C
    echo "---CPU---"
    top -bn1 | grep "Cpu(s)"
    cat /proc/loadavg
    echo "---RAM---"
    free -m
    echo "---DISK---"
    df -h / --output=size,used,avail,pcent | tail -n1
    df -i / --output=itotal,iused,iavail,ipcent | tail -n1
    echo "---NET---"
    cat /proc/net/dev | grep eth0 || cat /proc/net/dev | grep enp || cat /proc/net/dev | grep ens
    echo "---CONN---"
    ss -s | grep "estab" || netstat -an | grep ESTABLISHED | wc -l
    echo "---UPTIME---"
    uptime -p
    echo "---IO---"
    vmstat 1 2 | tail -n1
    echo "---END---"
  `

  // Execute SSH command
  const output = await window.api.ssh.exec(
    server.host,
    server.port,
    server.username,
    server.keyName,
    cmd
  )

  if (!output.includes('---END---')) {
    throw new Error('Incomplete metrics output or SSH error: ' + output)
  }

  return parseMetrics(output)
}

function parseMetrics(output: string): ServerMetrics {
  const sections = output.split('---')
  const metrics: ServerMetrics = {
    cpu: { usage: 0, loadAvg: [0, 0, 0] },
    ram: { total: 0, used: 0, free: 0, cached: 0, swapTotal: 0, swapUsed: 0 },
    disk: {
      total: '',
      used: '',
      free: '',
      usagePercent: 0,
      inodesTotal: '',
      inodesUsed: '',
      inodesFree: '',
      inodesPercent: 0
    },
    network: { rxBytes: 0, txBytes: 0, connections: 0 },
    system: { uptime: '', failedSSH: 0 },
    io: { read: 0, write: 0 }
  }

  // Helper to find section content
  const getSection = (name: string) => {
    const idx = sections.indexOf(name)
    return idx !== -1 && sections.length > idx + 1 ? sections[idx + 1].trim() : ''
  }

  try {
    // Parse CPU
    // "Content" after ---CPU---
    const cpuContent = getSection('CPU').split('\n')
    if (cpuContent.length >= 2) {
      // Parse Usage (100 - idle)
      const topLine = cpuContent[0]
      const idleMatch = topLine.match(/(\d+\.\d+)\s+id/) || topLine.match(/(\d+)\s+id/)
      if (idleMatch) {
        metrics.cpu.usage = parseFloat((100 - parseFloat(idleMatch[1])).toFixed(1))
      }

      // Parse Load Avg
      const loadParts = cpuContent[1].trim().split(' ')
      if (loadParts.length >= 3) {
        metrics.cpu.loadAvg = [
          parseFloat(loadParts[0]),
          parseFloat(loadParts[1]),
          parseFloat(loadParts[2])
        ]
      }
    }

    // Parse RAM
    //               total        used        free      shared  buff/cache   available
    // Mem:           7950         350        6800           1         800        7300
    // Swap:             0           0           0
    const ramContent = getSection('RAM').split('\n')
    const memLine = ramContent.find((l) => l.startsWith('Mem:'))
    if (memLine) {
      const parts = memLine.split(/\s+/)
      metrics.ram.total = parseInt(parts[1])
      metrics.ram.used = parseInt(parts[2])
      metrics.ram.free = parseInt(parts[3])
      metrics.ram.cached = parseInt(parts[5]) // buff/cache in recent free versions
    }
    const swapLine = ramContent.find((l) => l.startsWith('Swap:'))
    if (swapLine) {
      const parts = swapLine.split(/\s+/)
      metrics.ram.swapTotal = parseInt(parts[1])
      metrics.ram.swapUsed = parseInt(parts[2])
    }

    // Parse Disk
    // 99G   10G   89G  11%
    // 6.3M  150K  6.1M    3%
    const diskContent = getSection('DISK').split('\n')
    if (diskContent.length >= 1) {
      const parts = diskContent[0].trim().split(/\s+/)
      if (parts.length >= 4) {
        metrics.disk.total = parts[0]
        metrics.disk.used = parts[1]
        metrics.disk.free = parts[2]
        metrics.disk.usagePercent = parseInt(parts[3].replace('%', ''))
      }
    }
    // Check if second line exists (inodes)
    if (diskContent.length >= 2 && diskContent[1].trim()) {
      const parts = diskContent[1].trim().split(/\s+/)
      if (parts.length >= 4) {
        metrics.disk.inodesTotal = parts[0]
        metrics.disk.inodesUsed = parts[1]
        metrics.disk.inodesFree = parts[2]
        metrics.disk.inodesPercent = parseInt(parts[3].replace('%', ''))
      }
    }

    // Parse Network
    // Inter-|   Receive                                                |  Transmit
    // face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    //    eth0: 123456 ...
    const netContent = getSection('NET')
    const netMatch = netContent.match(
      /(\w+):\s*(\d+)\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+(\d+)/
    )
    if (netMatch) {
      metrics.network.rxBytes = parseInt(netMatch[2])
      metrics.network.txBytes = parseInt(netMatch[3])
    }

    // Parse Connections
    const connContent = getSection('CONN')
    const connMatch = connContent.match(/(\d+)/)
    if (connMatch) {
      // If ss -s output, we need to parse differently "TCP: 5 (estab 1, closed 0, orphaned 0, synrecv 0, timewait 0/0), ports 0"
      // or "Total: ... est ..."
      // Simple grep estab count
      // If "ss" output, it might be messy. The command was `ss -s | grep "estab" || netstat ...`
      // If ss returns "TCP: ... (estab 1, ...)", we extract 1.
      const estabMatch = connContent.match(/estab\s+(\d+)/)
      if (estabMatch) {
        metrics.network.connections = parseInt(estabMatch[1])
      } else if (connContent.trim().match(/^\d+$/)) {
        metrics.network.connections = parseInt(connContent.trim())
      }
    }

    // Parse Uptime
    metrics.system.uptime = getSection('UPTIME').replace('up ', '')

    // Parse IO
    // r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
    // 0  0      0 123456  12345 123456    0    0     1    12   12   12  0  0 99  0  0
    const ioContent = getSection('IO')
    const ioParts = ioContent.trim().split(/\s+/)
    if (ioParts.length >= 10) {
      // bi (blocks in) and bo (blocks out) are usually columns 8 and 9 (0-indexed) or similar.
      // vmstat columns:
      // procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
      // r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
      // 0  0      0 ...                               0     0
      // We can't rely on column index perfectly without header unless we assume standard vmstat
      // Standard vmstat: bi is col 8, bo is col 9.
      // Note: `vmstat 1 2` output has header line, then 1st sample (avg since boot), then 2nd sample (current).
      // The script returns `tail -n1`, so it's the 2nd sample line.
      // parts should be numbers.
      // If we strictly follow standard vmstat:
      // 0:r 1:b 2:swpd 3:free 4:buff 5:cache 6:si 7:so 8:bi 9:bo
      metrics.io.read = parseInt(ioParts[8]) || 0
      metrics.io.write = parseInt(ioParts[9]) || 0
    }
  } catch (e) {
    console.error('Error parsing metrics:', e)
  }

  return metrics
}
