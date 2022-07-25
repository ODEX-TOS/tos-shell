'use strict';

const {  GObject, St, Clutter } = imports.gi;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Docker = Me.imports.src.docker.lib.docker;
const Tooltip = Me.imports.src.docker.lib.tooltip;

const Gettext = imports.gettext;
const Domain = Gettext.domain(Me.metadata.uuid);
const _ = Domain.gettext;
const ngettext = Domain.ngettext;


var Image_Menu = GObject.registerClass(
	class Image_Menu extends PopupMenu.PopupSubMenuMenuItem {
		_init(image) {
			super._init(image.name);

			this._actions = new PopupMenu.PopupBaseMenuItem({reactive: false, can_focus: false});

			this._new_action_button("media-playback-start", () => {
				Docker.run_command(Docker.docker_commands.i_run, image);
			}, _("Run"));

			this._new_action_button("utilities-terminal", () => {
				Docker.run_command(Docker.docker_commands.i_run_i, image);
			},_("Run interactive"));

			this._new_action_button("edit-delete", () => {
				Docker.run_command(Docker.docker_commands.i_rm, image);
			}, _("Remove (force)"));

			this.menu.addMenuItem(this._actions);
		}

		_new_action_button(icon, onClickAction, tooltip) {
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
	}
)