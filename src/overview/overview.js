const Main = imports.ui.main;


class Overview {
    constructor() {
        this._realHasOverview = Main.sessionMode.hasOverview;
        this.init();
    }

    init() {
        if (!Main.layoutManager._startingUp) {
            return;
        }

        Main.sessionMode.hasOverview = false;
        Main.layoutManager.connect('startup-complete', () => {
            Main.sessionMode.hasOverview = this._realHasOverview
        });
        // handle Ubuntu's method
        if (Main.layoutManager.startInOverview) {
            Main.layoutManager.startInOverview = false;
        }
    }

    destroy() {
        Main.sessionMode.hasOverview = this._realHasOverview;
    }
}

var NoOverview = Overview;