/**
 * topo-main.js: 基于源码(jtopo-0.4.8.js)进行的封装
 *
 * date:20170315
 * by：luozheao
 *
 * 说明：
 * 1、采用面向对象编程方式编写，阅读与修改时注意从对象的角度入手
 * 2、每个类、方法、行为要写注释，命名方式采用骆驼命名
 * 3、功能关联度较大的方法，应模块化成一个类，比如弹窗、权限管理
 * 4、mvc 结构里面，数据层用 get 开头，显示层 show 开头，控制层用 set 开头
 * 5、辅助方法用 fn 开头
 * 6、私有方法用下划线 ‘_’ 开头
 *
 * Modified by point on 20180615
 */

;define(
  ['jquery', "drag",],
  function ($) {
    // 画布管理者：包含节点/线条/容器的创建与相关的事件，以及数据的保存和呈现
    const canvasManager = {
      // 连线事件
      linkEvent: {
        mouseup: null,
        mouseover: null,
        mouseout: null,
        mousemove: null,
        dbclick: null,
      },

      // 节点事件
      nodeEvent: {
        mouseup: null,
        mousedown: null,
        mousemove: null,
        mouseover: null,
        mouseout: null,
        dbclick: null,
      },

      // 容器事件
      containerEvent: {
        mouseup: null,
        mouseover: null,
        mouseout: null,
        mousemove: null,
        dbclick: null,
      },

      // 场景事件
      sceneEvent: {
        mouseup: null,
        mousedrag: null,
      },

      // TODO: ?
      groupObj: {
        paddingWidth: 100,
        paddingHeight: 100,
        parentContainerRecord: null,
      },

      // 自定义节点样例
      userDefinedNodes: [],

      // 元素显示特效
      elementShowEffect: {
        // 是否开启元素动画效果
        alphaEffect: true,

        // 元素动画效果：渐渐浮现
        start() {
          if (this.alphaEffect) {
            stateManager.scene.childs.filter(function (currentNodeObj, index, arr) {
              // currentNodeObj: 当前数组元素的值，canvas 节点对象
              // index: 当前数组元素对应的索引
              // arr: {Array} - stateManager.scene.childs

              currentNodeObj.alpha = 0

              // ;(currentNodeObj.fillColor === "22, 124, 255") && (currentNodeObj.fillColor = "255, 255, 255")

              JTopo.Animate
              // 参数：节点、属性、时间、true(是否循环)、是否逆循环
                .stepByStep(currentNodeObj, {alpha: 1}, 1000, true)
                // 开启定时器
                .start()
            })

            JTopo.flag.allElementAlpha = 1
          }
        },
      },

      renderTopoCallback: null,
      isRunRenderCallback: true,

      // 创建连线之后的事件
      afterCreateLink: null,

      // 用户自定义节点，存储根据对象 id 生成的节点
      idToNode: {},

      /** 画布处理，start */

      /**
       * 创建节点、容器、自定义节点、线条时
       * id 为后台提供，_id 由前端提供，由于创建时，id 不存在，故一定要给 id 赋值为 _id
       * 后台拿到 id 可以改一下，也可不改
       */

      /**
       * 设置画布样式：根据窗口的变化实时调节 canvas 的宽高
       */
      setCanvasStyle() {
        // 将 canvas 节点对象赋值给 oCanvas 变量
        const oCanvas = stateManager.canvas
        // 将 id=canvasWrap 的节点对象（canvas 节点的父节点）赋值给 oCanvasWrap 变量
        const oCanvasWrap = document.getElementById('canvasWrap')
        // 将 id=container 的节点对象（canvasWrap 节点的父节点）赋值给 oContainer 变量
        const oContainer = document.getElementById('container')

        // 触发一次该函数
        fnSetCanvas()

        //监听窗口变化
        window.addEventListener(
          'resize',
          function () {
            fnSetCanvas()
            // 退出全屏
            stateManager.isFullScreen && canvasManager.cancelFullScreen()
          }
        )

        // 根据窗口的变化实时调节 canvas 的宽高
        function fnSetCanvas() {
          // oContainer_w 参与 canvas 元素最终的宽度的计算
          const oContainer_w = oContainer.offsetWidth
          // oContainer_h 参与 canvas 元素最终的高度的计算
          let oContainer_h = 650

          // 获取 scene 场景实例中保存的宽高位置等信息：
          // {
          //   top: xx, right: xx, bottom: xx, left: xx, width: xx, height: xx,
          // }
          const elementsBoundObj = stateManager.scene.getElementsBound()
          const elementsBoundHeight = elementsBoundObj.bottom + stateManager.scene.translateY

          if (elementsBoundHeight > oContainer_h) {
            oContainer_h = elementsBoundHeight + 30
          }

          // 装备区域的宽度
          const oEquipmentArea_w = stateManager.equipmentAreaWidth
          oCanvas.setAttribute('width', oContainer_w - oEquipmentArea_w - 10)
          oCanvas.setAttribute('height', oContainer_h)
        }
      },

      /**
       * 进入全屏模式
       *
       * @param {Object} element - canvas element
       * @param {String} method - 'RequestFullScreen'
       * @return {Undefined} undefined
       */
      fullScreen(element, method) {
        // 可用的携带前缀的全屏方法
        let usablePrefixMethod

        ["webkit", "moz", "ms", "o", ""].forEach(function (prefix) {
            if (usablePrefixMethod) return

            if (prefix === "") {
              // 无前缀时，方法首字母小写
              method = method.slice(0, 1).toLowerCase() + method.slice(1)
            }

            const typePrefixMethod = typeof element[prefix + method]

            if (typePrefixMethod + "" !== "undefined") {
              if (typePrefixMethod === "function") {
                usablePrefixMethod = element[prefix + method]()
              } else {
                usablePrefixMethod = element[prefix + method]
              }
            }
          }
        )

        return usablePrefixMethod
      },

      // 退出全屏模式
      cancelFullScreen() {
        stateManager.isFullScreen = false

        // 场景偏移量（水平方向），随鼠标拖拽变化
        stateManager.scene.translateX = 0
        // 场景偏移量（水平方向），随鼠标拖拽变化
        stateManager.scene.translateY = 0
        // 缩放并居中显示所有元素
        stateManager.scene.centerAndZoom()
        // 水平和垂直方向居中移动元素
        stateManager.scene.translateToCenter()
      },

      // 初始化画布事件
      initCanvasEvent() {
        /** 动态连线处理 */

        const self = this

        // 存储 scene 场景实例
        const scene = stateManager.scene
        // 存储连线模式和连线类型
        const setLink = stateManager.setLink

        // new 一个名为 tempA 的 canvas 内部虚拟起始节点实例
        const tempNodeA = new JTopo.Node('tempA')
        // 设置临时虚拟起始节点的宽度和高度
        tempNodeA.setSize(1, 1)

        // new 一个名为 tempZ 的 canvas 内部虚拟终止节点实例
        const tempNodeZ = new JTopo.Node('tempZ')
        // 设置临时虚拟终止节点的宽度和高度
        tempNodeZ.setSize(1, 1)

        // 储存连线
        let link

        // 存储场景事件对象
        const sceneEventObj = canvasManager.sceneEvent

        /** 为 scene 场景实例注册事件 */
        // 单击事件：在场景内部单击鼠标左键时，关闭鼠标右键触发的弹窗
        scene.addEventListener('click', function (e) {
          // 鼠标左键
          if (e.button === 0) {
            $(".contextmenu").hide()
          }
        })

        /***
         * 鼠标按下事件
         *
         * 若:
         * 事件源不存在
         * 或 事件源是起始节点（stateManager.beginNode）
         * 或 事件源是连线
         * 且 触发鼠标按下的不是鼠标右键
         * 则：
         * 存在连线则移除连线
         * stateManager.beginNode 设为空
         * 场景下的所有节点元素的选中状态设为 false
         *
         */
        scene.addEventListener('mousedown', function (e) {
          if ((e.target === null || e.target === stateManager.beginNode || e.target === link) && e.button !== 2) {
            link && scene.remove(link)
            stateManager.beginNode = null
            scene.childs.filter(function (child) {
              child.selected = false
            })
          }
        })

        // 鼠标拖动事件：
        scene.addEventListener('mousedrag', function (e) {
          // 查找场景中的对象，例如: findElements(function(e){ return e.x > 100; });
          scene.findElements(function (child) {
            if(child.elementType === 'containerNode'){
              // 绘制当前容器节点中的所有节点，JTopo.flag.graphics 为 canvas 的上下文环境
              child.paint(JTopo.flag.graphics)
            }
          })

          sceneEventObj.mousedrag && sceneEventObj.mousedrag(e)

          // 拖动成组
          if (stateManager.isCreateGroupByDrag) {
            // 存储事件源节点
            let nodeObj = e.target

            // 若不存在事件源，则直接返回
            if (!nodeObj) {return}

            // 存储事件源节点的父容器对象数组，只记录一次
            const containerObjArr = nodeObj.parentContainer

            if (containerObjArr) {
              // 存储事件源节点父容器对象数组的第一个元素
              const containerObj = containerObjArr[0]

              if (!canvasManager.groupObj.parentContainerRecord) {
                canvasManager.groupObj.parentContainerRecord = {
                  x: containerObj.x,
                  y: containerObj.y,
                  width: containerObj.width,
                  height: containerObj.height,
                }
              }

              if (
                !(nodeObj.x > canvasManager.groupObj.parentContainerRecord.x - canvasManager.groupObj.paddingWidth
                  && nodeObj.x + nodeObj.width < canvasManager.groupObj.parentContainerRecord.x + canvasManager.groupObj.parentContainerRecord.width + canvasManager.groupObj.paddingWidth
                  && nodeObj.y > canvasManager.groupObj.parentContainerRecord.y - canvasManager.groupObj.paddingHeight
                  && nodeObj.y + nodeObj.height < canvasManager.groupObj.parentContainerRecord.y + canvasManager.groupObj.parentContainerRecord.height + canvasManager.groupObj.paddingHeight)
              ) {
                containerObj.remove(nodeObj)
                canvasManager.groupObj.parentContainerRecord = null
              }
            }
          }
        })

        // 鼠标移动事件：微调临时终止节点的位置，防止鼠标落在连线上
        scene.addEventListener('mousemove', function (e) {
          tempNodeZ.setLocation(e.x - 3, e.y + 3)
        })

        // 鼠标弹起事件：
        scene.addEventListener('mouseup', function (e) {
          sceneEventObj.mouseup && sceneEventObj.mouseup(e)

          // 判断事件源是否属于拓扑对象 JTopo 中节点、容器或容器节点的实例
          const isInstanceofElement =
            e.target instanceof JTopo.Node ||
            e.target instanceof JTopo.Container ||
            e.target instanceof JTopo.ContainerNode

          // 鼠标右键
          if (e.button === 2) {
            // scene.remove(link)
            return
          }

          // 如果连线模式开启
          if (setLink.isSetting) {
            // 如果存在事件源 且 事件源属于拓扑对象 JTopo 中的节点、容器或容器节点的实例
            if (e.target !== null && isInstanceofElement) {
              // 如果 stateManager.beginNode 为空
              if (stateManager.beginNode === null) {
                /** 第一次点击，生成连线 */

                // 将当前触发事件的节点赋值给 stateManager.beginNode
                stateManager.beginNode = e.target

                // 基于节点 tempNodeA 和 tempNodeZ 创建虚拟连线
                link = self._createLink(tempNodeA, tempNodeZ)
                // 将虚拟连线赋值给 stateManager.agentLink
                stateManager.agentLink = link
                // 将虚拟连线添加到场景中
                scene.add(link)

                // 设置临时节点的位置
                tempNodeA.setLocation(e.x-2, e.y-2)
                tempNodeZ.setLocation(e.x-2, e.y-2)
              }
              // 如果当前触发事件的节点不是 stateManager.beginNode
              else if (stateManager.beginNode !== e.target) {
                /** 第二次点击，完成连线 */

                const endNode = e.target

                //如果是容器节点和其内部的节点连线,或者其内部节点之间的连线，则不应该连线
                if ([stateManager.beginNode.parentType, endNode.parentType].indexOf('containerNode') < 0) {
                  let l = self._createLink(stateManager.beginNode, endNode)//正式连线
                  scene.add(l)
                }
                canvasManager.afterCreateLink&&canvasManager.afterCreateLink(stateManager.beginNode,endNode,l)
                // 设置开始节点为空
                stateManager.beginNode = null
                // 移除连线
                scene.remove(link) // TODO ?

                // 保存此次操作到一个 history 数组尾部
                toolbarManager.history.save()
              }
              else {
                stateManager.beginNode = null
              }
            }
            else {
              link && scene.remove(link)
            }
          }
        })

        //为工具栏管理者设置快捷键
        toolbarManager.setShortcutKey()
      },

      // 复现
      renderTopo(data, type) {
        const self = canvasManager
        const stage = stateManager.stage

        // 若不存在 type 或 type === 'add'
        if(!(type && type === 'add')) {
          // 移除当前场景
          stage.remove(stateManager.scene)

          // 重新 new 一个场景实例，并重新赋值给 stateManager.scene
          let scene = stateManager.scene = new JTopo.Scene(stage)

          // 绑定画布事件
          self.initCanvasEvent()
        }

        const idToNode = canvasManager.idToNode

        if (!data) {
          return
        }

        const nodesArr = data.nodes
        const linksArr = data.links
        let sceneTransX = 0
        let sceneTransY = 0

        // 复现与保存时，读取后台 links、nodes 数组中对象的属性，验证数据是否符合要求
        stateManager.setFormatNodesAndLinks(linksArr, nodesArr)

        /** 分开绘制是因为必须先有节点，后有容器，最后再有连线 */

        // 绘制节点
        for (let i = 0; i < nodesArr.length; i++) {
          let obj = nodesArr[i]

          if(typeof obj.json === 'string'){
            // 将 json 字符串转换为 json 对象
            // FIXME：eval 函数存在安全问题
            obj.json = eval('(' + obj.json + ')')
          }

          if (obj.json.elementType === 'node') {
            // 创建节点，注：调用这个方法时，一定要有个 id
            idToNode[obj.id] = self._createNode(obj)
          }

          if(i === 0 && obj.json.sceneTrans) {
            // 场景偏移量
            sceneTransX = obj.json.sceneTrans[0]
            sceneTransY = obj.json.sceneTrans[1]
          }
        }

        // 绘制自定义节点
        for (let i = 0; i < nodesArr.length; i++) {
          let obj = nodesArr[i]

          if(obj.json.elementType === 'containerNode'){
            idToNode[obj.id] =self.createUserDefinedNode(obj)
          }
        }

        // 绘制容器
        for (let i = 0; i < nodesArr.length; i++) {
          let obj = nodesArr[i]

          if (obj.json.elementType === 'container') {
            idToNode[obj.id] = self._createContainer(obj, idToNode)
          }
        }

        // 绘制线条
        for (let i = 0; i < linksArr.length; i++) {
          let obj = linksArr[i]

          if(typeof obj.json === 'string'){
            obj.json= eval('(' + obj.json + ')')
          }

          // 创建节点间的连线
          const link = self._createLink(idToNode[obj.from_id], idToNode[obj.to_id], obj)
          // 将连线添加到场景中
          link && scene.add(link)
        }

        stateManager.scene.translateX = sceneTransX
        stateManager.scene.translateY = sceneTransY

        // 开启节点元素动画效果
        canvasManager.elementShowEffect.start()

        canvasManager.idToNode = idToNode
        canvasManager.renderTopoCallback && canvasManager.isRunRenderCallback && canvasManager.renderTopoCallback()
      },

      // 保存
      saveTopo(callback, changeData) {
        // 获取后台所需节点字段：['id', 'type', 'json']
        const saveNodeAttr = stateManager.formatNodes
        // 获取后台所需容器节点字段：['id', 'type', 'json']
        const saveContainerNodeAttr = stateManager.formatContainerNodes
        // 获取后台所需容器字段：['id', 'type', 'json']
        const saveContainerAttr = stateManager.formatContainers
        // 获取后台所需线条字段：['id', 'type', 'from_id', 'to_id', 'json']
        const saveLinkAttr = stateManager.formatLinks

        const nodes = []
        const links = []

        // dataArr: [c, c, c, ...]
        // c: {
        //   alarmColor: "255,0,0", alpha: 0.5833333333333333, beforePaintCallback: null, borderColor: "223,226,228", borderRadius: 5, borderWidth: 1, colorStop: null, detailText: "liyin$xing", dragable: true, editAble: false, elementType: "node", fillAlarmNode: (3) [255, 0, 0], fillColor: "255,255,255", font: "12px Consolas", fontColor: "234,32,0", height: 85, id: "101", imgName: "", inLinks: null, isMouseOver: false, json: {x: 160, y: 100, width: 185, height: 85, text: "liyin$xing", …}, keepChangeColor: false, linearGradient: null, messageBus: MessageBus {name: undefined, messageMap: {…}, messageCount: 6, subscribe: ƒ, unsubscribe: ƒ, …}, nodeFn: null, nodeOriginColor: null, outLinks: null, paint: ƒ (a), paintCallback: null, propertiesStack: [], rotate: 0, scaleX: 1, scaleY: 1, selected: true, selectedLocation: null, selectedPoint: null, serializedProperties: (29) ["elementType", "x", "y", "width", "height", "visible", "alpha", "rotate", "scaleX", "scaleY", "strokeColor", "fillColor", "shadow", "shadowColor", "shadowOffsetX", "shadowOffsetY", "transformAble", "zIndex", "dragable", "selected", "showSelected", "isMouseOver", "text", "font", "fontColor", "textPosition", "textOffsetX", "textOffsetY", "borderRadius"], shadow: false, shadowBlur: 5, shadowColor: "rgba(0,0,0,0.5)", shadowOffsetX: 3, shadowOffsetY: 6, showAlarmText: false, showSelected: true, smallAlarmImageChangeObj: null, smallAlarmImageObj: null, smallAlarmImageTag: false, smallAlarmImage_h: 20, smallAlarmImage_w: 20, smallAlarmImage_x: null, smallAlarmImage_y: null, smallImageChangeColor: null, smallImageOriginColor: (3) [255, 0, 0], strokeColor: "22,124,255", text: "liyin$xing", textAlign: "left", textAlpah: 1, textBreakNumber: 5, textLineHeight: 15, textOffsetX: -50, textOffsetY: -20, textPosition: "Bottom_Center", transformAble: true, type: "node", visible: true, width: 185, x: 300, y: 300, zIndex: 3, _id: "front1529918150371145951",
        // }
        const dataArr = changeData || stateManager.scene.childs

        // console.log('dataArr')
        // console.log(dataArr)

        dataArr.filter(function (child) {
          // 节点元素类型是否是容器
          const isContainer = ['container'].indexOf(child.elementType) >= 0

          // 存储相应节点元素类型所需保存的字段结构
          const typeToSaveAttr = {
            "node": saveNodeAttr,
            "containerNode": saveContainerNodeAttr,
            "container": saveContainerAttr,
          }

          // 如果节点的父类型不是容器节点 且 节点的元素类型是节点、容器或容器节点的其中一个
          if (
            child.parentType !== 'containerNode'
            && ['node', 'container', 'containerNode'].indexOf(child.elementType) >= 0
          ) {
            // nodeObj: {id: xxx, type: xxx, json: {...},}
            const nodeObj = {}
            // saveAttrArr: ['id', 'type', 'json'] | ['id', 'type', 'from_id', 'to_id', 'json']
            const saveAttrArr = typeToSaveAttr[child.elementType]

            // 后台所需数据
            // saveAttrArr: ['id', 'type', 'json', ...]
            for (let m = 0; m < saveAttrArr.length; m++) {
              // attr: id | type | json
              let attr = saveAttrArr[m]
              // nodeObj: {id: xxx, type: xxx, json: xxx,}
              nodeObj[attr] = child[attr]
            }

            // 前端数据
            if (!nodeObj.json) {
              nodeObj.json = {}
            }

            // console.log('child')
            // console.log(child)

            // 以任意顺序遍历 child 对象的所有可枚举属性，包括继承属性
            for (let m1 in child) {
              let value = child[m1]

              // 如果对象中的属性需要保存
              if (stateManager.attrIsNeedSave(m1, value, child.elementType)) {
                nodeObj.json[m1] = value
              } else if (isContainer && m1 === 'childs') { // 如果节点元素类型是容器 且 如果节点属性的字段名是 'childs'

                nodeObj.json.childsArr = []

                // 保存容器的 child 的 id 到 childsArr
                // 遍历 child.json 中的属性键
                for (let m2 = 0; m2 < value.length; m2++) {
                  const containerChilds = value[m2]

                  // console.log('containerChilds')
                  // console.log(containerChilds.parentType)

                  if (containerChilds.parentType === "containerNode") {
                    // 自定义节点
                    // 获取自定义结点的 id
                    const parentId = containerChilds.parentId

                    // 判断数组中是否已经存在
                    if (nodeObj.json.childsArr.indexOf(parentId) < 0) {
                      nodeObj.json.childsArr.push(parentId)
                    }
                  } else {
                    // 普通节点
                    nodeObj.json.childsArr.push(containerChilds.id || containerChilds._id)
                  }
                }
              }
            }

            // 存储场景位移数据到 nodeObj.json 中
            nodeObj.json.sceneTrans = [stateManager.scene.translateX, stateManager.scene.translateY]
            // 将一个 JavaScript 值(对象或者数组)转换为一个 JSON 字符串
            nodeObj.json = JSON.stringify(nodeObj.json)

            // 将 nodeObj 添加到 nodes 数组中
            nodes.push(nodeObj)
          }
          else if(child.elementType === 'link'){
            const linkObj = {}

            for(let n = 0; n < saveLinkAttr.length; n++){
              let attr = saveLinkAttr[n]

              if (['from_id'].indexOf(attr) >= 0){
                linkObj[attr] = child.nodeA.id
              } else if (['to_id'].indexOf(attr) >= 0){
                linkObj[attr] = child.nodeZ.id
              } else {
                linkObj[attr] = child[attr]
              }
            }

            if (!linkObj.json) {
              linkObj.json = {}
            }

            for (let n1 in child) {
              let value = child[n1]
              if (stateManager.attrIsNeedSave(n1, value, child.elementType)) {
                linkObj.json[n1] = value
              }
            }

            linkObj.json = JSON.stringify(linkObj.json)

            links.push(linkObj)
          }
        })

        return {
          nodes,
          links,
        }
      },

      // 处理缩略
      fnDoBriefText(node) {
        if (node.ellipsisLength) {
          const chineseNum = node.text.getChineseNum()
          const len = node.text.length
          if (chineseNum && (len + chineseNum > node.ellipsisLength)) {
            const subChineseNum = node.text.substring(0, node.ellipsisLength).getChineseNum()
            if (subChineseNum) {
              node.text = node.text.substring(0, node.ellipsisLength - subChineseNum / 2 - 1) + '...'
            } else {
              node.text = node.text.substring(0, node.ellipsisLength - 1) + '...'
            }
          } else if (len > node.ellipsisLength) {
            node.text = node.text.substring(0, node.ellipsisLength - 1) + '...'
          }
        }
      },

      /** 节点处理，start */
      // 创建拖拽后的节点，初始化节点
      createNodeByDrag($thisClone, mDown, e) {
        const scene = stateManager.scene
        const self = canvasManager
        const jsonObj = eval('(' + $thisClone.attr('json') + ')')
        jsonObj.width = jsonObj.width || 100
        jsonObj.height = jsonObj.height || 50
        const subWidth = e.pageX - jsonObj.width / 2 - stateManager.equipmentAreaWidth - $('#equipmentArea').offset().left + stateManager.fineTuneMouseUpX
        const subHeight = e.pageY - jsonObj.height / 2 - $('#canvas').offset().top + stateManager.fineTuneMouseUpY
        // 松开鼠标时,元素在画布上的 x 坐标
        const nodeX = subWidth - scene.translateX
        //松开鼠标时,元素在画布上的 y 坐标
        const nodeY = subHeight - scene.translateY

        if (subWidth > 0 && subHeight > 0 && mDown) {
          var node = new JTopo.Node()
          node.setLocation(nodeX, nodeY)
          node.font = "14px Consolas"
          node.text = $thisClone.attr('nodeName')
          node.fillColor = '255,255,255'
          node.fontColor = '85,85,85'
          node.textPosition = 'Bottom_Center'
          node.textOffsetY =5
          node.json=jsonObj

          if (JTopo.flag.topoImgMap) {
            node.setImage(jsonObj.imgName, 'imageDataFlow')
          } else {
            jsonObj.imgName && node.setImage(JTopo.flag.imageUrl + jsonObj.imgName + '.png')
            jsonObj.imgUrl && node.setImage(jsonObj.imgUrl)
          }

          node.id = node._id
          self._setNodeEvent(node)

          scene.add(node)
          for (let i in jsonObj) {
            node[i] = jsonObj[i]
          }
          //节点省略处理
          node.detailText = node.detailText || node.text
          canvasManager.fnDoBriefText(node)

          stateManager.isNeedSave = true
        }
        return node
      },

      // 创建节点，注：调用这个方法时，一定要有个 id
      _createNode(obj) {
        const scene = stateManager.scene
        const self = canvasManager
        const node = new JTopo.Node()

        console.log(node)
        console.log(new JTopo.Node())

        //设置后台数据
        for (let i in obj) {
          node[i] = obj[i]
        }

        //设置前端元素数据
        for (let j in obj.json) {
          if (stateManager.formatNodes.indexOf(j) < 0){
            node[j] = obj.json[j]
          }
        }

        if (JTopo.flag.topoImgMap) {
          node.setImage(node.imgName, 'imageDataFlow')
        } else {
          node.imgName && node.setImage(JTopo.flag.imageUrl + node.imgName + '.png')
          node.imgUrl && node.setImage(node.imgUrl)
        }

        self._setNodeEvent(node)
        scene.add(node)

        // setSmallImage 为设置小图标
        // node.setImage('./images/alertIcon2.png','setSmallImage')
        // 结点,是否变色,是否闪动,底色,变色
        // 节点省略处理
        // JTopo.util.smallNodeFlash(node,true,true,[202,202,202],[222,81,69])

        node.detailText = node.detailText || node.text
        canvasManager.fnDoBriefText(node)

        return node
      },

      // 设置节点的事件
      _setNodeEvent(node) {
        const nodeEventObj = canvasManager.nodeEvent
        let clickTimeHandle = null
        node.addEventListener('mouseup', function (e) {
          clearTimeout(clickTimeHandle)

          const thisObj = this

          clickTimeHandle = setTimeout(function () {
            $('.contextmenu').hide()
            toolbarManager.history.save()
            stateManager.currentChooseElement = thisObj
            stateManager.currentNode = thisObj
            nodeEventObj.mouseup && nodeEventObj.mouseup(e)
            stateManager.isNeedSave=true
          }, 300)

          if(stateManager.isCreateGroupByDrag) {
            const nodeObj = e.target
            let runTag = true
            JTopo.flag.curScene.childs.forEach(function (child) {
              if (runTag && !nodeObj.parentContainer && child.elementType == "container") {

                if (nodeObj.x > child.x && nodeObj.x + nodeObj.width < child.x + child.width && nodeObj.y > child.y && nodeObj.y + nodeObj.height < child.y + child.height) {
                  runTag = false
                  child.add(nodeObj)
                }
              }
            })
          }
        })
        node.addEventListener('mousedown', function (e) {
          stateManager.currentChooseElement = this
          stateManager.currentNode = this
          nodeEventObj.mousedown&&nodeEventObj.mousedown(e)
        })
        node.addEventListener('mousemove', function (e) {
          stateManager.currentChooseElement = this
          stateManager.currentNode = this
          nodeEventObj.mousemove&&nodeEventObj.mousemove(e)

        })
        node.addEventListener('mouseover', function (e) {
          stateManager.currentChooseElement = this
          stateManager.currentNode = this
          nodeEventObj.mouseover&&nodeEventObj.mouseover(e)
          //节点省略处理
          e.target.text=e.target.detailText
        })
        node.addEventListener('mouseout', function (e) {
          $(".titleDiv").hide()
          e.target=stateManager.currentNode
          nodeEventObj.mouseout&&nodeEventObj.mouseout(e)
          canvasManager.fnDoBriefText(e.target)
        })
        node.addEventListener('dbclick', function (e) {
          clearTimeout(clickTimeHandle)
          stateManager.currentChooseElement=this
          stateManager.currentNode = this
          nodeEventObj.dbclick&&nodeEventObj.dbclick(e)
        })
      },
      /** 节点处理，end */

      /** 自定义节点处理，start */
      //拖拽创建自定义节点
      createUserDefinedNodeByDrag($thisClone, mDown,e) {
        const jsonObj = eval('(' + $thisClone.attr('json') + ')')
        const scene = stateManager.scene
        const obj = {
          json: jsonObj
        }
        const subWidth = e.pageX - jsonObj.width / 2 - stateManager.equipmentAreaWidth - $('#equipmentArea').offset().left + stateManager.fineTuneMouseUpX
        const subHeight = e.pageY - jsonObj.height / 2 - $('#canvas').offset().top + stateManager.fineTuneMouseUpY
        obj.json.x =subWidth - scene.translateX//松开鼠标时,元素在画布上的x坐标
        obj.json.y=subHeight - scene.translateY//松开鼠标时,元素在画布上的y 坐标

        const nodeFn = obj.json.nodeFn
        const userDefinedNode = canvasManager[nodeFn](obj)

        userDefinedNode.id=userDefinedNode._id
        //设置后台数据
        for (let k in obj) {
          userDefinedNode[k] = obj[k]
        }
        //设置前端元素数据
        for(let j in  obj.json){
          if(stateManager.formatContainerNodes.indexOf(j)<0){
            //luozheao
            userDefinedNode[j]= obj.json[j]
          }
        }
        // !obj.id&&(obj.id=userDefinedNode._id)
        // idToNode[obj.id] =userDefinedNode
        canvasManager._setUserDefinedNodeEvent(userDefinedNode,canvasManager['userDefinedNodeEvent_'+nodeFn])
      },
      createUserDefinedNode(obj) {
        const nodeFn = obj.json.nodeFn
        const self = canvasManager
        const userDefinedNode = self[nodeFn](obj)
        //设置后台数据
        for (let k in obj) {
          userDefinedNode[k] = obj[k]
        }
        //设置前端元素数据
        for(let j in  obj.json){
          if(stateManager.formatContainerNodes.indexOf(j)<0){
            //luozheao
            userDefinedNode[j]= obj.json[j]
          }
        }
        self._setUserDefinedNodeEvent(userDefinedNode,canvasManager['userDefinedNodeEvent_'+nodeFn])
        return userDefinedNode
      },

      //设置自定义节点的事件
      _setUserDefinedNodeEvent(definedNode,eventObj) {
        for(let eventName in eventObj){
          const fn = eventObj[eventName];
          (function (definedNode,eventName,fn) {
            definedNode.addEventListener(eventName, function (e) {
              //通用事件
              if(eventName=='mouseup'){
                $('.contextmenu').hide()
                toolbarManager.history.save()
                stateManager.currentChooseElement=this
              }else if(eventName=='dbclick'){
                $('.contextmenu').hide()
                stateManager.currentChooseElement=this
              }
              //自定义事件
              fn&&fn(e)
            })
          })(definedNode,eventName,fn)
        }
      },
      /** 自定义节点处理，end */

      /** 容器处理，start */
      //设置节点成容器,初始化容器
      setNodesToGroup(nodeArr,jsonObj) {
        const scene = stateManager.scene
        const eleArr = nodeArr ? nodeArr : scene.selectedElements.filter(function (obj) {
          return (obj.elementType == 'node' || obj.type == 'node')
        })
        if (eleArr.length > 0) {
          const container = new JTopo.Container('')
          container.textPosition = 'Top_Bottom'
          container.fontColor = '255,255,255'
          container.font = '16px 微软雅黑'
          container.fillColor = '79,164,218'
          container.alpha=0
          container.textAlpha=1
          container.shadowBlur =5
          container.shadowColor = "rgba(43,43,43,0.5)"
          container.borderColor='108,208,226'
          container.borderWidth=1
          container.borderDashed=false//边框成虚线，一定要设置borderRadius大于0
          container.borderRadius = 5 // 圆角
          container.id=container._id
          container.type='container'
          for(let k in jsonObj){
            container[k]=jsonObj[k]
          }

          for (let i = 0; i < eleArr.length; i++) {
            eleArr[i].selected = false
            container.add(eleArr[i])
          }

          this._setGroupEvent(container)
          scene.add(container)
          stateManager.isNeedSave=true
        }
      },

      //创建容器
      _createContainer(obj, idToNode) {
        const stage = stateManager.stage
        const scene = stateManager.scene
        const self = canvasManager
        const container = new JTopo.Container('')
        container.type='container'
        //设置后台数据
        for (let i in obj) {
          container[i] = obj[i]
        }

        //设置前端元素数据
        for(let j in  obj.json){
          if(stateManager.formatNodes.indexOf(j)<0){
            container[j]= obj.json[j]
          }
          if (j == 'childsArr') {
            for (let k = 0; k < obj.json[j].length; k++) {
              const childObj = idToNode[obj.json[j][k]]
              if(childObj.elementType=="containerNode"){
                childObj.childs.filter(function (p1, p2, p3) {
                  container.add(p1)
                })
              }else{
                container.add(childObj)
              }
            }
          }
        }


        self._setGroupEvent(container)
        scene.add(container)
        return container
      },

      //设置容器的事件
      _setGroupEvent(container) {
        const containerEventObj = canvasManager.containerEvent
        container.addEventListener('mouseup', function (e) {
          $('.contextmenu').hide()
          toolbarManager.history.save()
          stateManager.currentContainer = this
          stateManager.currentChooseElement=this
          containerEventObj.mouseup&&containerEventObj.mouseup(e)
        })
        container.addEventListener('mouseover', function (e){
          stateManager.currentContainer = this
          stateManager.currentChooseElement=this
          containerEventObj.mouseover&&containerEventObj.mouseover(e)
        })
        container.addEventListener('mouseout', function (e){
          e.target=stateManager.currentContainer
          containerEventObj.mouseout&&containerEventObj.mouseout(e)
        })
        container.addEventListener('mousemove', function (e){
          stateManager.currentContainer = this
          stateManager.currentChooseElement=this
          containerEventObj.mousemove&&containerEventObj.mousemove(e)
        })
        container.addEventListener('dbclick', function (e){
          stateManager.currentContainer = this
          stateManager.currentChooseElement=this

          containerEventObj.dbclick&&containerEventObj.dbclick(e)
        })

      },
      /** 容器处理，end */

      /** 线条处理，start */
      // 创建节点间的连线
      _createLink(sNode, tNode,linkObj) {
        let link
        let slinkType = null

        if (linkObj) {
          slinkType = linkObj.json.linkType
        }

        const linkType = slinkType ? slinkType : (stateManager.setLink.linkType || 'arrow')

        if (!sNode || !tNode) {
          return
        }

        if (linkType === 'Link') {
          // 实线
          link = new JTopo.Link(sNode, tNode)
        } else if (linkType === 'arrow') {
          // 箭头
          link = new JTopo.Link(sNode, tNode)
          // 箭头大小
          link.arrowsRadius = 10
          link.drawanimepic("images/p.png", JTopo.flag.curScene, 100, 10,  5, 5 , 1, 1,5000, 1)
        } else if (linkType === 'dArrow') {
          // 双箭头
          link = new JTopo.Link(sNode, tNode)
          link.arrowsRadius = 10
        } else if (linkType === 'dashed') {
          // 虚线
          link = new JTopo.Link(sNode, tNode)
          link.dashedPattern = 5
          // link.arrowsRadius = 10
        } else if (linkType === 'curve') {
          // 曲线
          link = new JTopo.CurveLink(sNode, tNode)
        } else if (linkType === 'flexional') {
          // 折线
          link = new JTopo.FlexionalLink(sNode, tNode)
          // horizontal 水平，vertical 垂直
          link.direction = 'horizontal'
          link.arrowsRadius = 10
          link.flexionalRadius = 0
          link.offsetGap = 50
        } else if (linkType === 'flow') {
          link = new JTopo.Link(sNode, tNode)
          link.arrowsRadius = 10
          // 连线颜色
          link.PointPathColor = "rgb(237,165,72)"
        } else if (linkType === 'userDefine') {
          link = new JTopo.Link(sNode, tNode)
          link.arrowsRadius = 10
          link.PointPathColor = "rgb(237,165,72)"
        }

        if (link) {
          this._setLinkEvent(link)
          link.linkType = linkType
          link.lineWidth = 0.7
          link.strokeColor = '43,43,43'
          link.linkConnectType = 'toBorder'
          link.bundleGap = 15
          link.id = link._id
          link.type = 'link'
          stateManager.isNeedSave = true

          if (linkObj) {
            for (let i in linkObj) {
              link[i] = linkObj[i]
            }

            for (let j in linkObj.json) {
              if (stateManager.formatLinks.indexOf(j) < 0) {
                link[j] = linkObj.json[j]
              }
            }
          }

        }
        return link
      },

      //设置线条事件
      _setLinkEvent(link) {
        const linkEventObj = canvasManager.linkEvent
        link.addEventListener('mouseup', function (e) {
          $('.contextmenu').hide()
          stateManager.currentLink = this
          stateManager.currentChooseElement=this
          toolbarManager.history.save()
          linkEventObj.mouseup&&linkEventObj.mouseup(e)
          stateManager.isNeedSave=true
        })
        link.addEventListener('mousemove', function (e) {
          stateManager.currentLink = this
          stateManager.currentChooseElement=this
          linkEventObj.mousemove&&linkEventObj.mousemove(e)
        })
        link.addEventListener('mouseover', function (e) {
          stateManager.currentLink = this
          stateManager.currentChooseElement=this
          linkEventObj.mouseover&&linkEventObj.mouseover(e)
        })
        link.addEventListener('mouseout', function (e) {
          e.target=  stateManager.currentLink
          linkEventObj.mouseout&&linkEventObj.mouseout(e)
        })
        link.addEventListener('dbclick', function (e) {
          stateManager.currentLink = this
          stateManager.currentChooseElement=this
          linkEventObj.dbclick&&linkEventObj.dbclick(e)
        })
      },
      /** 线条处理，end */

      init: function () {
        // 获取 canvas 元素对象
        const canvas = stateManager.canvas = document.getElementById('canvas')
        // 将获取的 canvas 元素作为参数传给 JTopo.Stage 构造器，然后 new 一个 stage 舞台实例
        const stage = stateManager.stage = new JTopo.Stage(canvas)
        // 将 stage 舞台实例作为参数传给 JTopo.Scene 构造器，然后 new 一个 scene 场景实例
        const scene = stateManager.scene = new JTopo.Scene(stage)

        canvasManager.userDefinedNodes.filter(function (p1, p2, p3) {
          canvasManager[p1.fnName]=p1.fn
          canvasManager['userDefinedNodeEvent_'+p1.fnName]=p1.event
        })
        canvasManager.setCanvasStyle()  //设置画布大小
        canvasManager.initCanvasEvent() //canvas 事件初始化
      }
    }
    // 数据管理者：用于接受 topo 数据，并展示到画布上来
    const dataManager = {
      /** 数据层 */
      // 获取后台拓扑图数据
      getTopoData () {},
      /** 显示层 */
      showTopoData(data) {
        canvasManager.renderTopo(data)
        toolbarManager.history.save()
      },
      /** 控制层 */
      setTopoData(data) {
        const self = dataManager
        const showTopoData = self.showTopoData
        if (data) {
          self.showTopoData(data)
        } else {
          self.getTopoData(showTopoData)
        }
      },
      // 存储拓扑图数据
      saveTopoData() {},
      init() {
        dataManager.setTopoData()
      },
    }
    // 状态管理者：用于存放全局状态,比如选中一个节点,右侧滑出弹窗,弹窗展现节点的属性
    const stateManager = {
      // 存储 stage 舞台实例
      stage: {},
      // 储存 scene 场景实例，系统节点
      scene: {},
      // 储存 canvas 元素对象
      canvas: {},
      // TODO: ?
      equipmentAreaWidth: 250,
      // 设置连接线的模式和样式
      setLink: {
        // 是否开启连线模式
        isSetting: false,
        // 线条类型：实线、箭头、双箭头、虚线、曲线、折线
        linkType: ''
      },
      // 判断画布内容是否改变,用于是否保存
      isNeedSave: false,
      // 鼠标松开后,微调节点的 x 位置
      fineTuneMouseUpX: 0,
      fineTuneMouseUpY: 0,
      // 目录树样式设置
      curExpandNode: null,
      currentChooseElement: null,
      // 当前选中的节点
      currentNode: null,
      // 当前选中的容器节点
      currentContainerNode: null,
      // 当前选中的容器
      currentContainer: null,
      // 当前选中的线条
      currentLink: null,
      // 储存虚拟连线
      agentLink: null,
      beginNode: null,
      // 当前树节点的拓扑图，包含物理、逻辑、系统、业务流程 ，analysisTopo 会给它赋值
      currentTopo: [],
      // 当前选中拓扑图的序号
      currentActiveIndex: null,
      // 当前选中的树节点
      currentTreeNode: null,
      // 初次加载页面
      isFirstLoad: true,
      // 判断是否属于本地环境
      isLocalhost: window.location.href.indexOf('localhost:') >= 0,
      // 点击系统视图节点，触发子拓扑图打开，并切换到系统视图或逻辑拓扑
      isFromParentTree: false,
      // 当前是否全屏的状态
      isFullScreen: false,
      // 是否拖动成组
      isCreateGroupByDrag: false,
      scrollHeight: 0,
      // 复现与保存时，读取后台 nodes 数组中 node 对象的属性
      formatNodes: ['id', 'type', 'json'],
      // 复现与保存时，读取后台 nodes 数组中 containerNode 对象的属性
      formatContainerNodes: ['id', 'type', 'json'],
      // 复现与保存时，读取后台 nodes 数组中 container 对象的属性
      formatContainers: ['id', 'type', 'json'],
      // 复现与保存时，读取后台 links 数组中对象的属性
      formatLinks: ['id', 'type', 'from_id', 'to_id', 'json'],
      // 复现与保存时，读取后台 links、nodes 数组中对象的属性，验证数据是否符合要求
      setFormatNodesAndLinks(linksArr, nodesArr) {
        console.log('setFormatNodesAndLinks -- nodesArr: ')
        console.log(nodesArr)

        // 遍历验证数据格式是否符合要求（节点类型为 node、containerNode、container）
        for (let k = 0; k < nodesArr.length; k++) {
          let obj = nodesArr[k]

          sugar(null, null, obj.type)

          if (obj.type === "node" && stateManager.formatNodes.length === 3) {
            for (let m in obj) {
              stateManager.formatNodes.indexOf(m) < 0 && stateManager.formatNodes.push(m)
            }
            sugar(stateManager.formatNodes, obj.json, obj.type)
          } else if (obj.type === "containerNode" && stateManager.formatContainerNodes.length === 3) {
            for (let m in obj) {
              stateManager.formatContainerNodes.indexOf(m) < 0 && stateManager.formatContainerNodes.push(m)
            }
            sugar(stateManager.formatContainerNodes, obj.json, obj.type)
          } else if (obj.type === "container" && stateManager.formatContainers.length === 3) {
            for (let m in obj) {
              stateManager.formatContainers.indexOf(m) < 0 && stateManager.formatContainers.push(m)
            }
            sugar(stateManager.formatContainers, obj.json, obj.type)
          }
        }

        // 遍历验证数据格式是否符合要求（连接线的数据格式）
        for (let i = 0; i < linksArr.length; i++) {
          if (stateManager.formatLinks.length === 5) {
            break
          }

          let obj = linksArr[i]

          for (let j in obj) {
            stateManager.formatLinks.indexOf(m) < 0 && stateManager.formatLinks.push(j)
          }
          sugar(stateManager.formatLinks, obj.json, obj.type)
        }

        //数据格式验证机制
        function sugar(arr, jsonStr, eleType) {
          const checkArr1 = ['id', 'json']
          const checkArr2 = ['elementType']
          const checkArr3 = ['nodeFn']

          if (typeof jsonStr !== 'string') {
            jsonStr = JSON.stringify(jsonStr)
          }

          const str2 = '必填项：id type json (elementType 必填，如果 elementType==containerNode，必填 nodeFn)，其中 elementType 和 type 值保持一致'

          if (!eleType) {
            console.log("数据格式缺少：type，请添加上去!!!\n" + str2)
          }
          if (!arr || arr.length === 0) {
            return false
          }

          const str = arr.join(',')

          checkArr1.forEach(function (p1, p2, p3) {
            if (str.indexOf(p1) < 0) {
              console.log(eleType + "的数据格式缺少:" + p1 + ",请添加上去!!!\n" + str2)
            }
          })

          checkArr2.forEach(function (p1, p2, p3) {
            if (jsonStr.indexOf(p1) < 0) {
              console.log(eleType + "的数据格式缺少:" + p1 + ",请添加上去!!!\n" + str2)
            }
          })

          checkArr3.forEach(function (p1, p2, p3) {
            if (jsonStr.indexOf(p1) < 0 && eleType === "containerNode") {
              console.log(eleType + "的数据格式缺少:" + p1 + ",请添加上去!!!\n" + str2)
            }
          })
        }
      },
      // 移除用于连接的线条
      removeAgentLink() {
        stateManager.agentLink && stateManager.scene.remove(stateManager.agentLink)
        stateManager.beginNode = null
      },
      /**
       * 判断对象中的属性是否应该保存
       *
       * @param {String} attr - 属性键
       * @param {any} value - 属性值
       * @param {String} elementType - 属性值
       * @return {Boolean}
       */
      attrIsNeedSave(attr, value, elementType) {
        const attrArr = ['lastParentContainer', 'propertiesStack', 'serializedProperties', 'animateNode', 'childs', 'image', 'inLinks', 'messageBus', 'outLinks', 'json', 'nodeA', 'nodeZ', 'selectedLocation', 'parentContainer']

        // 如果节点元素类型是容器节点
        if (elementType === 'containerNode') {
          // 将 'childs' 添加到数组 attrArr 中
          attrArr.push('childs')
        }

        // 返回需要保存的属性键是否存在于 attrArr 中
        return attrArr.indexOf(attr) < 0
      },
      /** 辅助方法 */
      // 本地环境下的特殊处理,比如本地环境下的一级目录过长，则隐藏掉
      setStateUnderLocalHost() {
        // 顶部一级目录过长，则在本地隐藏部分用不上的目录, 8888 是我的端口
        if (this.isLocalhost) {}
      },

      init() {
        const self = this

        //监控滚动条滚动距离 TODO: ?
        /*$('#appMain')
          .scroll(function () {
            self.scrollHeight = $(this).scrollTop()
            conosle.log('监控滚动条滚动距离:')
            conosle.log(self.scrollHeight)
          })*/

        this.setStateUnderLocalHost()
      }
    }
    // 权限管理者：未完成,等待勇敢的少年来拓展
    const powerManager = {
      /** 状态：显示模式或编辑模式 */
      isViewModel: false,

      /** 显示层 */
      /** 数据层 */
      /** 控制层 */

      init() {}
    }
    // 弹窗管理者：未完成,等待勇敢的少年来拓展
    const popupManager = {
      /** 辅助方法 */
      //弹窗隐藏
      popHide() {},
      init() {},
    }
    // 工具栏管理者：包含放大\缩小\全屏\鹰眼\线条类型选择等功能
    const toolbarManager = {
      // 用于搜索的属性
      searchArr: ['id'],
      history: {
        arr: [],
        curIndex: -1,
        save() {
          const arr = canvasManager.saveTopo()
          // 截取
          this.arr.length = this.curIndex + 1
          this.arr.push(arr)
          this.curIndex++
        },
        clear() {
          this.arr = []
          this.curIndex = -1
        },
        prev() {
          let index = this.curIndex
          --index
          if (index >= 0) {
            this.curIndex = index
            const data = JTopo.util.copy(this.arr[this.curIndex])
            canvasManager.renderTopo(data)
          }
        },
        next() {
          let index = this.curIndex
          ++index
          if (index < this.arr.length) {
            this.curIndex = index
            const data = JTopo.util.copy(this.arr[this.curIndex])
            canvasManager.renderTopo(data)
          }
        },
      },
      historyOperCallback: null,

      /** 显示层 */
      /** 控制层 */

      // 工具栏上面的按钮对应的事件
      aEvents: [
        // 工具栏点击所有弹窗都关闭
        ['click', '#toolbar', function () {
          popupManager.popHide()
        }],
        // 缩放
        ['click', '.zoomArea>.btn', function () {
          const $zoom = $(this).find('>div')
          const self = toolbarManager
          const zoom = 0.9
          const stage = stateManager.stage
          const scene = stateManager.scene
          const canvas = stateManager.canvas

          if ($zoom.hasClass('toolbar-zoomin')) {
            //放大
            scene.zoomOut(zoom)
          } else if ($zoom.hasClass('toolbar-zoomout')) {
            //缩小
            scene.zoomIn(zoom)
          } else if ($zoom.hasClass('toolbar-zoomreset')) {
            //1:1
            scene.zoomReset()
          } else if ($zoom.hasClass('toolbar-center')) {
            //缩放并居中显示
            stateManager.scene.translateX = 0
            stateManager.scene.translateY = 0
            stateManager.scene.translateToCenter()
            stateManager.stage.eagleEye.update()
          } else if ($zoom.hasClass('toolbar-overview')) {
            const screenWidth = window.screen.width
            const screenHeight = window.screen.height
            //全屏
            canvasManager.fullScreen(canvas, "RequestFullScreen")

            setTimeout(function () {
              setCanvasScreen()
              setTimeout(function () {
                setCanvasScreen()
              }, 300)
            }, 100)

            function setCanvasScreen() {
              $('#canvas')
                .attr('width', screenWidth)
                .attr('height', screenHeight)
                .css('margin-top', '0px')

              stateManager.isFullScreen = true
              stateManager.scene.translateX = 0
              stateManager.scene.translateY = 0
              // stateManager.scene.centerAndZoom()
              stateManager.scene.translateToCenter()
            }
          }
        }],
        // 模式
        ['click', '.patternArea>.btn', function () {
          const scene = stateManager.scene
          const self = toolbarManager
          const $pattern = $(this).find('>div')

          self._setActiveBtn($(this))
          stateManager.setLink.isSetting = false

          // 取消选中
          stateManager.scene.selectedElements.forEach(function (p) {
            p.selected = false
          })

          if ($pattern.hasClass('toolbar-default')) {
            // 默认
            scene.mode = "normal"
          } else if ($pattern.hasClass('toolbar-setBorder')) {
            // 边框
            scene.mode = "edit"
          } else if ($pattern.hasClass('toolbar-select')) {
            // 框选
            scene.mode = "select"
            $('#toolbar .groupWrap').removeClass('hide')
          }
          else if ($pattern.hasClass('toolbar-pan')) {
            // 浏览
            scene.mode = "drag"
          }
        }],
        // 鹰眼
        ['click', '.eyesWrap', function () {
          toolbarManager.setEagleEye()
        }],
        // 搜索
        ['click', '.searchWrap>.btn', function () {
          const text = $('#search_input').val().trim().toLowerCase()
          const scene = stateManager.scene
          const searchArr = toolbarManager.searchArr

          scene.childs.filter(function (child, p2, p3) {
            for (let i = 0; i < searchArr.length; i++) {
              const attr = searchArr[i]
              if (child[attr] && child[attr].indexOf(text) >= 0) {
                child.selected = true
                break
              }
            }
          })
        }],
        ['keyup', '#search_input', function (e) {
          if (e.which === 13) {
            $('.searchWrap >.btn').click()
          }
        }],
        //连线
        ['click', '.chooselineArea>.btn', function () {
          const $line = $(this)

          stateManager.setLink.linkType = $line.attr('lineType')

          const self = toolbarManager
          const linkType = ''

          self._setActiveBtn($(this))
          stateManager.setLink.isSetting = true
        }],
        //历史操作
        ['click', '.historyArea>.btn', function () {
          if ($(this).hasClass('backOff')) {
            toolbarManager.history.prev()
            toolbarManager.historyOperCallback && toolbarManager.historyOperCallback()
          } else if ($(this).hasClass('forward')) {
            toolbarManager.history.next()
            toolbarManager.historyOperCallback && toolbarManager.historyOperCallback()
          } else if ($(this).hasClass('saveBtn')) {
            stateManager.currentActiveIndex = null
            const data = canvasManager.saveTopo()
            dataManager.saveTopoData(data)
          }
        }],
        //设置成组
        ['click', '.groupWrap.btn', function () {
          canvasManager.setNodesToGroup()
          toolbarManager.history.save()
        }],
      ],
      // 设置当前选中按钮激活样式
      _setActiveBtn($curObj) {
        $('.patternArea').find('.active').removeClass('active')
        $('.chooselineArea .active').removeClass('active')
        $curObj.addClass('active')
        $('#toolbar .groupWrap').addClass('hide')
      },
      // 快捷键
      setShortcutKey() {
        // 存储场景实例
        const scene = stateManager.scene

        // 设置快捷键
        scene.addEventListener('keyup', function (e) {
          // 若是显示模式，则直接返回，不做任何处理
          if (powerManager.isViewModel) {
            return
          }

          if (e.ctrlKey && e.which === 13) { // Ctrl + Enter
            // 当按下 Ctrl + Enter 时，触发一次工具栏上的 ‘组’ 按钮：设置成组
            $('.groupWrap').click()
          } else if (e.ctrlKey && e.which === 8) { // Ctrl + 退格
            // 当按下 Ctrl + 退格时，删除选中的所有节点元素
            scene.selectedElements.filter(function (e) {
              if (e.selected) {
                e.childs
                && e.childs.length > 0
                && e.childs.filter(function (child) {
                  scene.remove(child)
                })

                scene.remove(e)
              }
            })
          } else if (e.which === 27) { // ESC
            // 当按下 ESC 时，触发一次工具栏上的 ‘默认模式’ 按钮：设置默认模式
            $('.patternArea .toolbar-default').click()
          }

          // 若在全屏模式下
          if (stateManager.isFullScreen) {
            if (187 === e.keyCode && e.shiftKey) { // 'shift' + '+'
              // 当按下 'shift' + '+' 时，放大画布场景
              stateManager.scene.zoomOut(0.9)
            } else if (189 === e.keyCode && e.shiftKey) { // 'shift' + '_'
              // 当按下 'shift' + '_' 时，缩小画布场景
              stateManager.scene.zoomIn(0.9)
            } else if (32 === e.keyCode) { // 空格
              // 当按下 空格 时，场景的位移设为 0，居中和缩放场景中的节点
              stateManager.scene.translateX = 0
              stateManager.scene.translateY = 0
              stateManager.scene.centerAndZoom()
            }
          }
        })
      },
      /** 辅助方法 */
      // 鹰眼设定
      setEagleEye(b) {
        const stage = stateManager.stage

        stage.eagleEye.visible = b !== undefined
          ? b
          : !stage.eagleEye.visible

        stage.eagleEye.update()
      },
      // 工具栏样式和恢复到默认状态,对外开放
      reset() {
        const stage = stateManager.stage

        $('#toolbar').find('.active').each(function () {
          $(this).removeClass('active')
        })

        $('.patternArea .toolbar-default').parent().click()

        setTimeout(function () {
          // 鹰眼设定
          toolbarManager.setEagleEye(false)
        }, 0)

        // 隐藏组按钮
        $('#toolbar .groupWrap').addClass('hide')

        // 历史数据清空，并注入初始值
        toolbarManager.history.clear()

        // 第一次加载
        if (stateManager.isFirstLoad) {
          stateManager.isFirstLoad = false
        }
      },

      init() {
        //事件初始化
        const aEvents = this.aEvents
        for (let i = 0; i < aEvents.length; i++) {
          $(aEvents[i][1]).on(aEvents[i][0], aEvents[i][2])
        }
      }
    }
    //拖拽管理者：用于管理从左下角拖拽图标到画布上生成节点,用了个 drag.js 插件
    const dragManager = {
      beforeDragMouseUp: null,
      afterDragMouseUp: null,

      /**
       * 当拖拽发生时的事件处理函数
       *
       * @param $thisClone
       * @param positionX
       * @param positionY
       * @param e
       */
      dragMouseDown($thisClone, positionX, positionY, e) {
        $thisClone.css({
          "zIndex": "99",
          'left': positionX,
          'top': positionY,
          'position': 'absolute',
          'padding-left': '0',
        })

        // 移除用于连接的线条
        stateManager.removeAgentLink()
      },
      dragMouseMove: null,
      dragMouseUp($thisClone, mDown, e) {
        if (!$thisClone) {
          return false
        }

        if (dragManager.beforeDragMouseUp) {
          let b = dragManager.beforeDragMouseUp($thisClone, e)
          if (!b) {
            if ($thisClone) {
              $thisClone.remove()
              $thisClone = null
            }
            return false
          }
        }

        const jsonStr = $thisClone.attr('json')

        if (jsonStr.indexOf('containerNode') >= 0) {
          //自定义节点
          canvasManager.createUserDefinedNodeByDrag($thisClone, mDown, e)
        } else {
          //简单节点
          canvasManager.createNodeByDrag($thisClone, mDown, e)
        }

        if ($thisClone) {
          $thisClone.remove()
          $thisClone = null
        }

        toolbarManager.history.save()
        dragManager.afterDragMouseUp && dragManager.afterDragMouseUp($thisClone, e)
      },

      /** 数据层 */
      /** 视觉层 */
      /** 控制层 */

      dragInit() {
        const $dragContainer = $('#container')

        // 遍历每一个符合条件的元素
        $('#equipmentArea .dragTag')
          .each(function () {
            if ($(this).attr('isDragTag') === 'true') {
              return
            }

            // 调用 drag.js 插件
            $(this).dragging({
              // 拖动方向（x: 水平拖动；y: 垂直拖动；both: 任意方向拖动）
              move: 'both',
              // 可拖拽图标的初始位置是否随机排列
              randomPosition: false,
              // 可被拖拽的区域容器
              dragContainer: $dragContainer,
              // 当拖拽发生时的事件处理函数
              dragMouseDown: dragManager.dragMouseDown,
              dragMouseMove: dragManager.dragMouseMove,
              stateManager: stateManager,
              // 通过拖拽生成节点
              fnCreateNodeByDrag: dragManager.dragMouseUp
            })
          })
      },

      init() {
        this.dragInit()
      },
    }
    //节点排列管理者：用于将生成的节点,自动排列起来
    const nodesRankManager = {
      /** 状态值 */

      // 用于存储画布数据
      dataJson: {},
      // 存储节点的数组
      nodesArr: [],
      // 存储连接线的数组
      linksArr: [],
      // 二维数组,用于根据节点关系,存储节点
      nodesRankArr: [],
      // 最长一维数组的长度
      maxLength: 0,
      subWidth: 0,
      subHeight: 0,
      originX: 0,
      originY: 0,
      subRadius: 0,
      nodePositionJson: {},
      // 没有用于自动排列的节点位置
      nodeNoRankPositionJson: {},
      // 用于自动排列节点 id
      nodesRankIdArr: [],
      // 没有用于自动排列的节点 id
      nodesNoRankIdArr: [],
      // 判断是否是手动触发排序
      isRankTag: false,

      /****数据层*****/
      /****显示层*****/
      /****控制层*****/

      setNodesRank(dataObj, rootNodeId, params, type) {
        //清空所有数据
        nodesRankManager.init()

        let dataJson = dataObj

        if (dataJson) {
          nodesRankManager.dataJson = dataJson
        } else {
          nodesRankManager.isRankTag = true
          // 当dataObj不存在时,调用画布以后的数据
          dataJson = canvasManager.saveTopo()
        }

        nodesRankManager.nodesArr = dataJson.nodes
        nodesRankManager.linksArr = dataJson.links
        nodesRankManager.originX = params.originX
        nodesRankManager.originY = params.originY
        this.getArrTwoDimensional([rootNodeId])

        if (type === 'tree') {
          nodesRankManager.subWidth = params.subWidth
          nodesRankManager.subHeight = params.subHeight
          nodesRankManager.rankTree()
        }
        else if (type === 'ring') {
          nodesRankManager.subRadius = params.subRadius
          nodesRankManager.rankRing()
        }
        if (dataObj) {
          // 设置跟根节点不产生关系的节点位置
          nodesRankManager.rankNoRelatedNodes()
        }
        // 设置自动排列节点的位置
        nodesRankManager.setNodesPosition()
      },

      // 选中树
      chooseTree(rootNodeId) {
        // 清空所有数据
        nodesRankManager.init()

        // 当 dataObj 不存在时,调用画布以后的数据
        const dataJson = canvasManager.saveTopo()
        nodesRankManager.nodesArr = dataJson.nodes
        nodesRankManager.linksArr = dataJson.links
        this.getArrTwoDimensional([rootNodeId])

        stateManager.scene.childs.forEach(function (p) {
          if (nodesRankManager.nodesRankIdArr.indexOf(p.id) >= 0) {
            p.selected = true
            stateManager.scene.addToSelected(p)
          }
        })
      },
      /****辅助方法*****/
      // 获取关联节点id
      getRelatedNodesId(nodesIdArr) {
        const linksArr = nodesRankManager.linksArr

        const fatherNodesArr = nodesRankManager.nodesRankArr.length > 1
          ? nodesRankManager.nodesRankArr[nodesRankManager.nodesRankArr.length - 2]
          : []

        const thisNodesArr = nodesRankManager.nodesRankArr.length > 0
          ? nodesRankManager.nodesRankArr[nodesRankManager.nodesRankArr.length - 1]
          : []

        const targetNodesIdArr = []

        linksArr.forEach(function (p) {
          if (nodesIdArr.indexOf(p.from_id) >= 0) {
            if (targetNodesIdArr.indexOf(p.to_id) < 0 && fatherNodesArr.indexOf(p.to_id) < 0 && thisNodesArr.indexOf(p.to_id) < 0) {
              //父层不包括,本层不包括
              targetNodesIdArr.push(p.to_id)
            }
          } else if (nodesIdArr.indexOf(p.to_id) >= 0) {
            if (targetNodesIdArr.indexOf(p.from_id) < 0 && fatherNodesArr.indexOf(p.from_id) < 0 && thisNodesArr.indexOf(p.from_id) < 0) {
              //父层不包括,本层不包括
              targetNodesIdArr.push(p.from_id)
            }
          }
        })

        return targetNodesIdArr
      },
      // 获取金字塔二维数组
      getArrTwoDimensional(nodesIdArr) {
        if (nodesIdArr.length > 0) {
          if (nodesIdArr.length > nodesRankManager.maxLength) {
            nodesRankManager.maxLength = nodesIdArr.length
          }

          nodesRankManager.nodesRankArr.push(nodesIdArr)

          // 用数组装下所有id
          nodesRankManager.nodesRankIdArr = nodesRankManager.nodesRankIdArr.concat(nodesIdArr)
          const arr = this.getRelatedNodesId(nodesIdArr)
          this.getArrTwoDimensional(arr)
        }
      },
      // 获取节点坐标,树形
      rankTree() {
        const maxLength = nodesRankManager.maxLength
        const width = nodesRankManager.subWidth
        const height = nodesRankManager.subHeight
        const originX = nodesRankManager.originX
        const originY = nodesRankManager.originY

        nodesRankManager.nodesRankArr.forEach(function (oneDimensionalArr, index1) {
          const onoDimensionalLength = oneDimensionalArr.length
          oneDimensionalArr.forEach(function (id, index2) {
            nodesRankManager.nodePositionJson[id] = {
              x: originX + (((maxLength - onoDimensionalLength) / 2) + index2) * width,
              y: originY + index1 * height,
            }
          })
        })
      },
      // 获取节点坐标,环形
      rankRing() {
        const subRadius = nodesRankManager.subRadius
        const originX = nodesRankManager.originX
        const originY = nodesRankManager.originY

        nodesRankManager.nodesRankArr.forEach(function (oneDimensionalArr, index1) {
          const onoDimensionalLength = oneDimensionalArr.length
          const subPI = 360 / onoDimensionalLength

          oneDimensionalArr.forEach(function (id, index2) {
            const isV = index2 % 2 ? 0 : (Math.PI / 4)

            nodesRankManager.nodePositionJson[id] = {
              x: originX + subRadius * index1 * Math.cos((0 + subPI * index2) * Math.PI / 180),
              y: originY + subRadius * index1 * Math.sin((0 + subPI * index2) * Math.PI / 180)
            }
          })
        })

        // console.log('nodesRankManager.nodePositionJson:')
        // console.log(nodesRankManager.nodePositionJson)
      },
      // 设置节点坐标
      setNodesPosition() {
        const maxLength = nodesRankManager.maxLength
        const width = nodesRankManager.subWidth

        stateManager.scene.childs.forEach(function (p) {
          const obj = nodesRankManager.nodePositionJson[p.id]
          const obj2 = nodesRankManager.nodeNoRankPositionJson[p.id]

          if (obj) {
            if (nodesRankManager.isRankTag) {
              // 手动触发排列
              p.x = obj.x - (maxLength / 2) * width
            } else {
              p.x = obj.x
            }
            p.y = obj.y
            p.selected = true
            stateManager.scene.addToSelected(p)
          } else if (obj2) {
            p.x = obj2.x
            p.y = obj2.y
          }
        })
      },
      // 设置其他节点的排列
      rankNoRelatedNodes() {
        nodesRankManager.nodesArr.forEach(function (p) {
          if (nodesRankManager.nodesRankIdArr.indexOf(p.id) < 0) {
            nodesRankManager.nodesNoRankIdArr.push(p.id)
          }
        })
        nodesRankManager.nodesNoRankIdArr.forEach(function (id, index) {
          nodesRankManager.nodeNoRankPositionJson[id] = {
            x: nodesRankManager.originX + index * nodesRankManager.subWidth / 2,
            y: nodesRankManager.originY - nodesRankManager.subHeight / 2,
          }
        })
      },

      init() {
        // 用于存储画布数据
        nodesRankManager.dataJson = {}
        nodesRankManager.nodesArr = []
        nodesRankManager.linksArr = []

        // 二维数组;用于根据节点关系;存储节点
        nodesRankManager.nodesRankArr = []

        // 最长一维数组的长度
        nodesRankManager.maxLength = 0
        nodesRankManager.subWidth = 0
        nodesRankManager.subHeight = 0
        nodesRankManager.originX = 0
        nodesRankManager.originY = 0
        nodesRankManager.subRadius = 0
        nodesRankManager.nodePositionJson = {}

        // 没有用于自动排列的节点位置
        nodesRankManager.nodeNoRankPositionJson = {}

        // 用于自动排列节点 id
        nodesRankManager.nodesRankIdArr = []

        // 没有用于自动排列的节点 id
        nodesRankManager.nodesNoRankIdArr = []
        nodesRankManager.isRankTag = false
      }
    }

    return {
      dataManager,
      stateManager,
      powerManager,
      popupManager,
      canvasManager,
      dragManager,
      toolbarManager,
      nodesRankManager,

      //各模块初始化
      init() {
        stateManager.init()
        powerManager.init()
        canvasManager.init()
        dragManager.init()
        toolbarManager.init()
        nodesRankManager.init()
      },
    }
  });


