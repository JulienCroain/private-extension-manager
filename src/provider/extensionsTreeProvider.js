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

class ExtensionProvider {
    constructor(path) {
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

        return new Promise(resolve => {
            fs.readdir(configuration.path, (err, files) => {
                if (err) {
                    vscode.window.showWarningMessage('Unable to read directory. Please check extension settings.')
                    return resolve([])
                }

                let itemsPromise = files
                    .filter(file => file.toLowerCase().endsWith('.vsix'))
                    .map(file => {
                        return loadExtensionFile(path.join(configuration.path, file))
                    })

                Promise.all(itemsPromise)
                    .then(results => {
                        return results.filter(result => !!result)
                    })
                    .then(extensions => {
                        console.log(extensions)
                        return extensions.map(extension => {
                            return new Extension(
                                extension.displayName,
                                extension.publisher,
                                extension.id,
                                extension.version,
                                path,
                                vscode.extensions.getExtension(`${extension.publisher}.${extension.id}`)
                            )
                        })
                    }).catch(err => {
                        console.log(err)
                    }).then(resolve)
            })
        })
    }
}

class Extension extends vscode.TreeItem {

	constructor(label, publisher, id, version, path, installedVersion) {
        super(label, vscode.TreeItemCollapsibleState.None)
        this.publisher = publisher
        this.id = id
        this.version = version

        if (installedVersion) {
            if (compareVersions(this.version, installedVersion.packageJSON.version) > 0)
                this.contextValue = 'extension-update-available'
            else
                this.contextValue = 'extension-uptodate'
        } else {
            this.contextValue = 'extension-not-installed'
        }

        this.path = path
	}

	get tooltip() {
		return `${this.publisher}.${this.id}-${this.version}`
	}

	get description() {
		return `${this.publisher} (${this.version})`
	}
}

module.exports = function() {
    const extensionProvider = new ExtensionProvider(vscode.workspace.rootPath)
    vscode.window.registerTreeDataProvider('privateExtensions', extensionProvider)
    return extensionProvider
}