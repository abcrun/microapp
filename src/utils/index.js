const watchState = (microapp) => {
  const getPathName = (path) =>
    (/\/\//.test(path) ? new URL(path).pathname : path)
      .split('/')
      .slice(0, 2)
      .join('/');

  const checkToTriggerDestroy = (name) => {
    setTimeout(() => {
      if (!window.frames[name]) {
        microapp.destroy(name);
      }
    }, 50);
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
      const { lifecycle } = ismicroapp;

      microapp.loadApp(name).then((app) => {
        lifecycle({ vm: app, ...option });
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
      // microapp -> microapp trigger history api， mainapp -> main app trigger history api
      const trigger = args.length === 4 ? 'microapp' : 'mainapp';
      origin.apply(window.history, args.slice(0, 3));

      const url = window.location.href;
      setTimeout(() => {
        sealMicroApp(url, { trigger, method });
      }, 0);
    };
  });
};

export { watchState };
