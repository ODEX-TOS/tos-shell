// The purpose of this plugin is to detect if it's running in an installed version of TOS
// Or if it's running in an ISO
// If we detect that we are running in an ISO then we will show the installer
// In which case the user can more easily install TOS

// Additionally a banner will be shown, notifying the user than there settings aren't saved persistently
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const GLib = imports.gi.GLib;

// Get access to the filesystem object
const fs = Me.imports.src.helper.fs.FS;

class IntCalamares {
    constructor() {
        this.init()
    }


    // TODO: Detect if we are running in an ISO environment
    is_iso_running() {
      // If one of these files exist then we are in our ISO env
      // Reason we use multiple files is in case we decide to rename these
      let locations = [
        "/run/archiso/airootfs",
        "/run/archiso/bootmnt",
        "/run/archiso/cowspace",
        "/run/tosiso/airootfs",
        "/run/tosiso/bootmnt",
        "/run/tosiso/cowspace",
      ]

      for(let i = 0; i < locations.length; i++) {
        if (fs.exists(locations[i])) return true;
      }

      return false;
    }

    is_tos() {
      let content = fs.readSync("/etc/os-release");
      let lines = content.split('\n');

      for(let i = 0; i< lines.length; i++) {
        if (lines[i] == ("ID=tos")) {
          return true;
        }
      }

      return false;
    }

    init() {
      // TOS uses /etc/os-release
      // If it doesn't exist we assume this environment isn't tos
      if (fs.exists("/etc/os-release") && this.is_tos() && this.is_iso_running()) {
        this.start();
      }
    }

    open_installer() {
      GLib.spawn_command_line_async('sudo su -c "tos c"');
    }

    start() {
      this._banner = new Me.imports.src.installer.banner.Banner("This is a live system, no information will be saved after restarting this device. To install the full system please click me!", this.open_installer);
    }

    destroy() {
      if (this._banner) this._banner.cleanup();
    }
}

var Calamares = IntCalamares;
