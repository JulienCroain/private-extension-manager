const vscode = require('vscode')

function installExtension(extension) {
    vscode.commands.executeCommand("installVSIX.install", {
        fsPath: extension.path
    })
}

module.exports = function({context}) {
    context.subscriptions.push(vscode.commands.registerCommand('privateExtensionManager.installExtension', installExtension))

    context.subscriptions.push(vscode.commands.registerCommand('privateExtensionManager.updateExtension', installExtension))
}