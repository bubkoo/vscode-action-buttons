# VSCode Action Buttons

> A vscode plugin to append action buttons in the status bar. Actions can be loaded scripts from `package.json` or custom defined.

- Auto load `scripts` actions from `package.json` when `useScripts` is `true`.
- Auto detect monorepo change when `monorepo` option is `true`.
- Support custom defined actions.

## Features

- Auto load scripts from package.json

You can define a custom action to build a rust project like so.

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
