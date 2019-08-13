const vscode = require('vscode')
const extensionStore = require('./extensionStore')
const checkForUpdatesCommand = require('./commands/checkForUpdates')
const installExtensionCommand = require('./commands/installUpdateExtension')
const installAnotherVersionCommand = require('./commands/installAnotherVersion')
const showReadmeCommand = require('./commands/showReadme')
const registerProvider = require('./provider/extensionsTreeProvider')

function displayUpdateAvailable(extension) {
  vscode.window
    .showInformationMessage(
      `Version ${extension.version} is available for ${extension.displayName}.`,
      'Install'
    )
    .then(buttonClicked => {
      if (buttonClicked === 'Install') {
        vscode.commands.executeCommand(
          'privateExtensionManager.updateExtension',
          extension
        )
      }
    })
}

function updateSettings(key, value) {
  return new Promise((resolve, reject) => {
    vscode.workspace
      .getConfiguration()
      .update(key, value, vscode.ConfigurationTarget.Global)
      .then(resolve, reject)
  })
}

function upgradeSettings(configuration) {
  console.log(configuration)
  if (!configuration.path) return Promise.resolve()

  configuration.directories.push(configuration.path)

  return updateSettings('private-extension-manager.path', undefined).then(() =>
    updateSettings(
      'private-extension-manager.directories',
      configuration.directories
    )
  )
}

function activate(context) {
  let configuration = vscode.workspace.getConfiguration(
    'private-extension-manager'
  )

  upgradeSettings(configuration)
    .then(() => {
      return extensionStore.refresh()
    })
    .then(extensions => {
      extensions.forEach(extension => {
        if (extension.contextValue !== 'extension-update-available') return

        if (configuration.autoUpdate) {
          vscode.commands.executeCommand(
            'privateExtensionManager.updateExtension',
            extension
          )
        } else {
          displayUpdateAvailable(extension)
        }
      })
    })
    .catch(error => {
      console.log(error)
    })

  var provider = registerProvider()
  var commandRegistrationParams = { context, provider }

  checkForUpdatesCommand(commandRegistrationParams)
  installExtensionCommand(commandRegistrationParams)
  installAnotherVersionCommand(commandRegistrationParams)
  showReadmeCommand(commandRegistrationParams)
}
exports.activate = activate

function deactivate() {}

module.exports = {
  activate,
  deactivate
}
