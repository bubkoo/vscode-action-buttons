# VSCode Action Buttons

> A vscode plugin to append action buttons in the status bar. Actions can be loaded scripts from `package.json` or custom defined.

## Features

- Auto load `scripts` actions from `package.json` when `useScripts` is `true`.
- Auto detect monorepo change when `monorepo` option is `true`.
- Support custom defined actions.

## Configuration

```json
{
    "actionButtons": {
      "reloadButton": null,
      "defaultColor": "white",
      "useScripts": true,
      "npmClient": "npm",
      "monorepo": true,
      "commands": [
        {
          "name": "command name",
          "color": "#af565c",
          "command": "cargo run ${file}",
          "singleInstance": true
        }
      ]
    }
}
```
