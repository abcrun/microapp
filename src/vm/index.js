import Window from './Window';
import Document from './Document';
import Location from './Location';
import History from './History';
import Storage from './Storage';

const getScriptCode = (url) => window.fetch(url).then((res) => res.text());

export default class VM {
  constructor(name, shared = {}) {
    const frame = document.createElement('iframe');
    frame.id = name;
    frame.name = name;
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

  load(option) {
    const { url = '', root, lifecycle = () => {} } = option;
    const origin = (url.match(/^https?:\/\/[^/]+/i) || [''])[0];

    this.origin = origin;
    this.option = option;

    if (!url) return;

    const name = this.name;
    const self = this;

    return new Promise((resolve) => {
      window
        .fetch(url)
        .then((res) => res.text())
        .then((html) => {
          const frame = document.createElement('iframe');
          frame.id = name;
          frame.name = name;
          frame.style.cssText = 'display: none';
          (root
            ? document.querySelectorAll(root)[0]
            : document.body
          ).appendChild(frame);

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
              const url = src.replace(/^\.*/, '');
              script.remove();

              return getScriptCode(origin + url);
            }

            // eslint-disable-next-line
            script.innerHTML = '';
            return Promise.resolve(code);
          });

          [...links].forEach((link) => {
            const href = link.getAttribute('href');
            const url = href.replace(/^\.*/, '');

            if (/\.js/.test(href)) {
              link.remove();
              // link.removeAttribute('href');
              // pool.push(loadScript(origin + url));
            } else {
              link.setAttribute('href', origin + url);
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
    const code = getScriptCode(url);
    this.evalScript(code);
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
