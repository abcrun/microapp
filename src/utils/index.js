import watchState from './state';

const loadScript = (url) => window.fetch(url).then((res) => res.text());

const run = (code, context) => {
  // eslint-disable-next-line
  const resolver = new Function(`
    return function ({window, location, history, document, localStorage, sessionStorage}) {
      with(window.$window) {
        try {
          ${code}
        } catch (e) {
          console.log(e);
        }
      }
    }
  `);

  resolver().call(window, { ...context });
};

const getLocation = function loc(origin) {
  const arr = /(https?:)\/\/([^/:]+)(:\d+)?\/?$/.exec(origin);

  const protocol = arr[1] || document.location.protocol;
  const hostname = arr[2];
  const port = arr[3] ? arr[3].substring(1) : '';
  const host = `${protocol}//${hostname}`;

  return { protocol, hostname, port, host };
};

export { watchState, getLocation, run, loadScript };
