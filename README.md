A Front-End Microapp Library Width Iframe. 

### Install

`npm i @dabobo/microapp` or `yarn add @dabobo/microapp`

### How to Use It

```javascript
import Microapp from '@dabobo/microapp';

// rootid表示dom的class或者id -> #id, .class 
const microapp = Microapp.create('#rootid');
microapp.regist([
  {
    when: '/app1',
    origin: 'http://localhost:1000', // 设置允许跨域访问
    lifecycle: (opt) => {
      // status: bootstrapped, mounted, actived, active, deactived, destroy -> 生命周期字面含义
      // vm表示对应微应用的context
      // method表示pushstate还是replacestate触发的行为
      // trigger: mainapp, microapp -> mainapp表示再主应用中点击菜单或者主应用路由触发激活子应用，microapp表示再微应用内部路由变化
      const { status, vm, method, trigger } = opt;

      // 如果子应用把router绑定到其window对象下，如果是主应用触发的子应用路由改变，可以通过这种方式渲染对应路由的页面
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
