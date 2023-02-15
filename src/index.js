import VM from './vm';
import { watchState } from './utils';

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
    const { when: name = '/anonymous', shared = {}, root } = opt;

    const frame = document.createElement('iframe');
    frame.id = name;
    frame.name = name;
    frame.frameborder = 0;
    frame.style.cssText = 'display: none';
    document.querySelectorAll(root)[0].appendChild(frame);

    const vm = new VM(name, shared, frame);
    this.apps[name] = vm;
    this.active = vm;

    return vm.loadPage(opt).then((opt) => {
      frame.style.cssText = cssText;

      return Promise.resolve(opt);
    });
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

  destroy(name) {
    const app = this.apps[name];

    app.destroy();
    delete this.apps[name];
    this.active = null;
  }

  setActive(name) {
    if (this.active && this.active.name === name) return;

    if (this.active) {
      this.active.frame.style.cssText = `${cssText}; display: none;`;
    }

    const app = this.apps[name];
    this.active = app;
    app.frame.style.cssText = cssText;
  }

  deActive() {
    if (!this.active) return;

    const { lifecycle } = this.active.option;
    lifecycle({ vm: this.active, status: 'deactived' });
    console.log(
      `%cApp -> ${this.active.name} was deactived!`,
      'background:green;color:#fff'
    );
    this.active.frame.style.cssText = `${cssText}; display: none;`;
    this.active = null;
  }
}

export default {
  create(root) {
    const microapp = new Microapp(root);

    watchState(microapp);

    return microapp;
  },
  VM,
};
