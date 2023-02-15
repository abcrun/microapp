A Front-End Microapp Library Width Iframe. 

### Install

`npm i @dabobo/microapp` or `yarn add @dabobo/microapp`

### How to Use It

##### As a microapp

```javascript
import Microapp from '@dabobo/microapp';

const microapp = Microapp.create('#querySelectorString');
microapp.regist([
  {
    when: '/app1',
    url: 'http://localhost:1000', // need allow cross domain request
    onData: function (html) { // you can use this function to modify the response html of the microapp url, return string. 
      return html;
    },
    lifecycle: (opt) => {
      // status: bootstrapped, mounted, actived, active, deactived, beforeDestroy, destroyed
      // vm: vm context
      // method: pushstate or replacestate trigger history change
      // trigger: mainapp, microapp -> mainapp trigger histroy change，microapp trigger history change
      const { status, vm, method, trigger } = opt;

      // a route change demo
      if (status !== 'mounted' && trigger === 'mainapp') {
        const { window: w, location } = vm;
        const { pathname } = location;

        w.router.push(pathname);
      }

      console.log(status, vm, method, trigger);
    },
  },
  {
    when: '/app2',
    origin: 'http://localhost:2000',
    lifecycle: (opt) => {
      const { status, vm, method, trigger } = opt;

      console.log(status, vm, method, trigger);
    },
  }
]);
```

##### As a VM

```javascript
import Microapp from '@dabobo/microapp';

const iframe = document.createElement(iframe);
iframe.style.cssText = 'display: none';
document.body.appendChild(iframe);

const name = 'vmname'; // give the vm a name
const shared = {}; // in the vm, if you run `window.name`, the vm will read the `shared[name]` first. You can set attributes to shared object out of the vm, then vm can read these attributes
const vm = new Microapp.VM(name, shared, iframe);

// methods
vm.loadPage(pageUrl); // load a page html to the iframe with vm
vm.loadScript(srcUrl); // load and run the script url with vm
vm.evalScript(code); // run the script code with the vm
```

