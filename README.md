# private-extension-manager

[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/juliencroain.private-extension-manager.svg)](https://marketplace.visualstudio.com/items?itemName=juliencroain.private-extension-manager)

<p align="center">
  <img src="https://raw.githubusercontent.com/JulienCroain/private-extension-manager/master/media/privateExtensionIcon.png" alt="Logo">
</p>

This extension add an activity bar to manage extension which are not on the official store but on a local directory.

## Features

All exensions found in the directory are displayed in the new activity bar.
For each extension are displayed display name, publisher and the higher version (when we found many VSIX files for the same extension).
You can install or update each extension.

![Update private extension](/media/update.gif)

## Extension Settings

This extension contributes the following settings:

- `private-extension-manager.directories`: list of directories where your private VSIX files are released
- `private-extension-manager.autoUpdate`: set to true if you want to automatically install newer version of your extensions

## Release Notes

### 1.0.0

First version of the extension.
You can install or update extension from local folders.
At start up, if the extension detect an update a message is displayed to ask you if you want install it.

**Enjoy!**
