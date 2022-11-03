import Window from './Window';
import Document from './Document';
import Location from './Location';
import History from './History';
import Storage from './Storage';

export default class VM {
  constructor(shared = {}, frame, name, origin, opt) {
    this.name = name;
    this.origin = origin;
    this.active = false;
    this.window = new Window(shared, this, frame);
    this.document = new Document(this, frame);
    this.location = new Location(this, frame);
    this.history = new History(this, frame);
    this.localStorage = new Storage(this, 'localStorage');
    this.sessionStorage = new Storage(this, 'sessionStorage');

    this.option = opt;
    this.frame = frame;
  }
}
