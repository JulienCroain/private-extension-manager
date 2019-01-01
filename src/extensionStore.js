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
        .then(extensionInfos => {
            return extensionInfos
                .filter(extension => {
                    var sameExtensions = extensionInfos
                        .filter(ex => `${ex.publisher}.${ex.id}` === `${extension.publisher}.${extension.id}`)
                    return sameExtensions.length === 1 ||
                        sameExtensions.every(ex => compareVersions(extension.version, ex.version) >= 0)
                })
                
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