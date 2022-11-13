const Main = imports.ui.main;
const Meta = imports.gi.Meta
const Shell = imports.gi.Shell

const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const ExtensionManager = imports.ui.main.extensionManager;
const Me = ExtensionUtils.getCurrentExtension();


class Shortcut {
    constructor() {
        this.init();
    }

    ensure_database(settings) {
		  let bindings = ['quick-setting'];

		  bindings.forEach((bind) => {
			  let val = settings.get_strv(bind);
			  log(settings.get_strv(bind));
			  settings.set_strv(bind, val);
		  })
	  }

	  quicksetting(){
	    Main.panel.statusArea.quickSettings.menu.toggle()
	  }

    init() {
		  let settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.tos");

		  this.ensure_database(settings);

		  Main.wm.addKeybinding("quick-setting", settings,
			  Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			  Shell.ActionMode.ALL,
			  this.quicksetting.bind(this));
    }

    destroy() {
		  Main.wm.removeKeybinding("quick-setting");
    }
}

var Shortcuts = Shortcut;
