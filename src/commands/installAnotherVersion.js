const vscode = require('vscode')

module.exports = function({context}) {
    let disposable = vscode.commands.registerCommand('privateExtensionManager.installAnotherVersion', (extension) => {
        return vscode.window.showQuickPick(
            extension.versions.map(version => ({
                label: version.version,
                version: version.version,
                path: version.path
            })), {
                placeHolder: 'Select Version to Install'
            }).then(selectedVersion => {
                if (!selectedVersion) return
                vscode.commands.executeCommand('privateExtensionManager.installExtension', selectedVersion)
            })
    })
    context.subscriptions.push(disposable)
}
