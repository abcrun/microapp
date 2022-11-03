export default class Storage {
  constructor(context, type) {
    const storage =
      type === 'localStorage' ? window.localStorage : window.sessionStorage;
    const { name: id } = context;
    let store = storage[id] ? JSON.parse(storage[id]) : { length: 0 };

    return new Proxy(store, {
      set(target, name, value) {
        store[name] = value;
        store.length = Object.keys(store).length - 1;
        storage[id] = JSON.stringify(store);

        return true;
      },

      get(target, name) {
        switch (name) {
          case 'toString':
            return { ...store };
          case 'getItem':
            return (key) => store[key] || null;
          case 'setItem':
            return (key, value) => {
              store[key] = value;
              store.length = Object.keys(store).length - 1;
              storage[id] = JSON.stringify(store);

              return value;
            };
          case 'removeItem':
            return (key) => {
              delete store[key];
              store.length = Object.keys(store).length - 1;
              storage[id] = JSON.stringify(store);
            };
          case 'clear':
            return () => {
              store = { length: 0 };
              storage[id] = JSON.stringify(store);
            };
          default:
            return store[name];
        }
      },
    });
  }
}
