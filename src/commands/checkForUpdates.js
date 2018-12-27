const vscode = require('vscode');

module.exports = function(context, provider) {
    let disposable = vscode.commands.registerCommand('privateExtensionManager.checkForUpdates', function () {
        provider.refresh()
	})

    context.subscriptions.push(disposable)
    
    // if configuration change refresh automatically
    vscode.workspace.onDidChangeConfiguration(configurationChange => {
        if (configurationChange.affectsConfiguration('private-extension-manager.path'))
            provider.refresh()
    })
}