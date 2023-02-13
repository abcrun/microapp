export default class History {
  constructor(context, frame) {
    const { history } = frame.contentWindow;
    const { location } = context;

    return new Proxy(history, {
      get(target, name) {
        switch (name) {
          case 'pushState':
          case 'replaceState':
            return (...args) => {
              const [opt, title, path] = args;
              const npath = path.replace(location.origin, '');
              const fromapp = true;

              return window.history[name](
                opt,
                title,
                `${context.name}${npath}`,
                fromapp
              );
            };
          default:
            return target[name];
        }
      },
    });
  }
}
