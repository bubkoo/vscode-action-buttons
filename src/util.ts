import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { ActionButton } from './types'

export async function getPackageJson(
  detectMonorepo: boolean
): Promise<{ pkg: any; cwd: string } | null> {
  return new Promise((resolve) => {
    try {
      const cwd = vscode.workspace.rootPath

      let cmdCwd: string
      let pkg: any

      if (detectMonorepo) {
        const file = vscode.window.activeTextEditor
          ? vscode.window.activeTextEditor.document.fileName
          : null

        if (file && cwd) {
          const dir = path.dirname(file)
          const relative = path.relative(cwd, dir)
          const parts = relative.split(path.sep)
          while (parts.length) {
            const curr = path.join(cwd, parts.join(path.sep))
            const pkgPath = `${curr}/package.json`
            pkg = fs.existsSync(pkgPath) ? require(pkgPath) : null
            if (pkg) {
              cmdCwd = curr
              break
            } else {
              parts.pop()
            }
          }
        }
      }

      if (!pkg) {
        cmdCwd = cwd
        pkg = require(`${cwd}/package.json`)
      }

      resolve({ pkg, cwd: cmdCwd })
    } catch (e) {
      resolve(null)
    }
  })
}

export async function buildConfigFromPackageJson(
  detectMonorepo: boolean,
  npmClient: string,
  defaultColor: string
) {
  const ret = await getPackageJson(detectMonorepo)
  if (!ret) {
    return []
  }

  const { pkg, cwd } = ret
  const { scripts } = pkg

  return Object.keys(scripts).map((key) => ({
    cwd,
    command: `${npmClient} run ${key}`,
    color: defaultColor,
    name: key,
    singleInstance: true,
  })) as ActionButton[]
}

export function interpolateCommand(command: string, data: object): string {
  let re = /\$\{([^\}]+)\}/g
  let match = re.exec(command)

  while (match) {
    let path = match[1].split('.').reverse()
    let obj = data[path.pop()]
    while (path.length) {
      obj = obj[path.pop()]
    }

    command = command.replace(match[0], obj)
    match = re.exec(command)
  }

  return command
}
