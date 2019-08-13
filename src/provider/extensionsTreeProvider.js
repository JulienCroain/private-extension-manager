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

    getChildren(element) {
        if (element) {
            return extensionStore.extensionInDirectory(element).then(extensions => {
                return extensions.map(extension => new Extension(extension))
            })
        }
        
        return extensionStore.directories.map(directory => new DirectoryExtension(directory))
    }
}

class DirectoryExtension extends vscode.TreeItem {

	constructor(directory) {
        super(directory.name, vscode.TreeItemCollapsibleState.Collapsed)
        this.path = directory.path
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded
	}

	get tooltip() {
		return this.path
	}

	get description() {
		return this.path
	}
}

class Extension extends vscode.TreeItem {

	constructor(extension) {
        super(extension.displayName, vscode.TreeItemCollapsibleState.None)
        this.publisher = extension.publisher
        this.id = extension.path
        this.name = extension.id
        this.path = extension.path
        this.version = extension.version
        this.versions = extension.versions
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
		return `${this.publisher}.${this.name}-${this.version}`
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