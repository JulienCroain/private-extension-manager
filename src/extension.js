const vscode = require('vscode')
const extensionStore = require('./extensionStore')
const checkForUpdatesCommand = require('./commands/checkForUpdates')
const installExtensionCommand = require('./commands/installUpdateExtension')
const showReadmeCommand = require('./commands/showReadme')
const registerProvider = require('./provider/extensionsTreeProvider')

function displayUpdateAvailable(extension) {
    vscode.window.showInformationMessage(`Version ${extension.version} is available for ${extension.displayName}.`, 'Install')
        .then(buttonClicked => {
            if (buttonClicked === 'Install') {
                vscode.commands.executeCommand("installVSIX.install", {
                    fsPath: extension.path
                })
            }
        })
}

function activate(context) {
	let configuration = vscode.workspace.getConfiguration("private-extension-manager")

	extensionStore.refresh().then(extensions => {
		extensions.forEach(extension => {
			if (extension.contextValue !== 'extension-update-available')
				return
			
			if (configuration.autoUpdate) {
				vscode.commands.executeCommand('privateExtensionManager.updateExtension', extension)
			} else {
				displayUpdateAvailable(extension)
			}
		})
	})

	var provider = registerProvider()
	var commandRegistrationParams = {context, provider}

	checkForUpdatesCommand(commandRegistrationParams)
	installExtensionCommand(commandRegistrationParams)
	showReadmeCommand(commandRegistrationParams)
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
