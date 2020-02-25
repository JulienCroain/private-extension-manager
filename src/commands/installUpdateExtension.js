const vscode = require('vscode')

function installExtension(extension) {
  vscode.commands
    .executeCommand(
      'workbench.extensions.installExtension',
      vscode.Uri.file(extension.path)
    )
    .then(() => {
      vscode.window.showInformationMessage(
        `${extension.label} (${extension.version}) installed.`,
        'Ok'
      )
      vscode.commands.executeCommand('privateExtensionManager.checkForUpdates')
    }, reason => {
      vscode.window.showErrorMessage(
        `${extension.label} (${extension.version}) installation failed.${reason}`,
        'Ok'
      )
    })
}

module.exports = function({ context }) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'privateExtensionManager.installExtension',
      installExtension
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'privateExtensionManager.updateExtension',
      installExtension
    )
  )
}
