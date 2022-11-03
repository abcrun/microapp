export default function http(context, frame) {
  const { contentWindow: window } = frame;
  const { origin } = context;

  // xmlhttprequest
  const { open } = window.XMLHttpRequest.prototype;
  window.XMLHttpRequest.prototype.open = function nopen(method, url) {
    const reg = /\/\//;
    const nurl = !reg.test(url) ? origin + url : url;

    open.call(this, method, nurl);
  };

  // fetch
  const { fetch } = window;
  window.fetch = function nfetch(url, opts) {
    const reg = /\/\//;
    const nurl = !reg.test(url) ? origin + url : url;

    return fetch.call(window, nurl, opts);
  };
}
