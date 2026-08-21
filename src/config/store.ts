import { chmod, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ConfigError } from '../lib/errors.js'

function isEnoent(e: unknown): boolean {
  return e instanceof Error && 'code' in e && (e as NodeJS.ErrnoException).code === 'ENOENT'
}

function formatZod(e: unknown): string {
  if (e !== null && typeof e === 'object' && 'issues' in e) {
    const issues = (e as { issues: Array<{ path: (string | number)[]; message: string }> }).issues
    return issues
      .map((iss) => `${iss.path.length > 0 ? `.${iss.path.join('.')}` : ''}: ${iss.message}`)
      .join('; ')
  }
  if (e instanceof Error) return e.message
  return String(e)
}

export class JsonFileStore<T> {
  constructor(
    private dir: string,
    private file: string,
    private schema: { parse: (v: unknown) => T },
  ) {}

  path(): string {
    return path.join(this.dir, this.file)
  }

  async load(): Promise<T | undefined> {
    try {
      const raw = await readFile(this.path(), 'utf8')
      return this.schema.parse(JSON.parse(raw))
    } catch (e) {
      if (isEnoent(e)) return undefined
      if (e instanceof SyntaxError) {
        throw new ConfigError(`Invalid ${this.file}: JSON parse error: ${e.message}`)
      }
      if (e instanceof ConfigError) throw e
      throw new ConfigError(`Invalid ${this.file}: ${formatZod(e)}`)
    }
  }

  async save(value: T): Promise<void> {
    await mkdir(this.dir, { recursive: true })
    const tmp = path.join(this.dir, `.${this.file}.tmp.${process.pid}`)
    await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
    await chmod(tmp, 0o600)
    await rename(tmp, this.path())
  }

  async delete(): Promise<void> {
    try {
      await unlink(this.path())
    } catch (e) {
      if (!isEnoent(e)) throw e
    }
  }
}
