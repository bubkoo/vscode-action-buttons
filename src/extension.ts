import * as vscode from 'vscode'
import { bootstrap } from './main'
import { refreshCommand } from './constants'

export function activate(context: vscode.ExtensionContext) {
  bootstrap(context)

  const disposable = vscode.commands.registerCommand(
    refreshCommand.command,
    () => bootstrap(context)
  )

  context.subscriptions.push(disposable)
}

export function deactivate() {}
