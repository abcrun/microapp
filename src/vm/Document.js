export default class Document {
  constructor(context, frame) {
    const { document } = frame.contentWindow;
    const { name: cname } = context;

    return new Proxy(document, {
      set(target, name, value) {
        if (name === 'cookie') {
          const nvalue =
            value.indexOf('path=') > -1
              ? value.replace('path=', `path=${cname}${value}`)
              : `${value};path=${cname}`;

          window.document.cookie = nvalue;

          return true;
        }

        document[name] = value;
        return true;
      },

      get(target, name) {
        const { hostname, href } = context.location;

        switch (name) {
          case 'domain':
            return hostname;
          case 'url':
          case 'documentURI':
          case 'URL':
            return `${href}`;
          case 'location':
            return context.location;
          case 'defaultView':
            return context.window;
          default:
            break;
        }

        const value = target[name];
        if (typeof value === 'function') {
          return value.bind && value.bind(target);
        }

        return value;
      },
    });
  }
}
