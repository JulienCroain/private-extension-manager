const vscode = require('vscode');

module.exports = function({context}) {
    let disposable = vscode.commands.registerCommand('privateExtensionManager.installExtension', function (extension) {
        vscode.commands.executeCommand("installVSIX.install", {
            fsPath: extension.path
        })
	})

    context.subscriptions.push(disposable)
}