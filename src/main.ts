import * as path from 'path'
import * as vscode from 'vscode'
import { ActionButton } from './types'
import { refreshCommand } from './constants'
import { interpolateCommand, buildConfigFromPackageJson } from './util'

const registerCommand = vscode.commands.registerCommand
const disposables = []

export const bootstrap = async (context: vscode.ExtensionContext) => {
  disposables.forEach((btn) => btn.dispose())

  const config = vscode.workspace.getConfiguration('actionButtons')
  const defaultColor = config.get<string>('defaultColor') || 'white'
  const reloadButton = config.get<string>('reloadButton')
  const useScripts = config.get<boolean>('useScripts') !== false
  const npmClient = config.get<string>('npmClient') || 'npm'
  const monorepo = config.get<boolean>('monorepo') !== false
  const manualCommands = config.get<ActionButton[]>('commands')
  const commands = []

  watchConfigurationChange(context)

  if (monorepo) {
    watchActiveTextEditorChange(context)
  }

  if (reloadButton !== null) {
    renderButton({
      name: reloadButton || '↻',
      color: defaultColor,
      command: refreshCommand.title,
      vsCommand: refreshCommand.command,
    })
  }

  if (manualCommands && manualCommands.length) {
    commands.push(...manualCommands)
  }

  if (useScripts) {
    commands.push(
      ...(await buildConfigFromPackageJson(monorepo, npmClient, defaultColor))
    )
  }

  console.log(commands)

  if (commands.length) {
    const terminals: { [name: string]: vscode.Terminal } = {}
    commands.forEach(
      ({ cwd, command, name, color, singleInstance }: ActionButton) => {
        const vsCommand = `extension.${name.replace(' ', '')}`

        const disposable = registerCommand(vsCommand, async () => {
          const vars = {
            // - the path of the folder opened in VS Code
            workspaceFolder: vscode.workspace.rootPath,

            // - the name of the folder opened in VS Code without any slashes (/)
            workspaceFolderBasename: vscode.workspace.rootPath
              ? path.basename(vscode.workspace.rootPath)
              : null,

            // - the current opened file
            file: vscode.window.activeTextEditor
              ? vscode.window.activeTextEditor.document.fileName
              : null,

            // - the current opened file relative to workspaceFolder
            relativeFile:
              vscode.window.activeTextEditor && vscode.workspace.rootPath
                ? path.relative(
                    vscode.workspace.rootPath,
                    vscode.window.activeTextEditor.document.fileName
                  )
                : null,

            // - the current opened file's basename
            fileBasename: vscode.window.activeTextEditor
              ? path.basename(vscode.window.activeTextEditor.document.fileName)
              : null,

            // - the current opened file's basename with no file extension
            fileBasenameNoExtension: vscode.window.activeTextEditor
              ? path.parse(
                  path.basename(
                    vscode.window.activeTextEditor.document.fileName
                  )
                ).name
              : null,

            // - the current opened file's dirname
            fileDirname: vscode.window.activeTextEditor
              ? path.dirname(vscode.window.activeTextEditor.document.fileName)
              : null,

            // - the current opened file's extension
            fileExtname: vscode.window.activeTextEditor
              ? path.parse(
                  path.basename(
                    vscode.window.activeTextEditor.document.fileName
                  )
                ).ext
              : null,

            // - the task runner's current working directory on startup
            cwd: cwd || vscode.workspace.rootPath || require('os').homedir(),

            //- the current selected line number in the active file
            lineNumber: vscode.window.activeTextEditor
              ? vscode.window.activeTextEditor.selection.active.line + 1
              : null,

            // - the current selected text in the active file
            selectedText: vscode.window.activeTextEditor
              ? vscode.window.activeTextEditor.document.getText(
                  vscode.window.activeTextEditor.selection
                )
              : null,

            // - the path to the running VS Code executable
            execPath: process.execPath,
          }

          const assocTerminal = terminals[vsCommand]
          if (!assocTerminal) {
            const terminal = vscode.window.createTerminal({
              name,
              cwd: vars.cwd,
            })
            terminal.show(true)
            terminals[vsCommand] = terminal
            terminal.sendText(interpolateCommand(command, vars))
          } else {
            if (singleInstance) {
              delete terminals[vsCommand]
              assocTerminal.dispose()
              const terminal = vscode.window.createTerminal({
                name,
                cwd: vars.cwd,
              })
              terminal.show(true)
              terminal.sendText(interpolateCommand(command, vars))
              terminals[vsCommand] = terminal
            } else {
              assocTerminal.show()
              assocTerminal.sendText('clear')
              assocTerminal.sendText(interpolateCommand(command, vars))
            }
          }
        })

        context.subscriptions.push(disposable)

        disposables.push(disposable)

        renderButton({
          vsCommand,
          command,
          name,
          color: color || defaultColor,
        })
      }
    )
  } else {
    vscode.window.setStatusBarMessage(
      'VsCode Action Buttons: You have no run commands.',
      4000
    )
  }
}

function watchConfigurationChange(context: vscode.ExtensionContext) {
  const onConfigurationChanged = vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration('actionButtons')) {
        vscode.commands.executeCommand(refreshCommand.command)
      }
    }
  )
  context.subscriptions.push(onConfigurationChanged)
  disposables.push(onConfigurationChanged)
}

function watchActiveTextEditorChange(context: vscode.ExtensionContext) {
  const onConfigurationChanged = vscode.window.onDidChangeActiveTextEditor(
    (e) => {
      vscode.commands.executeCommand(refreshCommand.command)
    }
  )
  context.subscriptions.push(onConfigurationChanged)
  disposables.push(onConfigurationChanged)
}

function renderButton({ command, name, color, vsCommand }: ActionButton) {
  const btn = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0
  )

  btn.text = name
  btn.color = color || 'white'
  btn.tooltip = command

  btn.command = vsCommand
  btn.show()
  disposables.push(btn)
}
