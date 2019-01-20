const vscode = require('vscode')
const path = require('path')
const extensionStore = require('../extensionStore')

class ExtensionProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter()
    }

    get onDidChangeTreeData() {
        return this._onDidChangeTreeData.event
    }

    refresh() {
        extensionStore.refresh()
        this._onDidChangeTreeData.fire()
    }

    getTreeItem(element) {
        return element
    }

    getChildren() {
        return extensionStore.allExtensions.then(extensions => {
            return extensions.map(extension => new Extension(extension))
        })
    }
}

class Extension extends vscode.TreeItem {

	constructor(extension) {
        super(extension.displayName, vscode.TreeItemCollapsibleState.None)
        this.publisher = extension.publisher
        this.id = extension.id
        this.version = extension.version
        this.versions = extension.versions
        this.path = extension.path
        this.contextValue = extension.contextValue
        this.command = {
            command: 'privateExtensionManager.showReadme',
            title: '',
            arguments: [extension]
        }

        if (extension.contextValue !== 'extension-uptodate') {
            const image = extension.contextValue === 'extension-not-installed' ? 'install.svg' : 'update.svg'

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