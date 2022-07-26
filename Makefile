DESTDIR ?= /

compile:
	glib-compile-schemas schemas/

install: compile
	mkdir -p ~/.local/share/gnome-shell/extensions/tos@odex.be/
	mkdir -p ~/.local/share/glib-2.0/schemas/
	cp -ra * ~/.local/share/gnome-shell/extensions/tos@odex.be/
	cp schemas/*.xml ~/.local/share/glib-2.0/schemas/
	glib-compile-schemas ~/.local/share/glib-2.0/schemas/


s_install:
	mkdir -p $(DESTDIR)/usr/share/gnome-shell/extensions/tos@odex.be/
	mkdir -p $(DESTDIR)/usr/share/glib-2.0/schemas/
	cp -ra * $(DESTDIR)/usr/share/gnome-shell/extensions/tos@odex.be/
	cp schemas/*.xml $(DESTDIR)/usr/share/glib-2.0/schemas
	glib-compile-schemas $(DESTDIR)/usr/share/glib-2.0/schemas/


run: compile install
	dbus-run-session -- gnome-shell --nested --wayland

keys: compile
	mkdir -p  $(DESTDIR)/usr/share/gnome-control-center/keybindings/
	cp keybindings/*.xml $(DESTDIR)/usr/share/gnome-control-center/keybindings

system_install:  s_install keys


system_uninstall:
	rm -r $(DESTDIR)/usr/share/gnome-shell/extensions/tos@odex.be/ || true
	find schemas/ -iname '*.xml' -printf "%f\n" -exec rm $(DESTDIR)/usr/share/glib-2.0/{} \;
	glib-compile-schemas $(DESTDIR)/usr/share/glib-2.0/schemas/
