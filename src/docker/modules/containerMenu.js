'use strict';

const { Clutter, Gdk, GObject, Gtk, St } = imports.gi;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Docker = Me.imports.src.docker.lib.docker;
const Tooltip = Me.imports.src.docker.lib.tooltip;

var Container_Menu = GObject.registerClass(
	class Container_Menu extends PopupMenu.PopupSubMenuMenuItem {
		_init(container) {
			super._init(container.name);
			this._container = container
			this._set_state();
		}

		_set_state() {
			this._icon = new St.Icon({
				icon_name: 'media-record-symbolic',
				style_class: 'stop',
				icon_size: '14'
			});

			if (this._container.state == "running") {
				this._icon.style_class = 'running';
			}

			this.actor.insert_child_at_index(this._icon, 1);
		}

		new_action_button(icon, onClickAction, tooltip) {
			this[tooltip] = new St.Button({
				track_hover: true,
				style_class: "button",
				x_expand: true,
				x_align: Clutter.ActorAlign.CENTER
			});

			this[tooltip].child = new St.Icon({
				icon_name: icon,
				style_class: "popup-menu-icon"
			});

			this[tooltip].tooltip = new Tooltip.Tooltip({
				parent: this[tooltip],
				markup: tooltip,
				y_offset: 35
			});

			this[tooltip].connect('clicked', () => {
				onClickAction();
				this._parent._parent.close();
			});

			this._actions.actor.add_child(this[tooltip]);
		}

		add_ports() {
			if (this._container.state !== "running") {
				return;
			}

			let portRegex = /:(\d+)->(\d+)\/(tcp|udp)/;

			let ports =  this._container.ports.
				split(",")
				.map(port => {
					let match = port.match(portRegex);
					if (!match) {
						return null;
					}

					return [match[1], match[2], match[3]];
				})
				.filter(port => port != null);

			if (!ports.length) {
				return;
			}

			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(_("Ports")));

			// Remove duplicated
			ports = ports.filter((port, index) => {
				for (let i = 0; i < index; i++) {
					if (port[0] == ports[i][0] &&
						port[1] == ports[i][1] &&
						port[2] == ports[i][2]) {
							return false;
						}
				}
				return true;
			});

			ports.forEach(port => {
				let n = port.toString(); // Property name
				this[n] = new PopupMenu.PopupMenuItem(`${port[0]} -> ${port[1]}/${port[2]}`);
				this[n].connect('activate', () => {
					// Open in browser
					let url = `http://localhost:${port[0]}`;
					Gtk.show_uri(null, url, Gdk.CURRENT_TIME);
				});

				this.menu.addMenuItem(this[n]);
			});
		}
	}
)