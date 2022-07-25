'use strict';

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


class DOCKER {
	constructor() {
		this._uuid = 'tos@odex.be';

		// DOcker isn't installed so this module won't boot up
		this.is_installed = Me.imports.src.docker.lib.docker.is_docker_installed();

		if(!this.is_installed) return;

		// Create indicator.
		this._indicator = new Me.imports.src.docker.modules.menu.Menu;

		Main.panel.addToStatusArea(this._uuid, this._indicator);
	}

	disable() {
		// Docker wasn't installed during launch, so no cleanup is needed
		if(!this.is_installed) return;

		this._indicator.destroy();
		this._indicator = null;
	}
}


var Docker = DOCKER;
