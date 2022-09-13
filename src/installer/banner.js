const St = imports.gi.St;
const Pango = imports.gi.Pango;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;

class banner {
  constructor(message, open_cb) {
      this.message = message;
      this.open_cb = open_cb;

      this.create();
  }


  add_box() {

    let text = this._create_textbox(this.message);
    let box = this._center_box(text)

    this.widget = this._create_widget(box);

    Main.layoutManager.panelBox.add(this.widget);
  }

  _create_textbox(message) {
      let text = new St.Label({style_class: 'iso-label', text: this.message });
      text.expand = true;
      text.clutter_text.line_wrap = true;
      text.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
      text.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
      return text;
  }

  _center_box(textbox) {
      let box = new St.BoxLayout ();
      box.width = Main.panel.width;
      box.height = Main.panel.height;
      textbox.x_expand = true;
      textbox.y_expand = true;
      box.add(textbox);
      return box;
  }

  _create_widget(child) {
    let widget = new St.Widget({name: "ISOPanel", reactive: true})
    widget.add_child(child)
    widget.set_content_gravity(Clutter.ContentGravity.TOP)
    widget.background_color = new Clutter.Color({red: 255, alpha: 100});
    widget.height = Main.panel.height;
    widget.set_offscreen_redirect(Clutter.OffscreenRedirect.ALWAYS);

    widget.connect('button-press-event', this._onButtonPress.bind(widget));
    widget.connect('touch-event', this._onButtonPress.bind(widget));
    widget.open_cb = this.open_cb;

    return widget


  }

  _onButtonPress(actor, event) {
     if (event.get_button() !== Clutter.BUTTON_PRIMARY)
        return Clutter.EVENT_PROPAGATE;

     log("Clicked on installer")
     if (this.open_cb) {

      this.open_cb();
     }
     return Clutter.EVENT_STOP;
  }


  create() {
    this.add_box();
  }

  cleanup() {
    Main.layoutManager.panelBox.remove_child(this.widget);
    this.widget = undefined;
  }
}


var Banner = banner;

