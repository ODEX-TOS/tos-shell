'use strict';

const {  Gio, GObject, St } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const ContainerMenuIcons = Me.imports.src.docker.modules.containerMenuIcons;
const ImageMenuIcons = Me.imports.src.docker.modules.imageMenuIcons;
const DockerMenuIcons = Me.imports.src.docker.modules.dockerMenuIcons;

const Docker = Me.imports.src.docker.lib.docker;


var Menu = GObject.registerClass(
	class Menu extends PanelMenu.Button {
		_init() {
			super._init(0.0, _('Docker Menu'));
			// Add icon
			let gicon = Gio.icon_new_for_string(Me.path + "/icons/docker.png");
			let icon = new St.Icon({ gicon: gicon , icon_size: '24' });
			this.add_child(icon);

			this.connect('button-press-event', this._show.bind(this));

			this._containers = new PopupMenu.PopupMenuSection();
			this.menu.addMenuItem(this._containers);

			this._images = new PopupMenu.PopupMenuSection();
			this.menu.addMenuItem(this._images);

			this._global = new PopupMenu.PopupMenuSection();
			this.menu.addMenuItem(this._global);
		}

		async _show() {
			try {
				await Promise.all([this._show_global(), this._show_containers(), this._show_images()]);

				this.menu.open();
				// if (!this._containers.isEmpty() || !this._images.isEmpty()) {
				// 	return;
				// }
				// No images or containers
			} catch (e) {
				logError(e);
			}
		}

		async _show_global () {
			this._global.removeAll();

			// Menu type.
			let menu = DockerMenuIcons;

			this._global.addMenuItem(new PopupMenu.PopupSeparatorMenuItem('Daemon'));
			this._global.addMenuItem(new menu.Docker_Menu())
		}

		async _show_containers() {
			this._containers.removeAll();


			// Menu type.
			let menu = ContainerMenuIcons;
			

			return Docker.get_containers()
				.then((containers) => {
					if (containers.length === 0) {
						return;
					}

					this._containers.addMenuItem(new PopupMenu.PopupSeparatorMenuItem('Containers'));
					containers.sort((a, b) => {
					    // Running containers should show first
					    return b.state == "running"
					}).slice(0,10).forEach((container) => {
						this[container.id] = new menu.Container_Menu(container);
						this._containers.addMenuItem(this[container.id]);
					});
				});
		}

		async _show_images () {
			this._images.removeAll();

			// Menu type.
			let menu = ImageMenuIcons;
			

			return Docker.get_images()
				.then((images) => {
					if (images.length === 0) {
						return;
					}

					this._containers.addMenuItem(new PopupMenu.PopupSeparatorMenuItem('Images'));
					images.slice(0,10).forEach((image) => {
						this[image.id] = new menu.Image_Menu(image);
						this._images.addMenuItem(this[image.id]);
					});
				});
		}
	}
);

