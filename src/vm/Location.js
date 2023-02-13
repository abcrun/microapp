const getLocation = function loc(origin) {
  const arr = /(https?:)\/\/([^/:]+)(:\d+)?\/?$/.exec(origin) || [
    '',
    '',
    '',
    '',
  ];

  const protocol = arr[1] || document.location.protocol;
  const hostname = arr[2];
  const port = arr[3] ? arr[3].substring(1) : '';
  const host = `${protocol}//${hostname}`;

  return { protocol, hostname, port, host };
};

export default class Location {
  constructor(context, frame) {
    const { location } = frame.contentWindow;
    const { origin } = context;
    const { protocol, hostname, port, host } = getLocation(origin);

    return new Proxy(
      {}, // 这里不能直接用location，location下有些属性是只读的，不能被proxy修改
      {
        set(target, name, value) {
          switch (name) {
            case 'href':
              break;
            case 'hash':
              window.location.hash = value;

              return true;
            default:
              location[name] = value;
          }

          return true;
        },

        get(target, name) {
          const { pathname: dpathname, search, hash } = window.location;
          const pathname = dpathname.replace(context.name, '');
          const hport = port ? `:${port}` : '';

          switch (name) {
            case 'origin':
              return host;
            case 'port':
              return port;
            case 'pathname':
              return pathname || '/';
            case 'host':
            case 'hostname':
              return hostname;
            case 'protocol':
              return protocol;
            case 'href':
              return `${host}${hport}${pathname}${search}${hash}`;
            case 'reload':
              return () => {};
            case 'replace':
              // 仅处理hashmode
              return (value) => {
                const msg =
                  '子应用使用loation.replace可能会导致程序加载失败, 请慎重使用!';
                try {
                  const url = new window.URL(value);
                  if (url.hash) {
                    location.hash = url.hash.replace('#', '');
                  } else {
                    console.warn(msg);
                    // do nothing
                  }
                } catch (e) {
                  if (value.indexOf('#') === 0)
                    location.hash = value.replace('#', '');
                  else {
                    console.warn(msg);
                  }
                }
              };
            case 'toString':
              return () => {
                try {
                  return location.toString();
                } catch (e) {
                  return location.href;
                }
              };
            default:
              break;
          }

          const value = location[name];
          if (typeof value === 'function') {
            return value.bind && value.bind(location);
          }

          return value;
        },
      }
    );
  }
}
