/**
 * require configuration file
 * Created by luozheao on 2017/6/19.
 *
 * Modified by point on 20180614
 */

require.config({
  urlArgs: "v=1.0.0",
  paths: {
    'jquery': 'jquery-1.9.1.min',
    'bootstrap': 'bootstrap.min',
    'drag': 'drag',
    'jtopo': 'jtopo-0.4.8',//核心代码
    'topo-main': 'topo-main',//业务层框架级封装
    'topo-focus': 'topo-focus'//业务层,调用暴露出的接口
  },
  shim: {
    'bootstrap': {
      deps: ['jquery']
    },
    'drag': {
      deps: ['jquery']
    },
    'jtopo': {
      exports: 'JTopo'
    },
    'topo-main': {
      deps: ['jquery', 'jtopo', 'drag'],
      exports: 'topoManager'
    },
    'topo-focus': {
      deps: ['topo-main']
    },
    'bundle': {
      deps: ['jquery'],
      exports: 'topoManager'
    }
  }
})

require(
  ['bootstrap', 'topo-focus'],
  function (_______, init) {
    // console.log(_______) // undefined
    init()
  }
)


