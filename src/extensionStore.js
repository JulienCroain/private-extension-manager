const vscode = require('vscode')
const path = require('path')
const fs = require('fs')
const compareVersions = require('compare-versions')
const VsixInfo = require('vsix-info').default

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
                path: ext.path
            }))
        extension.version = extension.versions[0].version
        extension.path = extension.versions[0].path

        distinctExtensions[getExtensionIdentifier(extension)] = extension
    })

    return Object.values(distinctExtensions)
}

class ExtensionStore {
    contructor() {
        this._refreshPromise = Promise.resolve([])
    }

    refresh() {
        let configuration = vscode.workspace.getConfiguration("private-extension-manager")

        this._refreshPromise = getExtensionFromDirectory(configuration.path)
        .then(extensionFiles => {
            return Promise.all(extensionFiles.map(file => {
                return loadExtensionFile(path.join(configuration.path, file))
            }))
        })
        .then(extensionInfos => extensionInfos.filter(result => !!result))
        .then(extensions => {
            return distinctExtensionsWithAllVersions(extensions).map(extension => {
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
        })
        .catch(err => {
            console.log(err)
        })

        return this._refreshPromise
    }

    get allExtensions() {
        return this._refreshPromise
    }
}

module.exports = new ExtensionStore()