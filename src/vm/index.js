import Window from './Window';
import Document from './Document';
import Location from './Location';
import History from './History';
import Storage from './Storage';

const getScriptCode = (url) => window.fetch(url).then((res) => res.text());

export default class VM {
  constructor(name, shared = {}, frame) {
    this.name = name;
    this.frame = frame;
    this.origin = window.location.origin;
    this.window = new Window(shared, this, frame);
    this.document = new Document(this, frame);
    this.location = new Location(this, frame);
    this.history = new History(this, frame);
    this.localStorage = new Storage(this, 'localStorage');
    this.sessionStorage = new Storage(this, 'sessionStorage');
  }

  loadPage(option) {
    const { url = '', lifecycle = () => {}, onData = () => {} } = option;
    const origin = (url.match(/^https?:\/\/[^/]+/i) || [''])[0];

    this.origin = origin;
    this.option = option;

    const name = this.name;
    const self = this;

    if (!url) {
      throw new Error(`App["${name}"] needs "url" option!`);
    }

    return new Promise((resolve) => {
      window
        .fetch(url)
        .then((res) => res.text())
        .then((html) => {
          const frame = self.frame;

          // bootstrap
          lifecycle({ vm: self, status: 'bootstrapped' });
          console.log(
            `%cApp -> ${name} was bootstrapped!`,
            'background:green;color:#fff'
          );

          const doc = frame.contentWindow.document;
          const fragment = document.createElement('html');
          fragment.innerHTML = html;
          const scripts = fragment.querySelectorAll('script');
          const links = fragment.querySelectorAll('link');

          const pool = [...scripts].map((script) => {
            const src = script.getAttribute('src');
            const code = script.innerHTML;

            if (src) {
              const url = src.replace(/^\.*\//, origin + '/');
              script.remove();

              return getScriptCode(url);
            }

            // eslint-disable-next-line
            script.innerHTML = '';
            return Promise.resolve(code);
          });

          [...links].forEach((link) => {
            const href = link.getAttribute('href');
            const url = href.replace(/^\.*\//, origin + '/');

            if (/\.js/.test(href)) {
              link.remove();
              // link.removeAttribute('href');
              // pool.push(loadScript(origin + url));
            } else {
              link.setAttribute('href', url);
            }
          });

          const data = fragment.innerHTML;
          fragment.remove();

          doc.open('text/html', 'replace');
          doc.write(data);
          doc.close();

          Promise.all(pool).then((res) => {
            res.forEach((code) => {
              self.evalScript(code);
            });

            resolve({ vm: self, status: 'mounted' });
            console.log(
              `%cApp -> ${name} was mounted!`,
              'background:green;color:#fff'
            );
          });
        });
    });
  }

  loadScript(url) {
    getScriptCode(url).then((code) => {
      this.evalScript(code);
    });
  }

  evalScript(code) {
    // eslint-disable-next-line
    const resolver = new Function(`
      return function ({window, location, history, document, localStorage, sessionStorage}) {
        with(window.$window) {
          try {
            ${code}
          } catch (e) {
            console.log(e);
          }
        }
      }
    `);

    resolver().call(window, { ...this });
  }

  destroy() {
    const { name, frame } = this;
    const { lifecycle } = this.option;

    lifecycle({ vm: this, status: 'beforeDestroy' });

    frame.remove();
    lifecycle({ status: 'destroyed' });
    console.log(`%cApp -> ${name} was destroyed!`, 'background:red;color:#fff');
  }
}
