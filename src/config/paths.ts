import os from 'node:os'
import path from 'node:path'

export function resolveConfigDir(explicit?: string): string {
  if (explicit) return path.resolve(explicit)
  const envDir = process.env.ANI2MAL_CONFIG_DIR
  if (envDir) return path.resolve(envDir)
  if (process.env.XDG_CONFIG_HOME) return path.join(process.env.XDG_CONFIG_HOME, 'ani2mal')
  switch (process.platform) {
    case 'win32':
      return path.join(
        process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'),
        'ani2mal',
      )
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'ani2mal')
    default:
      return path.join(os.homedir(), '.config', 'ani2mal')
  }
}
