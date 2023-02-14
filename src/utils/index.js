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

      // 在下一个app加载之后判断frame是否由于新的app的append而被动删除, 此时需要destroy上一个app，为了方便记录上一个app的name，这里将destroy的判断放在前面，所以checkToTriggerDestroy通过延时函数处理
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
      // microapp -> 子应用调用history api， mainapp -> 主应用调用history api
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
