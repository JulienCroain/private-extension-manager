const vscode = require('vscode');

module.exports = function(context, provider) {
    let disposable = vscode.commands.registerCommand('privateExtensionManager.checkForUpdates', function () {
        provider.refresh()
	})

    context.subscriptions.push(disposable)
    
    // TODO : if configuration change refresh automatically
}