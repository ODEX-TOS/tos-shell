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
		this.MIN_DELTA = 50;
        this.GAP = 5; // The gap in pixels when tiling windows
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

    // Place the window at a specific location & size
    window_to_pos(window, x, y, width, height) {
        log("Changing window to new position")
        window.move_resize_frame(false, x + this.GAP, y + this.GAP, width - (this.GAP*2), height - (this.GAP*2));
    }


	// Get the distance between two points
	distance_x(a, b) {
		return a.x - b.x;
	}

	distance_y(a, b) {
		return a.y - b.y;
	}

	// In a one dimensional view the 2 windows are clipping through each other on the x axis
	// If that is not the case usually this means that the user didn't intend to move to that window
	on_same_axis_x(a, b) {
		return (b.x >= a.x - this.MIN_DELTA && b.x <= a.x + a.width + this.MIN_DELTA) || (b.x + b.width >= a.x - this.MIN_DELTA && b.x + b.width <= a.x + a.width + this.MIN_DELTA);
	}

	// In a one dimensional view the 2 windows are clipping through each other on the y axis
	// If that is not the case usually this means that the user didn't intend to move to that window
	on_same_axis_y(a, b) {
		return (b.y >= a.y - this.MIN_DELTA && b.y <= a.y + a.height + this.MIN_DELTA) || (b.y + b.height >= a.y - this.MIN_DELTA  && b.y + b.height <= a.y + a.height + this.MIN_DELTA);
	}

	generic_hit(window, smallest_distance, hit_detection_callback) {
		let windows = this.get_windows().filter((w) => w !== window); // We don't need to hit test ourselves

		// left means that the w should be before window on the x axis
		let matched_window = undefined;

		let w_rect = this.window_to_rect(window)
		let w_point = this.window_rect_to_point(w_rect);

		windows.forEach(w => {
			let rect = this.window_to_rect(w);
			let point = this.window_rect_to_point(rect);

			let result = hit_detection_callback(w, w_rect, w_point, rect, point, smallest_distance, matched_window);
			smallest_distance = result[0];
			matched_window = result[1];
		});

		// If matched_window is undefined that means there is no window to the left
		return matched_window;
	}

	// Find the closest window to the left
	left_hit(window) {
		return this.generic_hit(window, Number.MAX_SAFE_INTEGER, (w, w_rect, w_point, rect, point, smallest_distance, matched_window) => {
			let distance = this.distance_x(w_point, point);

			if (distance < this.MIN_DELTA) return [smallest_distance, matched_window]; // We are looking to a window on the right side (not left)
			//if(!this.on_same_axis_x(w_rect, rect)) return [smallest_distance, matched_window];
			if (distance < smallest_distance) return [distance, w];

			return [smallest_distance, matched_window];
		})
	}

	// Find the closest window to the right
	right_hit(window) {
		return this.generic_hit(window, Number.MIN_SAFE_INTEGER, (w, w_rect, w_point, rect, point, smallest_distance, matched_window) => {
			let distance = this.distance_x(w_point, point);

			if (distance > this.MIN_DELTA) return [smallest_distance, matched_window]; // We are looking to a window on the left side (not right)
			//if(!this.on_same_axis_x(w_rect, rect)) return [smallest_distance, matched_window];
			if (distance > smallest_distance) return [distance, w];

			return [smallest_distance, matched_window];
		})
	}

	// Find the closest window to the top
	top_hit(window) {
		return this.generic_hit(window, Number.MAX_SAFE_INTEGER, (w, w_rect, w_point, rect, point, smallest_distance, matched_window) => {
			let distance = this.distance_y(w_point, point);

			if (distance < this.MIN_DELTA) return [smallest_distance, matched_window]; // We are looking to a window on the left side (not right)
			//if(!this.on_same_axis_y(w_rect, rect)) return [smallest_distance, matched_window];
			if (distance < smallest_distance) return [distance, w];

			return [smallest_distance, matched_window];
		})
	}

	// Find the closest window to the bottom
	bottom_hit(window) {
		return this.generic_hit(window, Number.MIN_SAFE_INTEGER, (w, w_rect, w_point, rect, point, smallest_distance, matched_window) => {
			let distance = this.distance_y(w_point, point);

			if (distance > this.MIN_DELTA) return [smallest_distance, matched_window]; // We are looking to a window on the left side (not right)
			//if(!this.on_same_axis_y(w_rect, rect)) return [smallest_distance, matched_window];
			if (distance > smallest_distance) return [distance, w];

			return [smallest_distance, matched_window];
		})
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

    generic_move(window) {
        window.unmaximize(Meta.MaximizeFlags.BOTH);
        window.unmake_fullscreen();
    }

	left_move() {
		let focus = this.get_focussed()
		if (!focus) return;
        this.generic_move(focus);

        let ws = this.hit.get_workspace()
        let monitor_id = focus.get_monitor();

        let ws_rect = ws.get_work_area_for_monitor(monitor_id);

        // Calculate all parameters to move the window to the left side of the workspace
        let x = ws_rect.x;
        let y = ws_rect.y;
        let width = ws_rect.width/2;
        let height = ws_rect.height;
        this.hit.window_to_pos(focus, x, y, width, height);
	}
	right_move() {
		let focus = this.get_focussed()
		if (!focus) return;
        this.generic_move(focus);

        let ws = this.hit.get_workspace()
        let monitor_id = focus.get_monitor();

        let ws_rect = ws.get_work_area_for_monitor(monitor_id);

        // Calculate all parameters to move the window to the left side of the workspace
        let width = ws_rect.width/2;
        let x = ws_rect.x + width;
        let y = ws_rect.y;
        let height = ws_rect.height;
        this.hit.window_to_pos(focus, x, y, width, height);
	}
	bottom_move() {
		let focus = this.get_focussed()
		if (!focus) return;
        this.generic_move(focus);

        let ws = this.hit.get_workspace()
        let monitor_id = focus.get_monitor();

        let ws_rect = ws.get_work_area_for_monitor(monitor_id);

        // Calculate all parameters to move the window to the left side of the workspace
        let height = ws_rect.height/2;
        let x = ws_rect.x;
        let y = ws_rect.y + height;
        let width = ws_rect.width;
        this.hit.window_to_pos(focus, x, y, width, height);
	}
	top_move() {
		let focus = this.get_focussed()
		if (!focus) return;
        this.generic_move(focus);

        let ws = this.hit.get_workspace()
        let monitor_id = focus.get_monitor();

        let ws_rect = ws.get_work_area_for_monitor(monitor_id);

        // Calculate all parameters to 'maximize' with gaps
        let x = ws_rect.x;
        let y = ws_rect.y;
        let width = ws_rect.width;
        let height = ws_rect.height;
        this.hit.window_to_pos(focus, x, y, width, height);
	}

	// TODO: Implement a swap mode instead of only a focus switch mode

	ensure_database(settings) {
		let bindings = [
            'left-focus', 'right-focus', 'top-focus', 'bottom-focus',
            'left-move', 'right-move', 'top-move', 'bottom-move',
        ];

		bindings.forEach((bind) => {
			let val = settings.get_strv(bind);
			log(bind + ' - ' + settings.get_strv(bind));
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

        // Move bindings
        Main.wm.addKeybinding("left-move", settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
			this.left_move.bind(this));
        Main.wm.addKeybinding("right-move", settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
			this.right_move.bind(this));
        Main.wm.addKeybinding("top-move", settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
			this.top_move.bind(this));
        Main.wm.addKeybinding("bottom-move", settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
			this.bottom_move.bind(this));


	}

	destroy() {
		Main.wm.removeKeybinding("left-focus");
		Main.wm.removeKeybinding("right-focus");
		Main.wm.removeKeybinding("top-focus");
		Main.wm.removeKeybinding("bottom-focus");

		Main.wm.removeKeybinding("left-move");
		Main.wm.removeKeybinding("right-move");
		Main.wm.removeKeybinding("top-move");
		Main.wm.removeKeybinding("bottom-move");
	}
}

// Allows to be exported as a module
var TOSFocusManager = TosFocusManager;
