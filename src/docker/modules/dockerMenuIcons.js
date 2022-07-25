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


var Docker_Menu = GObject.registerClass(
	class Docker_Menu extends PopupMenu.PopupBaseMenuItem {
		_init() {
			super._init({reactive: false, can_focus: false});

			this._new_action_button("user-trash-symbolic", () => {
				Docker.run_command(Docker.docker_commands.prune);
			}, _("Full cleanup"));

			this._new_action_button("media-optical-cd-symbolic", () => {
				Docker.run_command(Docker.docker_commands.prune_i);
			},_("Purge Images"));

			this._new_action_button("media-floppy-symbolic", () => {
				Docker.run_command(Docker.docker_commands.prune_v);
			}, _("Purge Volumes"));
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
			});

			this.actor.add_child(this[tooltip]);
		}
	}
)