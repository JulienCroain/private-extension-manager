const vscode = require('vscode');

var panelId

module.exports = function({context, provider}) {
    let disposable = vscode.commands.registerCommand('privateExtensionManager.showReadme', function (extension) {
        vscode.commands.executeCommand("markdown-viewer.openViewer", {
            id: panelId,
            title: extension.displayName,
            content: extension.readme
        }).then(id => {
            panelId = id
        })
	})

    context.subscriptions.push(disposable)
}