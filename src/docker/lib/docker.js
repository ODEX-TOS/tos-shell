
'use strict';

const { Gio, GLib } = imports.gi;
const Main = imports.ui.main;

const ByteArray = imports.byteArray;

/**
 * asdadas
 * @type {Array.<{label: string, command: string}}
 */
var docker_commands = {
	// Container commands
	c_start: {
		label: "Start",
		command: "start"
	},
	c_start_i: {
		label: "Start interactive",
		command: "start -i"
	},
	c_restart: {
		label:"Restart",
		command: "restart"
	},
	c_stop: {
		label: "Stop",
		command: "stop"
	},
	c_pause: {
		label: "Pause",
		command: "pause"
	},
	c_unpause: {
		label: "Unpause",
		command: "unpause"
	},
	c_rm: {
		label: "Remove container",
		command: "rm"
	},
	c_exec: {
		label: "Attach Shell",
		command: "exec -it"
	},

	// Img commands
	i_rm: {
		label: "Remove image",
		command: "rmi -f"
	},
	i_run: {
		label: "Run",
		command: "run --rm -d"
	},
	i_run_i: {
		label: "Run interactive",
		command: "run --rm -it"
	},

	// global commands
	prune: {
		label: "Prune all",
		command: "system prune -f",
		name_cb: (out) => { return out.split('\n').reverse()[0]; }

	},

	// TODO: Cleanup all images need to run under a shell
	prune_i: {
		label: "Prune images",
		command: "image prune -a -f",
		name_cb: (out) => { return out.split('\n').reverse()[0]; }
	},

	prune_v: {
		label: "Prune all volumes",
		command: "volume prune -f",
		name_cb: (out) => { return out.split('\n').reverse()[0]; }
	}
}

/**
 * Check if docker is installed
 * @return {Boolean} whether docker is installed or not
 */
function is_docker_installed() {
	return !!GLib.find_program_in_path('docker');
}

/**
 * Return containers name and status.
 * @return {Array.<{id: String, name: String, status: String}>} every object represents a container
 */
async function get_containers() {
	let command = `docker container list --all --format "{{.ID}};{{.Names}};{{.State}};{{.Ports}}"`;

	let [, c ] = GLib.shell_parse_argv(command);

	let out = "";
	await exec_communicate(c)
		.then((output) => {out = output})
		.catch((err) => {
			Main.notifyError(`Docker ERROR`, err.toString());
		});

	if (!out.length) {
		return [];
	}

	// Found containers
	return out
			.replaceAll("\"","")
			.split("\n")
			.filter(element => element)
			.map(str => str.split(";"))
			.map(s => {
				return {
					id: s[0],
					name: s[1],
					state: s[2],
					ports: s[3]
				};
			})
			.sort((a,b) => {
				if (a.repository < b.repository) return -1;
				if (a.repository > b.repository) return 1;
				// equal name
				return 0;
			});

}

/**
 * Return containers name and status.
 * @return {Array.<{id: String, name: String}>} every object represents a container
 */
async function get_images() {
	let command = `docker images --filter dangling=false --format "{{.ID}};{{.Repository}};{{.Tag}}"`;

	let [, c ] = GLib.shell_parse_argv(command);

	let out = "";
	await exec_communicate(c)
		.then((output) => {out = output})
		.catch((err) => {
			Main.notifyError(`Docker ERROR`, err.toString());
		});

	if (!out.length) {
		return [];
	}

	// Found containers
	return out
			.replaceAll("\"","")
			.split("\n")
			.filter(element => element)
			.map(str => str.split(";"))
			.map(s => {
				return {
					id: s[0],
					name: `${s[1]}:${s[2]}`
				};
			})
			.sort((a,b) => {
				if (a.name < b.name) return -1;
				if (a.name > b.name) return 1;
				// equal name
				return 0;
			});

}

/**
 * Run docker command.
 * @param {docker_commands} command - name of command from the list docker_commands
 * @param {Object} item - container/image struct
 */
function run_command(command, item) {
	let c = "";

	if(item) {
		switch (command){
			// TODO: Make text to be translated
			case docker_commands.c_exec:
				c = `gnome-terminal -- sh -c 'docker ${command.command} ${item.id} bash; read -p "Press enter to exit..."'`;
				GLib.spawn_command_line_async(c);
			return;
	
			case docker_commands.c_start_i:
				c = `gnome-terminal -- sh -c 'docker ${command.command} ${item.id}; read -p "Press enter to exit..."'`;
				GLib.spawn_command_line_async(c);
			return;
	
			case docker_commands.i_run_i:
				c = `gnome-terminal -- sh -c 'docker ${command.command} ${item.id}; read -p "Press enter to exit..."'`;
				GLib.spawn_command_line_async(c);
			return;
	
			default:
				c = `docker ${command.command} ${item.id}`;
		}
	}else {
		item = {
			id: '',
			name: 'Docker'
		}
		c = `docker ${command.command}`;
	}

	let proc = Gio.Subprocess.new(
		c.split(" "),
		Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
	);


	proc.communicate_utf8_async(null, null, (proc, res) => {
		try {
			let [, stdout, stderr] = proc.communicate_utf8_finish(res);

			if (!proc.get_successful()) {
				throw new Error(stderr);
			}

			if (command.name_cb) {
				Main.notify(`${command.label}:`, command.name_cb(stdout.trim()));
				return;
			}

			Main.notify(`${command.label}:`, item.name);
		} catch (e) {
			Main.notifyError('Docker ERROR', e.toString());
		}
	});
}

/**
 * Execute a command asynchronously and return the output from `stdout` on
 * success or throw an error with output from `stderr` on failure.
 *
 * If given, @input will be passed to `stdin` and @cancellable can be used to
 * stop the process before it finishes.
 *
 * @param {string[]} argv - a list of string arguments
 * @param {string} [input] - Input to write to `stdin` or %null to ignore
 * @param {Gio.Cancellable} [cancellable] - optional cancellable object
 * @returns {Promise<string>} - The process output
 */
async function exec_communicate(argv, input = null, cancellable = null) {
	let cancelId = 0;
	let flags = (Gio.SubprocessFlags.STDOUT_PIPE |
				 Gio.SubprocessFlags.STDERR_PIPE);

	if (input !== null)
		flags |= Gio.SubprocessFlags.STDIN_PIPE;

	let proc = new Gio.Subprocess({
		argv: argv,
		flags: flags
	});
	proc.init(cancellable);

	if (cancellable instanceof Gio.Cancellable) {
		cancelId = cancellable.connect(() => proc.force_exit());
	}

	return new Promise((resolve, reject) => {
		proc.communicate_utf8_async(input, null, (proc, res) => {
			try {
				let [, stdout, stderr] = proc.communicate_utf8_finish(res);
				let status = proc.get_exit_status();

				if (status !== 0) {
					throw new Gio.IOErrorEnum({
						code: Gio.io_error_from_errno(status),
						message: stderr ? stderr.trim() : GLib.strerror(status)
					});
				}

				resolve(stdout.trim());
			} catch (e) {
				reject(e);
			} finally {
				if (cancelId > 0) {
					cancellable.disconnect(cancelId);
				}
			}
		});
	});
}
