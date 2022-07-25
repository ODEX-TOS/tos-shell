'use strict';

const {  GObject } = imports.gi;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const ContainerMenu = Me.imports.src.docker.modules.containerMenu;

const Docker = Me.imports.src.docker.lib.docker;
const Tooltip = Me.imports.src.docker.lib.tooltip;

const Gettext = imports.gettext;
const Domain = Gettext.domain(Me.metadata.uuid);
const _ = Domain.gettext;
const ngettext = Domain.ngettext;

var Container_Menu = GObject.registerClass(
	class Container_Menu extends ContainerMenu.Container_Menu {
		_init(container) {
			super._init(container);

			this._actions = new PopupMenu.PopupBaseMenuItem({reactive: false, can_focus: false});
			this.menu.addMenuItem(this._actions);

			switch (container.state){
				case "running":
					this.new_action_button("utilities-terminal", () => {
						Docker.run_command(Docker.docker_commands.c_exec, container)
					}, _("Attach Shell"));

					this.new_action_button("media-playback-pause", () => {
						Docker.run_command(Docker.docker_commands.c_pause, container)
					}, _("Pause"));

					this.new_action_button("media-playback-stop", () => {
						Docker.run_command(Docker.docker_commands.c_stop, container)
					}, _("Stop"));

					this.new_action_button("object-rotate-left", () => {
						Docker.run_command(Docker.docker_commands.c_restart, container)
					}, _("Restart"));

				break;

				case "paused":
					this.new_action_button("media-playback-start", () => {
						Docker.run_command(Docker.docker_commands.c_unpause, container)
					}, _("Unpause"));

					this.new_action_button("media-playback-stop", () => {
						Docker.run_command(Docker.docker_commands.c_stop, container)
					}, _("Stop"));

					this.new_action_button("object-rotate-left", () => {
						Docker.run_command(Docker.docker_commands.c_restart, container)
					}, _("Restart"));
				break;

				default:
					this.new_action_button("media-playback-start", () => {
						Docker.run_command(Docker.docker_commands.c_start, container)
					}, _("Start"));

					this.new_action_button("utilities-terminal", () => {
						Docker.run_command(Docker.docker_commands.c_start_i, container)
					}, _("Start interactive"));
			}

			this.new_action_button("edit-delete", () => {
				Docker.run_command(Docker.docker_commands.c_rm, container)
			}, _("Remove"));

			this.add_ports();
		}
	}
)