import VM from './vm';
import { watchState, loadScript, run } from './utils';

const cssText =
  'width: 100%; height: 100%; position: absolute; background: #fff; z-index: 1111; top: 0; left:0';
class Microapp {
  constructor(root) {
    this.options = [];
    this.apps = {};
    this.root = root;
    this.active = null;
  }

  getOption(name) {
    const filter = this.options.filter((opt) => opt.when === name);
    return filter.length && filter[0];
  }

  regist(opts) {
    const options = Array.isArray(opts) ? opts : [opts];

    options.forEach((opt) => {
      const { when, root = this.root } = opt;
      if (!root) {
        return new Error('root node is expected!');
      }

      const filters = this.options.filter((filter) => filter.when === when);

      if (filters.length) {
        return new Error(`app: ${when} is exist!`);
      }

      this.options.push(opt);

      return this.options;
    });
  }

  createApp(opt) {
    const { when: name, origin, shared = {}, root, lifecycle = () => {} } = opt;

    return new Promise((resolve) => {
      window
        .fetch(origin)
        .then((res) => res.text())
        .then((html) => {
          const frame = document.createElement('iframe');
          frame.id = name;
          frame.name = name;
          frame.style.cssText = 'display: none';
          document.querySelectorAll(root)[0].appendChild(frame);

          const vm = new VM(shared, frame, name, origin, opt);

          // bootstrap
          lifecycle({ vm, status: 'bootstrapped' });
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

              return loadScript(origin + url);
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
              run(code, vm);
            });

            this.apps[name] = vm;
            this.active = vm;
            vm.active = true;
            frame.style.cssText = cssText;

            resolve({ vm, status: 'mounted' });
            console.log(
              `%cApp -> ${name} was mounted!`,
              'background:green;color:#fff'
            );
          });
        });
    });
  }

  destroy(name) {
    const app = this.apps[name];
    const { lifecycle = () => {} } = app.option;
    lifecycle({ vm: app, status: 'beforeDestroy' });

    try {
      app.frame.remove();
    } catch (e) {
      console.log(e);
    }
    delete this.apps[name];
    lifecycle({ status: 'destroyed' });
    console.log(`%cApp -> ${name} was destroyed!`, 'background:red;color:#fff');
  }

  setActive(name) {
    if (this.active && this.active.name === name) return;

    const app = this.apps[name];
    if (this.active) {
      this.active.frame.style.cssText = `${cssText}; display: none;`;
    }
    this.active = app;
    app.active = true;

    app.frame.style.cssText = cssText;
  }

  deActive() {
    if (!this.active) return;

    const { lifecycle = () => {} } = this.active.option;
    lifecycle({ vm: this.active, status: 'deactived' });
    console.log(
      `%cApp -> ${this.active.name} was deactived!`,
      'background:green;color:#fff'
    );
    this.active.frame.style.cssText = `${cssText}; display: none;`;
    this.active.active = false;
    this.active = null;
  }

  loadApp(name) {
    const app = this.apps[name];

    if (app) {
      if (this.active && this.active.name === name) {
        return Promise.resolve({ vm: app, status: 'active' });
      }

      this.setActive(name);
      console.log(
        `%cApp -> ${name} was actived!`,
        'background:green;color:#fff'
      );
      return Promise.resolve({ vm: app, status: 'actived' });
    }

    const opt = this.getOption(name);
    if (!opt) {
      return Promise.reject(new Error(`app: ${name} isn't exist!`));
    }

    opt.root = opt.root || this.root;
    return this.createApp(opt);
  }
}

export default {
  create(root) {
    const microapp = new Microapp(root);

    watchState(microapp);

    return microapp;
  },
};
