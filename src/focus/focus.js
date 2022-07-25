const Main = imports.ui.main;
const Meta = imports.gi.Meta
const Shell = imports.gi.Shell


const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const ExtensionManager = imports.ui.main.extensionManager;
const Me = ExtensionUtils.getCurrentExtension();


class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class TOSHitDetector {
	constructor() {
		this.workspace_manager = global.workspace_manager;
	}

	get_workspace() {
		return this.workspace_manager.get_active_workspace()
	}

	get_windows() {
		return this.get_workspace().list_windows();
	}

	window_to_rect(window) {
		return window.get_frame_rect();
	}

	// Convert a rectangle to a centered point in the middle of the rect
	window_rect_to_point(window_rect){
		let x = window_rect.x + Math.floor(window_rect.width/2);
		let y = window_rect.y + Math.floor(window_rect.height/2);

		return new Point(x, y)
	}


	// Get the distance between two points
	distance_x(a, b) {
		return a.x - b.x;
	}

	distance_y(a, b) {
		return a.y - b.y;
	}

	// Find the closest window to the left
	left_hit(window) {
		let windows = this.get_windows().filter((w) => w !== window); // We don't need to hit test ourselves

		// left means that the w should be before window on the x axis
		let matched_window = undefined;
		let smallest_distance = Number.MAX_SAFE_INTEGER;

		let w_point = this.window_rect_to_point(this.window_to_rect(window));

		windows.forEach(w => {
			let rect = this.window_to_rect(w);
			let point = this.window_rect_to_point(rect);

			let distance = this.distance_x(w_point, point);

			if (distance < 0) return; // We are looking to a window on the right side (not left)
			if (distance < smallest_distance) {
				smallest_distance = distance;
				matched_window = w;
			}
		});

		// If matched_window is undefined that means there is no window to the left
		return matched_window;
	}

	// Find the closest window to the right
	right_hit(window) {
		let windows = this.get_windows().filter((w) => w !== window); // We don't need to hit test ourselves

		// left means that the w should be before window on the x axis
		let matched_window = undefined;
		let smallest_distance = Number.MIN_SAFE_INTEGER;

		let w_point = this.window_rect_to_point(this.window_to_rect(window));

		windows.forEach(w => {
			let rect = this.window_to_rect(w);
			let point = this.window_rect_to_point(rect);

			let distance = this.distance_x(w_point, point);

			if (distance > 0) return; // We are looking to a window on the left side (not right)
			if (distance > smallest_distance) {
				smallest_distance = distance;
				matched_window = w;
			}
		});

		// If matched_window is undefined that means there is no window to the left
		return matched_window;
	}

	// Find the closest window to the top
	top_hit(window) {
		let windows = this.get_windows().filter((w) => w !== window); // We don't need to hit test ourselves

		// top means that the w should be before window on the y axis
		let matched_window = undefined;
		let smallest_distance = Number.MAX_SAFE_INTEGER;

		let w_point = this.window_rect_to_point(this.window_to_rect(window));

		windows.forEach(w => {
			let rect = this.window_to_rect(w);
			let point = this.window_rect_to_point(rect);

			let distance = this.distance_y(w_point, point);

			if (distance < 0) return; // We are looking to a window on the left side (not right)
			if (distance < smallest_distance) {
				smallest_distance = distance;
				matched_window = w;
			}
		});

		// If matched_window is undefined that means there is no window to the left
		return matched_window;
	}

	// Find the closest window to the bottom
	bottom_hit(window) {
		let windows = this.get_windows().filter((w) => w !== window); // We don't need to hit test ourselves

		// top means that the w should be before window on the y axis
		let matched_window = undefined;
		let smallest_distance = Number.MIN_SAFE_INTEGER;

		let w_point = this.window_rect_to_point(this.window_to_rect(window));

		windows.forEach(w => {
			let rect = this.window_to_rect(w);
			let point = this.window_rect_to_point(rect);

			let distance = this.distance_y(w_point, point);

			if (distance > 0) return; // We are looking to a window on the left side (not right)
			if (distance > smallest_distance) {
				smallest_distance = distance;
				matched_window = w;
			}
		});

		// If matched_window is undefined that means there is no window to the left
		return matched_window;
	}

	// This get's called when disabling the tos extention
	destroy() {

	}
}


class TosFocusManager {
	constructor() {
        try {
            this.hit = new TOSHitDetector();
            this.init()
        } catch (error) {
            logError(error, 'HitDetectorStartupError')
            print(error)
        }
	}

	get_focussed() {
		let f_arr = this.hit.get_windows().filter((w) => w.appears_focused);
		if (f_arr.length != 1) return;
		return f_arr[0]; 
	}

	left() {
		let focus = this.get_focussed()
		if (!focus) return;

		let window = this.hit.left_hit(focus);

		if(window) {
			window.focus(0);
			window.raise();
		}

		return window;
	}

	right() {
		let focus = this.get_focussed()
		if (!focus) return;

		let window = this.hit.right_hit(focus);

		if(window) {
			window.focus(0);
			window.raise();
		}

		return window;
	}

	top() {
		let focus = this.get_focussed()
		if (!focus) return;

		let window = this.hit.top_hit(focus);

		if(window) {
			window.focus(0);
			window.raise();
		}

		return window;
	}

	bottom() {
		let focus = this.get_focussed()
		if (!focus) return;

		let window = this.hit.bottom_hit(focus);

		if(window) {
			window.focus(0);
			window.raise();
		}

		return window;
	}

	// TODO: Implement a swap mode instead of only a focus switch mode

	ensure_database(settings) {
		let bindings = ['left-focus', 'right-focus', 'top-focus', 'bottom-focus'];

		bindings.forEach((bind) => {
			let val = settings.get_strv(bind);
			print(settings.get_strv(bind));
			settings.set_strv(bind, val);
		})
	}

	init() {
		let settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.tos");

		this.ensure_database(settings)
		
		// left
		Main.wm.addKeybinding("left-focus", settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
			this.left.bind(this));

		// right
		Main.wm.addKeybinding("right-focus", settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
			this.right.bind(this));

		// top
		Main.wm.addKeybinding("top-focus", settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
			this.top.bind(this));

		// bottom
		Main.wm.addKeybinding("bottom-focus", settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
			this.bottom.bind(this));
	}

	destroy() {
		Main.wm.removeKeybinding("left-focus");
		Main.wm.removeKeybinding("right-focus");
		Main.wm.removeKeybinding("top-focus");
		Main.wm.removeKeybinding("bottom-focus");
	}
}

// Allows to be exported as a module
var TOSFocusManager = TosFocusManager;
