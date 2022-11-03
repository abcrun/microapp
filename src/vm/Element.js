import { loadScript, run } from '../utils';

export default function elment(context, frame) {
  const { contentWindow: w } = frame;
  const { origin } = context;
  const tag = (el) => el.nodeName.toLowerCase();

  ['appendChild', 'append', 'insertBefore'].forEach((method) => {
    const originM = w.Element.prototype[method];

    w.Element.prototype[method] = function fn(...args) {
      // 拦截body
      const [first] = args;
      // if (
      //   tag(this) === 'body' &&
      //   first.nodeType === 1 &&
      //   tag(first) !== 'script' &&
      //   (!second || (second && second.nodeType === 1))
      // ) {
      //   const main = document.body[method];

      //   return main.apply(document.body, args);
      // }

      // 如果是script且script包含脚本不是src
      if (tag(first) === 'script' && first.innerHTML) {
        run(first.innerHTML, context);
      }

      return originM.apply(this, args);
    };
  });

  const { setAttribute } = w.Element.prototype;
  w.Element.prototype.setAttribute = function attr(name, value) {
    const reg = /\/\//;
    let nvalue = value;
    if ((name === 'href' || name === 'src') && !reg.test(value)) {
      const url = value.replace(/^\.*/, '');
      nvalue = origin + url;

      if (name === 'src' && tag(this) === 'script') {
        loadScript(nvalue).then((code) => {
          run(code, context);
        });

        return;
      }
    }

    setAttribute.call(this, name, nvalue);
  };

  Object.defineProperty(w.HTMLLinkElement.prototype, 'href', {
    set(url) {
      this.setAttribute('href', url);
    },
  });

  Object.defineProperty(w.HTMLScriptElement.prototype, 'src', {
    set(url) {
      this.setAttribute('src', url);
    },
  });

  Object.defineProperty(w.HTMLImageElement.prototype, 'src', {
    set(url) {
      this.setAttribute('src', url);
    },
  });

  // 处理el.innerHTML ??
}
