const vscode = require('vscode')
const path = require('path')
const compareVersions = require('compare-versions')
const VsixInfo = require('vsix-info').default

function getExtensionFromDirectory(direcoryInfo) {
    return new Promise((resolve, reject) => {
        vscode.workspace.fs.readDirectory(vscode.Uri.file(direcoryInfo.path)).then((files) => {
            files = files.filter(file => file[0].toLowerCase().endsWith('.vsix') &&
                ((file[1] & vscode.FileType.File) == vscode.FileType.File))
            resolve(files.map(f => f[0]))
        }, (reason) => {
            if (/\\\\[a-zA-Z0-9\.\-_]{1,}(\\[a-zA-Z0-9\-_]{1,}){1,}[\$]{0,1}/.test(direcoryInfo.path)) {
                vscode.window.showWarningMessage('Unable to read directory. Please add the UNC host to the allowed list.')
            } else {
                vscode.window.showWarningMessage('Unable to read directory. Please check extension settings.')
            }
            reject()
        })
    })
}

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

function getExtensionIdentifier(extension) {
    return `${extension.publisher}.${extension.id}`
}

function distinctExtensionsWithAllVersions(extensions) {
    var distinctExtensions = {}

    extensions.forEach(extension => {
        if (distinctExtensions[getExtensionIdentifier(extension)])
            return

        extension.versions = extensions
            .filter(ex => getExtensionIdentifier(ex) === getExtensionIdentifier(extension))
            .sort((a, b) => compareVersions(a.version, b.version) * -1)
            .map(ext => ({
                version: ext.version,
                path: ext.path,
                readme: ext.readme
            }))
        extension.version = extension.versions[0].version
        extension.path = extension.versions[0].path
        extension.readme = extension.versions[0].readme

        distinctExtensions[getExtensionIdentifier(extension)] = extension
    })

    return Object.values(distinctExtensions)
}

function filterAndFormatExtensionInfos(extensionInfos) {
    return distinctExtensionsWithAllVersions(extensionInfos.filter(info => !!info))
        .map(extension => {
            extension.contextValue = 'extension-not-installed'
            const installedVersion = vscode.extensions.getExtension(`${extension.publisher}.${extension.id}`)

            if (installedVersion) {
                if (compareVersions(extension.version, installedVersion.packageJSON.version) > 0)
                    extension.contextValue = 'extension-update-available'
                else
                    extension.contextValue = 'extension-uptodate'
            }
            return extension
        })
}

class ExtensionStore {
    contructor() {
        this._refreshPromise = Promise.resolve([])
    }

    get directories() {
        let configuration = vscode.workspace.getConfiguration('private-extension-manager')
        let rootDir = ''
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length)
            rootDir = vscode.workspace.workspaceFolders[0].uri.fsPath

        return configuration.directories.map(d => {
            return {
                name: path.parse(d).name,
                path: path.resolve(rootDir, d)
            }
        })
    }

    extensionInDirectory(directory) {
        return getExtensionFromDirectory(directory)
            .then(extensionFiles => {
                return Promise.all(extensionFiles.map(file => {
                    return loadExtensionFile(path.join(directory.path, file))
                }))
            })
            .then(filterAndFormatExtensionInfos)
            .catch(err => {
                console.log(err)
            })
    }

    refresh() {
        return Promise.all(this.directories.map(directory => this.extensionInDirectory(directory)))
            .then(extensionInfos => extensionInfos.reduce((acc, val) => acc.concat(val), []))
            .then(filterAndFormatExtensionInfos)
            .catch(err => {
                console.log(err)
            })
    }

    get allExtensions() {
        return this._refreshPromise
    }
}

module.exports = new ExtensionStore()
