const Main = imports.ui.main;
const Format = imports.format;

const ExtensionUtils = imports.misc.extensionUtils;
const ExtensionManager = imports.ui.main.extensionManager;
const Me = ExtensionUtils.getCurrentExtension();

class TosBootOption {
	constructor(name, module, cb) {
		this.name = name;
		this.module = module;
		this.cb = cb;

		this.instance;
	}

	startup() {
		// Try to start the module
		try {
			this.instance = new this.module();

			if(this.cb) this.cb(this.instance);

		} catch (error) {
			logError(error, this.name);
			print(error)
		}
	}

	destroy() {
		// In case startup isn't called or there is an error with this particular module
		if(!this.instance) return;

		// some modules use destroy to cleanup
		if(this.instance.destroy) {
			this.instance.destroy();
			return;
		}

		// Other use disable
		if(this.instance.disable) {
			this.instance.disable();
			return;
		}

		// In the future others might even use other names, which is not something we want to support
	}
}

// The array which tells tos in what order which extension should get started
let tosBootModules = [
	// The update indicator notifying us when we should do an update
	new TosBootOption("TOSUpdateIndicator", Me.imports.src.updater.updater.TOSUpdateIndicator, (instance) => {
		Main.panel.addToStatusArea('TOSUpdateIndicator', instance);
		instance._positionChanged();
	}),

	// A module to add keyboard shortcuts to more easily manage focus between windows
	new TosBootOption("TOSFocusManager", Me.imports.src.focus.focus.TOSFocusManager),

	// Show the gnome dock on the desktop as well instead of only in the overview
	new TosBootOption("TOSDock", 		 Me.imports.src.dock.dock.DOCK),

	// Enable picture in picture (On top of other windows & persistent between workspaces)
	new TosBootOption("TOSPip",			 Me.imports.src.pip.pip.Pip),

	// Closes the overview on boot
	new TosBootOption("TOSNoOverview",   Me.imports.src.overview.overview.NoOverview),

	// Load a docker logo in the top panel if docker is installed
	new TosBootOption("TOSDocker",   Me.imports.src.docker.docker.Docker),

	// Jiggling the mouse cursor will increase the size to more easily find it
	//new TosBootOption("TOSMouseFinder",   Me.imports.src.jiggle.jiggle.Jiggle),

  	// When running the ISO we show an install button
	new TosBootOption("TOSInstaller",   Me.imports.src.installer.installer.Calamares),
]

function init() {
	String.prototype.format = Format.format;
	ExtensionUtils.initTranslations("tos");
	Main.tos = {}
}

// This is the entrypoint which will start each individual module
function enable() {
	log("Enabling tos extension")

	if(!Main.tos) Main.tos = {}
	
	tosBootModules.forEach((bootOption) => {
		bootOption.startup()

		// Map the instance of our boot module to Main.tos so looking glass can more easily access it
		Main.tos[bootOption.name] = bootOption.instance;
	})
}

// Cleanup all our modules
function disable() {
	tosBootModules.forEach((bootOption) => {
		bootOption.destroy()

		if(Main.tos && Main.tos[bootOption.name]) Main.tos[bootOption.name] = undefined;
	})

	// Let's cleanup Main.tos so we don't leave it lingering
	Main.tos = undefined;
}
