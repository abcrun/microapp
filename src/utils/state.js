export default (microapp) => {
  const getPathName = (path) =>
    (/\/\//.test(path) ? new URL(path).pathname : path)
      .split('/')
      .slice(0, 2)
      .join('/');

  const checkToTriggerDestroy = (name) => {
    if (!window.frames[name]) {
      setTimeout(() => {
        microapp.destroy(name);
      }, 0);
    }
  };

  const sealMicroApp = (pathname, option) => {
    const { active } = microapp;
    const name = getPathName(pathname);

    if (active) {
      if (active.name !== name) microapp.deActive();

      checkToTriggerDestroy(active.name);
    }

    const ismicroapp = microapp.getOption(name);
    if (ismicroapp) {
      const { lifecycle = () => {} } = ismicroapp;

      microapp.loadApp(name).then((app) => {
        lifecycle({ ...app, ...option });
      });
    }
  };

  window.addEventListener('popstate', (e) => {
    const current = e.target.location.href;
    sealMicroApp(current, { method: 'popstate' });
  });

  ['pushState', 'replaceState'].forEach((method) => {
    const origin = window.history[method];

    window.history[method] = (...args) => {
      // microapp -> 子应用调用history api， mainapp -> 主应用调用history api
      const trigger = args.length === 4 ? 'microapp' : 'mainapp';
      origin.apply(window.history, args.slice(0, 3));

      const url = window.location.href;
      console.log(method, args);

      sealMicroApp(url, { trigger, method });
    };
  });
};
