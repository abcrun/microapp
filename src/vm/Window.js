import Element from './Element';
import Request from './Request';

const isConstructor = (fn) => fn.prototype && fn.prototype.constructor === fn;
const addEvent = (name, w) =>
  name === 'popstate' || name === 'hashchange'
    ? window.addEventListener.bind(window)
    : w.addEventListener.bind(w);
const removeEvent = (name, w) =>
  name === 'popstate' || name === 'hashchange'
    ? window.removeEventListener.bind(window)
    : w.removeEventListener.bind(w);

export default class Window {
  constructor(shared, context, frame) {
    const { contentWindow: w } = frame;
    const $window = {};

    Request(context, frame);
    Element(context, frame);

    // share attributes read only
    return new Proxy(w, {
      set(target, name, value) {
        $window[name] = value;
        w[name] = value;

        return true;
      },

      get(target, name) {
        if (shared[name]) return shared[name];
        if ($window[name]) return $window[name];

        switch (name) {
          case 'isMicroapp':
            return true;
          case 'top':
          case 'self':
          case 'parent':
          case 'globalThis':
          case 'window':
            return context.window;
          case 'origin':
            return context.location.origin;
          case 'document':
          case 'location':
          case 'history':
          case 'localStorage':
          case 'sessionStorage':
            return context[name];
          case '$window':
            return $window;
          case 'addEventListener':
            return (...args) => {
              const event = args[0];
              addEvent(event, w)(...args);
            };
          case 'removeEventListener':
            return (...args) => {
              const event = args[0];
              removeEvent(event, w)(...args);
            };
          default:
            break;
        }

        const value = target[name];
        if (typeof value === 'function' && !isConstructor(value)) {
          return value.bind && value.bind(target);
        }

        return value;
      },
    });
  }
}
