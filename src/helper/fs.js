const {GLib, Gio} = imports.gi;
const ByteArray = imports.byteArray;



class FileSystem {

  static async read(_file) {
    const file = Gio.File.new_for_path(_file);
    // Asynchronous, non-blocking method
    const [, contents, etag] = await new Promise((resolve, reject) => {
        file.load_contents_async(
            null,
            (file_, result) => {
                try {
                    resolve(file.load_contents_finish(result));
                } catch (e) {
                    reject(e);
                }
            }
        );
    });

    return contents;
  }

  static readSync(file) {
      return ByteArray.toString(GLib.file_get_contents(file)[1]);
  }


  // TODO: Implement
  static async write(file) {
  }

  static writeSync(file) {
  }

  static exists(_file) {
      const file = Gio.File.new_for_path(_file);
      return file.query_exists(null);
  }


}

var FS = FileSystem;
