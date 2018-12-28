const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const compareVersions = require('compare-versions')
const VsixInfo = require('vsix-info').default

function loadExtensionFile(path) {
    return VsixInfo.getInfo(path)
        .then(info => {
            info.path = path
            return info
        })
        .catch(err => {
            console.log(`Error on file ${path}`)
            console.log(err)
        })
}

function getExtensionFromDirectory(path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                vscode.window.showWarningMessage('Unable to read directory. Please check extension settings.')
                reject()
            }

            resolve(files.filter(file => file.toLowerCase().endsWith('.vsix')))
        })
    })
}

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

class ExtensionProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter()
    }

    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event
    }

    refresh() {
        this._onDidChangeTreeData.fire()
    }

    getTreeItem(element) {
        return element
    }

    getChildren() {
        let configuration = vscode.workspace.getConfiguration("private-extension-manager")

        return getExtensionFromDirectory(configuration.path)
            .then(extensionFiles => {
                return Promise.all(extensionFiles.map(file => {
                    return loadExtensionFile(path.join(configuration.path, file))
                }))
            })
            .then(extensionInfos => extensionInfos.filter(result => !!result))
            .then(extensionInfos => {
                return extensionInfos
                    .filter(extension => {
                        var sameExtensions = extensionInfos.filter(ex => ex.id === extension.id)
                        return sameExtensions.length === 1 ||
                            sameExtensions.every(ex => compareVersions(extension.version, ex.version) >= 0)
                    })
                    
                    .map(extension => {
                        let contextValue = 'extension-not-installed'
                        const installedVersion = vscode.extensions.getExtension(`${extension.publisher}.${extension.id}`)

                        if (installedVersion) {
                            if (compareVersions(extension.version, installedVersion.packageJSON.version) > 0) {
                                displayUpdateAvailable(extension)
                                contextValue = 'extension-update-available'
                            } else
                                contextValue = 'extension-uptodate'
                        }

                        return new Extension(
                            extension,
                            contextValue
                        )
                    })
            })
            .catch(err => {
                console.log(err)
            })
    }
}

class Extension extends vscode.TreeItem {

	constructor(extension, contextValue) {
        super(extension.displayName, vscode.TreeItemCollapsibleState.None)
        this.publisher = extension.publisher
        this.id = extension.id
        this.version = extension.version
        this.path = extension.path
        this.contextValue = contextValue

        if (contextValue !== 'extension-uptodate') {
            const image = contextValue === 'extension-not-installed' ? 'install.svg' : 'update.svg'

            this.iconPath = {
                light: path.join(__dirname, '..','..', 'media', 'light', image),
                dark: path.join(__dirname, '..','..', 'media', 'dark', image)
            }
        }
	}

	get tooltip() {
		return `${this.publisher}.${this.id}-${this.version}`
	}

	get description() {
		return `${this.publisher} (${this.version})`
	}
}

module.exports = function() {
    const extensionProvider = new ExtensionProvider()
    vscode.window.registerTreeDataProvider('privateExtensions', extensionProvider)
    return extensionProvider
}