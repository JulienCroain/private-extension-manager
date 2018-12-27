const checkForUpdatesCommand = require('./commands/checkForUpdates')
const installExtensionCommand = require('./commands/installExtension')
const registerProvider = require('./provider/extensionsTreeProvider')

function activate(context) {
	var provider = registerProvider()
	var commandRegistrationParams = {context, provider}

	checkForUpdatesCommand(commandRegistrationParams)
	installExtensionCommand(commandRegistrationParams)
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
