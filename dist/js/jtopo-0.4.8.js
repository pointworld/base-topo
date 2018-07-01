;define(
  [],
  function () {
    let JTopo = {}
    // 全局
    !function (window) {

      // 构造函数 - 可以看作是基类，通过该构造函数可以构造出 Scene、Node、Link、Text 等对象
      function Element() {
        /** this 可以是 scene、node、link、... */

        // 初始化元素属性
        this.initialize = function () {
          // 元素的类型
          this.elementType = "element"
          // 元素的序列化属性
          this.serializedProperties = ["elementType"]
          // 元素的属性 - 堆: [{}, {}, ...]
          this.propertiesStack = []
          // 元素的 id
          // this._id: 'front1530013168481849489'
          this._id = JTopo.util.creatId()
        }

        this.destroy = function () {}

        this.removeHandler = function () {}

        // 设置或返回元素特性的值
        this.attr = function (a, b) {
          if (null != a && null != b) {
            this[a] = b
          } else if (null != a) {
            return this[a]
          }

          return this
        }

        // 保存，每次 save 只保留自身的数据，创建时的状态不能保存
        this.save = function () {
          const that = this
          // { elementType: "scene", background: undefined, backgroundColor: "255,255,255", mode: "normal", paintAll: false, scaleX: 1, scaleY: 1, translate: true, translateX: 0, translateY: 0, visible: true, ... }
          const obj = {}

          this.serializedProperties.forEach(function (attr) {
            // obj["elementType"] = that["elementType"]
            obj[attr] = that[attr]
          })
          // TODO: ? this.propertiesStack = []
          this.propertiesStack.push(obj)
        }

        // 恢复
        this.restore = function () {
          if (
            null != this.propertiesStack
            && 0 != this.propertiesStack.length
          ) {
            const that = this
            // TODO: ? this.propertiesStack = []
            const obj = this.propertiesStack.pop()

            this.serializedProperties.forEach(function (attr) {
              that[attr] = obj[attr]
            })
          }
        }

        // 转换为 JSON 对象
        this.toJson = function () {
          const that = this
          const len = this.serializedProperties.length
          // b: '{"key": value, ...}'
          let b = "{"

          return this.serializedProperties.forEach(function (attr, index) {
            let value = that[attr];

            "string" == typeof value && (value = '"' + value + '"'),
              b += '"' + attr + '":' + value, len > index + 1 && (b += ",")
          }),
            b += "}"
        }
      }

      /**
       * 绘制圆角矩形
       *
       * @param {Number} x - 起点横坐标
       * @param {Number} y - 起点纵坐标
       * @param {Number} w - 宽度
       * @param {Number} h - 高度
       * @param {Number} dashedLineSpacing - 虚线的间隔
       * @param {String} borderType - 边框线的类型
       */
      CanvasRenderingContext2D.prototype.JTopoRoundRect = function (x, y, w, h, dashedLineSpacing, borderType) {
        // borderType 表示边框为虚线
        if (borderType) {
          "undefined" == typeof dashedLineSpacing && (dashedLineSpacing = 5)

          this.beginPath()

          // this.moveTo(x + dashedLineSpacing, y)
          // this.lineTo(x + w - dashedLineSpacing, y)

          // 绘制虚线
          // 参数：起点横坐标，起点纵坐标，终点横坐标，终点纵坐标，虚线的间隔
          this.JTopoDashedLineTo(x + dashedLineSpacing, y, x + w - dashedLineSpacing, y)

          /**
           * quadraticCurveTo() 方法通过使用表示二次贝塞尔曲线的指定控制点，向当前路径添加一个点
           *
           * 提示：二次贝塞尔曲线需要两个点。第一个点是用于二次贝塞尔计算中的控制点，第二个点是曲线的结束点。
           * 曲线的开始点是当前路径中最后一个点。
           * 如果路径不存在，那么请使用 beginPath() 和 moveTo() 方法来定义开始点。
           *
           * 参数：控制点坐标（x + w, y），结束点坐标（x + w, y + dashedLineSpacing）
           */
          this.quadraticCurveTo(x + w, y, x + w, y + dashedLineSpacing)

          // this.lineTo(x + w, y + h - dashedLineSpacing)

          this.JTopoDashedLineTo(x + w, y + dashedLineSpacing, x + w, y + h - dashedLineSpacing)
          this.quadraticCurveTo(x + w, y + h, x + w - dashedLineSpacing, y + h)

          // this.lineTo(x + dashedLineSpacing, y + h)

          this.JTopoDashedLineTo(x + w - dashedLineSpacing, y + h, x + dashedLineSpacing, y + h)
          this.quadraticCurveTo(x, y + h, x, y + h - dashedLineSpacing)

          // this.lineTo(x, y + dashedLineSpacing)

          this.JTopoDashedLineTo(x, y + h - dashedLineSpacing, x, y + dashedLineSpacing)
          this.quadraticCurveTo(x, y, x + dashedLineSpacing, y)
          this.JTopoDashedLineTo(x, y, x + dashedLineSpacing, y)

          this.closePath()
        } else {
          "undefined" == typeof dashedLineSpacing && (dashedLineSpacing = 5)

          this.beginPath()
          this.moveTo(x + dashedLineSpacing, y)
          this.lineTo(x + w - dashedLineSpacing, y)
          this.quadraticCurveTo(x + w, y, x + w, y + dashedLineSpacing)
          this.lineTo(x + w, y + h - dashedLineSpacing)
          this.quadraticCurveTo(x + w, y + h, x + w - dashedLineSpacing, y + h)
          this.lineTo(x + dashedLineSpacing, y + h)
          this.quadraticCurveTo(x, y + h, x, y + h - dashedLineSpacing)
          this.lineTo(x, y + dashedLineSpacing)
          this.quadraticCurveTo(x, y, x + dashedLineSpacing, y)
          this.closePath()
        }
      }

      /**
       * 绘制虚线
       * 绘制思路：把线条看成是矩形的对角线
       * 绘制过程：确定线条的起点坐标（x1, y1）和终点坐标（x2, y2），用 x2 - x1 得到矩形的宽 w，用 y2 - y1 得到矩形的高 h，通过 对（w*w + h*h）开根号得到矩形对角线的长度
       *
       * @param {Number} x1 - 虚线起点的横坐标
       * @param {Number} y1 - 虚线起点的纵坐标
       * @param {Number} x2 - 虚线终点的横坐标
       * @param {Number} y2 - 虚线终点的纵坐标
       * @param {Number} dashedLineSpacing - 虚线的间隔
       */
      CanvasRenderingContext2D.prototype.JTopoDashedLineTo = function (x1, y1, x2, y2, dashedLineSpacing) {
        "undefined" == typeof dashedLineSpacing && (dashedLineSpacing = 5)

        const w = x2 - x1
        const h = y2 - y1

        // 斜边长度：直角三角形的斜边长度
        const hypotenuseLength = Math.floor(Math.sqrt(w * w + h * h))

        // 虚线间隔数量
        const dashedLineSpacingAmount = 0 >= dashedLineSpacing
          ? hypotenuseLength
          : hypotenuseLength / dashedLineSpacing

        // 虚线间隔线作为对角线时矩形的高
        const dashedLineSpacingH = h / hypotenuseLength * dashedLineSpacing
        // 虚线间隔线作为对角线时矩形的宽
        const dashedLineSpacingW = w / hypotenuseLength * dashedLineSpacing

        this.beginPath()

        for (let stepAmount = 0; dashedLineSpacingAmount > stepAmount; stepAmount++) {
          stepAmount % 2
            ? this.lineTo(x1 + stepAmount * dashedLineSpacingW, y1 + stepAmount * dashedLineSpacingH)
            : this.moveTo(x1 + stepAmount * dashedLineSpacingW, y1 + stepAmount * dashedLineSpacingH)
        }

        // 描边
        this.stroke()
      }

      // 拓展 by luozheao
      CanvasRenderingContext2D.prototype.JtopoDrawPointPath = function (a, b, c, d, e, f) {
        const animespeed = (new Date()) / 10
        const xs = c - a
        const xy = d - b

        let xl
        let yl

        const l = Math.floor(Math.sqrt(xs * xs + xy * xy))
        const colorlength = 50
        const j = l

        if (l === 0) {
          xl = 0
          yl = 0
        } else {
          xl = xs / l
          yl = xy / l
        }

        const colorpoint = animespeed % (l + colorlength) - colorlength

        for (let i = 0; i < j; i++) {
          if (((i) > colorpoint) && ((i) < (colorpoint + colorlength))) {
            this.beginPath()
            this.strokeStyle = e
            this.moveTo(a + (i - 1) * xl, b + (i - 1) * yl)
            this.lineTo(a + i * xl, b + i * yl)
            this.stroke()
          } else {
            this.beginPath()
            this.strokeStyle = f
            this.moveTo(a + (i - 1) * xl, b + (i - 1) * yl)
            this.lineTo(a + i * xl, b + i * yl)
            this.stroke()
          }
        }
      }

      JTopo = {
        // JTopo 版本
        version: "0.4.8",
        // 容器的显示级别
        zIndex_Container: 1,
        // 连线的显示级别
        zIndex_Link: 2,
        // 节点的显示级别
        zIndex_Node: 3,
        // 场景模式
        SceneMode: {
          // 正常模式
          normal: "normal",
          // 拖拽模式
          drag: "drag",
          // 编辑模式
          edit: "edit",
          // 选择模式
          select: "select",
        },
        // 鼠标光标
        MouseCursor: {
          normal: "default",
          pointer: "pointer",
          top_left: "nw-resize",
          top_center: "n-resize",
          top_right: "ne-resize",
          middle_left: "e-resize",
          middle_right: "e-resize",
          bottom_left: "ne-resize",
          bottom_center: "n-resize",
          bottom_top: "n-resize",
          bottom_right: "nw-resize",
          move: "move",
          open_hand: "url(./images/openhand.cur) 8 8, default",
          closed_hand: "url(./images/closedhand.cur) 8 8, default",
        },
        // 通过 JSON 数据创建舞台
        createStageFromJson(jsonStr, canvas) {
          eval("var jsonObj = " + jsonStr);

          // new 一个舞台实例
          const stage = new JTopo.Stage(canvas);

          for (let key in jsonObj) {
            "childs" !== key && (stage[key] = jsonObj[key]);
          }

          // 获取舞台下的所有子场景
          const scenes = jsonObj.childs;

          // 返回舞台对象
          return scenes.forEach(function (scene) {
            // new 一个场景实例
            const sceneInstance = new JTopo.Scene(stage);

            for (var key1 in scene)
              "childs" != key1 && (sceneInstance[key1] = scene[key1]),
              "background" == key1 && (sceneInstance.background = scene[key1]);

            const nodes = scene.childs;

            nodes.forEach(function (node) {
              let c = null;
              const d = node.elementType;

              "node" == d
                ? c = new JTopo.Node
                : "CircleNode" == d && (c = new JTopo.CircleNode);

              for (let e in node)
                c[e] = node[e];

              sceneInstance.add(c)
            })
          }),
            stage
        },
      }

      // 将 Element 构造函数挂载到 JTopo 对象上
      JTopo.Element = Element

      // 将 JTopo 挂载到全局对象 window 上
      window.JTopo = JTopo
    }(window),

      // jTopo 具体方法的实现，部分全局方法的实现
      function (JTopo) {
        // 观察者模式，其中 messageMap 为事件数组
        function MessageBus(name) {
          const self = this

          //
          this.name = name
          // 消息映射
          this.messageMap = {}
          // 消息数量
          this.messageCount = 0

          // 订阅
          this.subscribe = function (a, c) {
            const d = self.messageMap[a]

            null == d && (self.messageMap[a] = [])

            self.messageMap[a].push(c)
            self.messageCount++
          }

          // 取消订阅
          this.unsubscribe = function (a) {
            const c = self.messageMap[a]

            null != c && (
              self.messageMap[a] = null,
                delete self.messageMap[a],
                self.messageCount--
            )
          }

          // 发布
          this.publish = function (a, c, d) {
            const e = self.messageMap[a]

            if (null != e) {
              for (let f = 0; f < e.length; f++) {
                d
                  ? !function (a, b) { setTimeout(function () { a(b) }, 10) }(e[f], c)
                  : e[f](c)
              }
            }
          }
        }

        /**
         * 获取两点间的距离
         *
         * 参数的两种传入方式：
         * 1. 将起始点和终止点的坐标信息分别存放在前两个参数之中：p1 = {x, y}, p2 = {x, y}, null, null
         * 2. 将起始点和终止点的横纵坐标信息分别存放在四个参数中：x1, y1, x2, y2
         *
         */
        function getDistance(p1, p2, c, d) {
          let width
          let height

          return null == c && null == d
            ? (width = p2.x - p1.x, height = p2.y - p1.y)
            : (width = c - p1, height = d - p2)
            , Math.sqrt(width * width + height * height)
        }

        /**
         * 用于获取元素的宽高位置等信息
         *
         *
         * @return {Object} - {
         *   top: xx, right: xx, bottom: xx, left: xx, width: xx, height: xx, ..
         *   topNode: xx, rightNode: xx, ..
         * }
         */
        function getElementsBound(a) {
          for (
            var obj = {
              left: Number.MAX_VALUE,
              right: Number.MIN_VALUE,
              top: Number.MAX_VALUE,
              bottom: Number.MIN_VALUE,
            }, i = 0;
            i < a.length;
            i++
          ) {
            const d = a[i]

            d instanceof JTopo.Link || (
              obj.left > d.x && (obj.left = d.x, obj.leftNode = d),
              obj.right < d.x + d.width && (obj.right = d.x + d.width, obj.rightNode = d),
              obj.top > d.y && (obj.top = d.y, obj.topNode = d),
              obj.bottom < d.y + d.height && (obj.bottom = d.y + d.height, obj.bottomNode = d)
            )
          }

          return obj.width = obj.right - obj.left,
            obj.height = obj.bottom - obj.top,
            obj
        }

        // 返回事件触发时鼠标的位置信息
        function mouseCoords(e) {
          return e = cloneEvent(e),
          e.pageX || (
            // e.clientX 相对于文档（或当前窗口）的水平坐标，页面滚动不会影响该值
            // document.body.scrollLeft 元素在水平方向上滚动了多远
            // document.body.clientLeft 元素周围边框的厚度，如果不指定一个边框或者不定位该元素，值为 0
            e.pageX = e.clientX + document.body.scrollLeft - document.body.clientLeft,
            e.pageY = e.clientY + document.body.scrollTop - document.body.clientTop
          ),
            e
        }

        // 返回事件触发时鼠标的位置信息
        function getEventPosition(e) {
          return e = mouseCoords(e)
        }

        /**
         * 旋转点，返回旋转后点的坐标信息
         *
         * @param {Number} x1 - 点 p1 的横坐标
         * @param {Number} y1 - 点 p1 的纵坐标
         * @param {Number} x2 - 点 p2 的横坐标
         * @param {Number} y2 - 点 p2 的纵坐标
         * @param {Number} targetRotateRadianRegion - 目标旋转弧度区间
         * @return {Object} - 旋转后点的坐标信息
         */
        function rotatePoint(x1, y1, x2, y2, targetRotateRadianRegion) {
          // 宽度，作为旋转前点的横坐标
          const w = x2 - x1
          // 高度，作为旋转后点的纵坐标
          const h = y2 - y1
          // 对角线
          const diagonalLenth = Math.sqrt(w * w + h * h)
          // Math.atan2(y, x) 返回其参数比值的反正切值（-pi 到 pi），表示点 (x, y) 对应的偏移角度。
          // 这是一个逆时针角度，以弧度为单位，正 X 轴和点 (x, y) 与原点连线之间。
          // 注意此函数接受的参数：先传递 y 坐标，然后是 x 坐标。
          // 目标弧度 = 旋转前弧度值 + 目标旋转弧度区间值
          const targetRadian = Math.atan2(h, w) + targetRotateRadianRegion

          return {
            x: x1 + Math.cos(targetRadian) * diagonalLenth,
            y: y1 + Math.sin(targetRadian) * diagonalLenth,
          }
        }

        /**
         * 旋转多个点，返回旋转过程中经历的旋转点的位置信息
         *
         */
        function rotatePoints(p1, pointsArr, targetRotateRadianRegion) {
          for (let tarCoordArr = [], i = 0; i < pointsArr.length; i++) {
            const targetRotatePointCoord = rotatePoint(p1.x, p1.y, pointsArr[i].x, pointsArr[i].y, targetRotateRadianRegion)

            tarCoordArr.push(targetRotatePointCoord)
          }

          return tarCoordArr
        }

        // 遍历数组 arr，依次将数组中的每一个元素作为 函数 fn 的参数，并执行 fn 函数
        function $foreach(arr, fn, t) {
          function d(i) {
            i != arr.length && (fn(arr[i]),
              setTimeout(function () {
                d(++i)
              }, t))
          }

          if (0 != arr.length) {
            let start = 0

            d(start)
          }
        }

        // TODO ?
        function $for(a, b, fn, t) {
          function e(i) {
            i != b && (fn(b),
              setTimeout(function () {
                e(++i)
              }, t)
            )
          }

          if (!(a > b)) {
            const start = 0

            e(start)
          }
        }

        // 返回克隆的事件对象
        function cloneEvent(e) {
          const copyEventObj = {}

          for (let key in e) {
            "returnValue" != key && "keyLocation" != key && (copyEventObj[key] = e[key])
          }

          return copyEventObj
        }

        // 返回克隆的 json 对象
        function clone(jsonObj) {
          const copyJsonObj = {}

          for (let key in jsonObj) {
            copyJsonObj[key] = jsonObj[key]
          }

          return copyJsonObj
        }

        /**
         * 判断点是否在矩形内部
         *
         * @param {Object} point - 点的相关数据
         * @param {Object} rect - 矩形的相关数据
         * @return {Boolean}
         */
        function isPointInRect(point, rect) {
          return point.x > rect.x && point.x < rect.x + rect.width && point.y > rect.y && point.y < rect.y + rect.height
        }

        /**
         * 判断两个矩形是否重叠
         *
         * @param {Object} rect1
         * @param {Object} rect2
         * @return {Boolean}
         */
        function isRectOverlapRect(rect1, rect2) {
          function sugar(rect1, rect2) {
            const rect = rect1

            const leftTop = {
              x: rect.x,
              y: rect.y,
            }
            const leftBottom = {
              x: rect.x,
              y: rect.y + rect.height,
            }
            const rightTop = {
              x: rect.x + rect.width,
              y: rect.y,
            }
            const rightBottom = {
              x: rect.x + rect.width,
              y: rect.y + rect.height,
            }

            return isPointInRect(leftTop, rect2) || isPointInRect(leftBottom, rect2) || isPointInRect(rightTop, rect2) || isPointInRect(rightBottom, rect2)
          }

          return sugar(rect1, rect2) || sugar(rect2, rect1)
        }

        /**
         * 判断点是否在线上，很巧妙
         *
         * @param {Object} p1 - 线段起点或终点的坐标信息
         * @param {Object} p2 - 待判断的点的坐标信息
         * @param {Object} p3 - 线段起点或终点的坐标信息
         */
        function isPointInLine(p1, p2, p3) {
          // 获取两点间的距离
          const d1 = JTopo.util.getDistance(p2, p3)
          const d2 = JTopo.util.getDistance(p2, p1)
          const d3 = JTopo.util.getDistance(p3, p1)

          return Math.abs(d2 + d3 - d1) <= .5
        }

        // 从指定的数组中删除指定的元素
        function removeFromArray(arr, targetEle) {
          for (let i = 0; i < arr.length; i++) {
            const currentEle = arr[i]

            if (currentEle === targetEle) {
              arr = arr.del(i)

              break
            }
          }

          return arr
        }

        /**
         * 随机产生 rgb 颜色:
         *
         * @return {String} - e.g.: '234, 23, 145'
         */
        function randomColor() {
          return Math.floor(255 * Math.random()) + "," + Math.floor(255 * Math.random()) + "," + Math.floor(255 * Math.random())
        }

        /**
         * 获取指定对象的属性集合，用字符串表示
         *
         * @param {Object} obj
         * @param {Array} keysArr
         * @return {String} keysString - 'key1: "val1", key2: "val2", ...'
         */
        function getProperties(obj, keysArr) {
          for (var keysString = "", i = 0; i < keysArr.length; i++) {
            i > 0 && (keysString += ",")

            let e = obj[keysArr[i]]

            "string" == typeof e
              ? e = '"' + e + '"'
              : void 0 == e && (e = null), keysString += keysArr[i] + ":" + e
          }

          return keysString
        }

        /**
         * 根据 json 数据加载舞台对象
         *
         * @param {Object} json
         * @param {Object} canvas
         * @return {Object} stage
         *
         */
        function loadStageFromJson(json, canvas) {
          const obj = eval(json), stage = new JTopo.Stage(canvas);
          // TODO ? stageObj is what??
          for (let k in stageObj)
            if ("scenes" != k)
              stage[k] = obj[k];
            else {
              const scenes = obj.scenes;
              let i = 0;
              for (; i < scenes.length; i++) {
                const sceneObj = scenes[i]
                  , scene = new JTopo.Scene(stage);
                for (let p in sceneObj)
                  if ("elements" != p)
                    scene[p] = sceneObj[p];
                  else {
                    const nodeMap = {}, elements = sceneObj.elements;
                    let m = 0;
                    for (; m < elements.length; m++) {
                      const elementObj = elements[m], type = elementObj.elementType;
                      let element;
                      "Node" == type && (element = new JTopo.Node);
                      for (let mk in elementObj)
                        element[mk] = elementObj[mk];
                      nodeMap[element.text] = element,
                        scene.add(element)
                    }
                  }
              }
            }
          return console.log(stage),
            stage
        }

        /**
         * 将舞台数据转换成 json 对象
         *
         * @param {Object} stage
         * @return {Object} stageJson -
         *   stageJson: {
         *     frames: xx,
         *     scenes: [ {key1: "val1", key2: "val2", ..., elements: [{kkey1: "vval1", kkey2: "vval2", ...}],} ],
         *   }
         *
         */
        function toJson(stage) {
          const sceneKeysArr = "backgroundColor,visible,mode,rotate,alpha,scaleX,scaleY,shadow,translateX,translateY,areaSelect,paintAll".split(",")
          const nodeKeysArr = "text,elementType,x,y,width,height,visible,alpha,rotate,scaleX,scaleY,fillColor,shadow,transformAble,zIndex,dragable,selected,showSelected,font,fontColor,textPosition,textOffsetX,textOffsetY".split(",")

          let stageJson = "{"

          stageJson += "frames:" + stage.frames,
            stageJson += ", scenes:[";

          for (let i = 0; i < stage.childs.length; i++) {
            const scene = stage.childs[i]

            stageJson += "{",
              stageJson += getProperties(scene, sceneKeysArr),
              stageJson += ", elements:[";

            for (let j = 0; j < scene.childs.length; j++) {
              const node = scene.childs[j]

              j > 0 && (stageJson += ","),
                stageJson += "{",
                stageJson += getProperties(node, nodeKeysArr),
                stageJson += "}"
            }
            stageJson += "]}"
          }

          return stageJson += "]",
            stageJson += "}"
        }

        /**
         * 改变颜色
         *
         * @param {Object} ctx
         * @param {Object} imgEle
         * @param {Number} tarR - 目标颜色 R 值
         * @param {Number} tarG - 目标颜色 G 值
         * @param {Number} tarB - 目标颜色 B 值
         * @param {Number} oriR - 原始颜色 R 值
         * @param {Number} oriG - 原始颜色 G 值
         * @param {Number} oriB - 原始颜色 B 值
         * @return {url}
         */
        function changeColor(ctx, imgEle, tarR, tarG, tarB, oriR, oriG, oriB) {

          const canvasW = canvas.width = imgEle.width
          const canvasH = canvas.height = imgEle.height

          // 清除画布内容
          ctx.clearRect(0, 0, canvas.width, canvas.height),
            ctx.drawImage(imgEle, 0, 0);

          const imageData = ctx.getImageData(0, 0, imgEle.width, imgEle.height)
          const imageInnerData = imageData.data

          let i = 0
          for (; canvasW > i; i++) {
            for (let j = 0; canvasH > j; j++) {
              // 第 n 个像素点
              const n = 4 * (i + j * canvasW)

              if (
                (oriR || oriG || oriB)
                && (
                  imageInnerData[n + 0] == oriR
                  && imageInnerData[n + 1] == oriG
                  && imageInnerData[n + 2] == oriB
                )
              ) {
                imageInnerData[n + 0] = tarR
                imageInnerData[n + 1] = tarG
                imageInnerData[n + 2] = tarB
              }
            }

            // 参数：image_data, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight
            ctx.putImageData(imageData, 0, 0, 0, 0, imgEle.width, imgEle.height)
          }

          const url = canvas.toDataURL()
          // return alarmImageCache[b.src+nodeId] = url,
          //   url

          if (oriR !== undefined || oriG !== undefined || oriB !== undefined) {
            JTopo.flag.alarmImageCache[imgEle.src + 'tag' + tarR + tarG + tarB] = url
          }

          return url
        }

        /**
         * 获取图片告警，即变色功能
         *
         * @param {Object} imgEle
         * @param {Number} targetColorR
         * @param {Array} targetColor - 目标色
         * @param {Array} originColor - 原始颜色
         * @return {null | image}
         */
        function getImageAlarm(imgEle, targetColorR, targetColor, originColor) {

          null == targetColorR && (targetColorR = 255)

          try {
            const image = new Image
            const alarmImage = JTopo.flag.alarmImageCache[imgEle.src + 'tag' + targetColor[0] + targetColor[1] + targetColor[2]]

            if (alarmImage) {
              image.src = alarmImage

              return image
            }

            if (targetColor && originColor) {
              image.src = changeColor(graphics, imgEle, targetColor[0], targetColor[1], targetColor[2], originColor[0], originColor[1], originColor[2])
            } else {
              image.src = changeColor(graphics, imgEle, targetColorR)
            }

            return image
          } catch (e) {

          }

          return null
        }

        // 获取元素相对于其祖先元素的偏移位置
        function getOffsetPosition(ele) {
          if (!ele) {
            return {
              left: 0,
              top: 0,
            }
          }

          var b = 0
          var c = 0

          // IE
          if ("getBoundingClientRect" in document.documentElement) {
            var d = ele.getBoundingClientRect()
            var e = ele.ownerDocument
            var f = e.body
            var g = e.documentElement
            var h = g.clientTop || f.clientTop || 0
            var i = g.clientLeft || f.clientLeft || 0
            var b = d.top + (self.pageYOffset || g && g.scrollTop || f.scrollTop) - h
            var c = d.left + (self.pageXOffset || g && g.scrollLeft || f.scrollLeft) - i
          } else {
            do {
              b += ele.offsetTop || 0,
                c += ele.offsetLeft || 0,
                ele = ele.offsetParent;
            }

            while (ele)
          }

          return {
            left: c,
            top: b,
          }
        }

        /**
         * 线条函数：一元一次方程
         *
         * @param {Number} x1
         * @param {Number} y1
         * @param {Number} x2
         * @param {Number} y2
         * @return {Function} f
         */
        function lineF(x1, y1, x2, y2) {
          function f(x) {
            // y = kx + b
            return k * x + b
          }

          // 线段的斜率
          var k = (y2 - y1) / (x2 - x1)

          var b = y1 - x1 * k

          return f.k = k,
            f.b = b,
            f.x1 = x1,
            f.x2 = x2,
            f.y1 = y1,
            f.y2 = y2,
            f
        }

        /**
         * 判断第一个参数的值是否在第二个参数和第三个参数之间
         *
         * @param {Number} testVal
         * @param {Number} val1
         * @param {Number} val2
         * @return {Boolean}
         */
        function inRange(testVal, val1, val2) {
          const d1 = Math.abs(val1 - val2)
          const d2 = Math.abs(val1 - testVal)
          const d3 = Math.abs(val2 - testVal)
          const g = Math.abs(d1 - (d2 + d3))

          return 1e-6 > g ? !0 : !1
        }

        /**
         * 判断点是否在线段上
         *
         * @param {Number} x - 测试点的横坐标
         * @param {Number} y - 测试点的纵坐标
         * @param {Object} lineObj
         * @return {Boolean}
         */
        function isPointInLineSeg(x, y, lineObj) {
          return inRange(x, lineObj.x1, lineObj.x2) && inRange(y, lineObj.y1, lineObj.y2)
        }

        /**
         * 判断两条线是否相交，若相交，则返回交点坐标信息；若不相交，则返回 null
         *
         * @param {Object} lineObj1 - 线条 1 对象
         * @param {Object} lineObj2 - 线条 2 对象
         * @return {null | Object} - 返回 null 或交叉点坐标信息
         */
        function intersection(lineObj1, lineObj2) {
          let x
          let y

          // 如果两条线的斜率相等或为同时正无穷大或同时为负无穷大，那么该两条线不会相交，返回 null
          return lineObj1.k == lineObj2.k ? null : (
            1 / 0 == lineObj1.k || lineObj1.k == -1 / 0 ? (x = lineObj1.x1,
            y = lineObj2(lineObj1.x1)) : 1 / 0 == lineObj2.k || lineObj2.k == -1 / 0 ? (x = lineObj2.x1,
            y = lineObj1(lineObj2.x1)) : (x = (lineObj2.b - lineObj1.b) / (lineObj1.k - lineObj2.k),
            y = lineObj1(x)),
            0 == isPointInLineSeg(x, y, lineObj1) ? null : 0 == isPointInLineSeg(x, y, lineObj2) ? null : {x, y}
          )
        }

        /**
         * 使两条线相交：即，尝试旋转线条角度，使两条线最终能够相交
         *
         * @param {Object} lineObj1 - {f: xx, b: xx, x1: xx, x2: xx, y1: xx, y2: xx}
         * @param {Object} b - {top: xx, rihgt: xx, bottom: xx, left: xx, width: xx, height: xx}
         * @return {false | Object} - 返回 false 或交点信息
         */
        function intersectionLineBound(lineObj1, b) {
          let lineObj2 = JTopo.util.lineF(b.left, b.top, b.left, b.bottom)
          let intersectionPointObj = JTopo.util.intersection(lineObj1, lineObj2)

          // 如果两条线已经相交，返回 false；如果两条线不相交，尝试旋转线条角度，使其最终能够相交
          return null == intersectionPointObj && (lineObj2 = JTopo.util.lineF(b.left, b.top, b.right, b.top),
            intersectionPointObj = JTopo.util.intersection(lineObj1, lineObj2),
          null == intersectionPointObj && (lineObj2 = JTopo.util.lineF(b.right, b.top, b.right, b.bottom),
            intersectionPointObj = JTopo.util.intersection(lineObj1, lineObj2),
          null == intersectionPointObj && (lineObj2 = JTopo.util.lineF(b.left, b.bottom, b.right, b.bottom),
            intersectionPointObj = JTopo.util.intersection(lineObj1, lineObj2)))),
            intersectionPointObj
        }

        // 字符串原型对象方法扩展：获取字符串中非标准 ASCII（128个）字符的数量
        String.prototype.getChineseNum = function () {
          let len = 0

          for (let i = 0; i < this.length; i++) {
            if (this.charCodeAt(i) > 127 || this.charCodeAt(i) == 94) {
              len += 1
            }
          }

          return len
        },
          // 数组原型对象方法扩展：删除指定索引或指定值的数组元素
          Array.prototype.del = function (indexOrValue) {
            if ("number" != typeof indexOrValue) {
              for (let i = 0; i < this.length; i++) {
                if (this[i] === indexOrValue) {
                  return this.slice(0, i).concat(this.slice(i + 1, this.length))
                }
              }

              return this
            }

            return 0 > indexOrValue
              ? this
              : this.slice(0, indexOrValue).concat(this.slice(indexOrValue+ 1, this.length))
          },
          // 数组去重方法
          Array.prototype.unique = function () {
            // 先排序
            this.sort()

            const res = [this[0]]

            for (let i = 1; i < this.length; i++) {
              if (this[i] !== res[res.length - 1]) {
                res.push(this[i])
              }
            }

            return res
          };

        let canvas = document.createElement("canvas"),
          graphics = canvas.getContext("2d");

        // JTopo 工具
        JTopo.util = {
          /** 全局通用方法 */

          // 旋转点，返回旋转后点的坐标信息
          rotatePoint,
          // 旋转多个点，返回旋转过程中经历的旋转点的位置信息
          rotatePoints,
          // 获取两点间的距离
          getDistance,
          // 返回事件触发时鼠标的位置信息
          getEventPosition,
          // 返回事件触发时鼠标的位置信息
          mouseCoords,
          // 观察者模式，其中 messageMap 为事件数组
          MessageBus,
          isFirefox: navigator.userAgent.indexOf("Firefox") > 0,
          isIE: !(!window.attachEvent || -1 !== navigator.userAgent.indexOf("Opera")),
          isChrome: null !== navigator.userAgent.toLowerCase().match(/chrome/),
          // 返回克隆的 json 对象
          clone,
          // 判断点是否在矩形内部
          isPointInRect,
          // 判断两个矩形是否重叠
          isRectOverlapRect,
          // 判断点是否在线上，很巧妙
          isPointInLine,
          // 从指定的数组中删除指定的元素
          removeFromArray,
          // 返回克隆的事件对象
          cloneEvent,
          // 随机产生 rgb 颜色
          randomColor,
          // 将舞台转换成 json 对象
          toJson,
          // 根据 json 数据加载舞台对象
          loadStageFromJson,
          // 用于获取元素的宽高位置等信息
          getElementsBound,
          // 获取图片告警，即变色功能
          getImageAlarm,
          // 获取元素相对于其祖先元素的偏移位置
          getOffsetPosition,
          // 线条函数：一元一次方程，线条的相关信息
          lineF,
          // 判断两条线是否相交，若相交，则返回交点坐标信息；若不相交，则返回 null
          intersection,
          // 使两条线相交：即，尝试旋转线条角度，使两条线最终能够相交
          intersectionLineBound,
          // 拷贝一个 json 对象
          copy(jsonObj) {
            return JSON.parse(JSON.stringify(jsonObj))
          },
          // 根据 key 获取链接中的参数 value
          getUrlParam(name) {
            // 构造一个含有目标参数的正则表达式对象
            const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)")
            // 匹配目标参数
            const r = window.location.search.substr(1).match(reg)

            // 返回参数值
            if (r != null) {
              return unescape(r[2])
            }

            return null
          },
          // 根据当前时间创建 Id
          creatId() {
            return "front" + (new Date).getTime() + Math.round(Math.random() * 1000000)
          },
          // 设置鼠标光标的形状或替代的图片地址
          setImageUrl(url) {
            JTopo.flag.imageUrl = url

            if (JTopo.flag.topoImgMap) {
              JTopo.MouseCursor.open_hand = "default"
              JTopo.MouseCursor.closed_hand = "default"
            } else {
              JTopo.MouseCursor.open_hand = "url(" + url + "openhand.cur) 8 8, default"
              JTopo.MouseCursor.closed_hand = "url(" + url + "closedhand.cur) 8 8, default"
            }
          },
          // TODO ？
          setCurHandUrl(url) {
            JTopo.util.setCurHandUrl(url)
          },
          /**
           * 节点本身图片闪动
           *
           * @param {Object} node
           * @param {Boolean} isChangeColor - 节点是否需要改变颜色
           * @param {Boolean} isFlash - 节点是否闪动
           * @param {any} originColor - 节点原始的颜色
           * @param {any} changeColor - 节点需要改变的颜色
           *
           */
          nodeFlash(node, isChangeColor, isFlash, originColor, changeColor) {
            // 节点原始颜色
            node.nodeOriginColor = originColor
            // 节点是否需要改变颜色：告警
            node.alarm = isChangeColor ? "true" : null
            // 节点需要改变的颜色
            node.fillAlarmNode = changeColor

            node.setImage('changeColor')

            // 清除计数器
            node.flashT && clearInterval(node.flashT)

            // 如果节点需要改变颜色 且 节点需要闪动
            if (isChangeColor && isFlash) {
              //闪动

              let i = 1
              let tag = null

              // 设置计时器
              node.flashT = setInterval(function () {
                tag = ++i % 2

                node.alarm = tag ? "true" : null

                // 如果 clearAllAnimateT
                if (JTopo.flag.clearAllAnimateT) {
                  // 清空计时器
                  clearInterval(node.flashT)
                }
              }, 1000)
            }
          },
          // 节点左上角图片闪动
          smallNodeFlash(node, isChangeColor, isFlash, originColor, changeColor) {
            // setSmallImage 为设置小图标
            // node.setImage('./images/alertIcon2.png','setSmallImage')
            // 结点,是否变色,是否闪动,底色,变色
            // JTopo.util.smallNodeFlash(node,true,true,[202,202,202],[222,81,69])

            node.smallImageOriginColor = originColor
            node.smallImageChangeColor = changeColor
            node.smallAlarmImageTag = isChangeColor ? "true" : null

            // 设置节点图片
            node.setImage('changeSmallImageColor')

            node.samllflashT && clearInterval(node.samllflashT)

            if (isChangeColor && isFlash) {
              let i = 1
              let tag = null

              node.samllflashT = setInterval(function () {
                tag = ++i % 2
                node.smallAlarmImageTag = tag ? "true" : null

                if (JTopo.flag.clearAllAnimateT) {
                  clearInterval(node.samllflashT)
                }
              }, 1000)
            }
          },
          // 获取两点的连线倾斜弧度
          getRotateAng(nodeA, nodeZ) {
            const x = nodeA.x - nodeZ.x
            const y = nodeA.y - nodeZ.y

            return Math.atan(y / x)
          },
          /**
           * 递归找到当前节点的所有上级节点和线条的 id
           *
           * @param {String} id
           * @param {Array} linksArr
           * @param {Object} saveObj
           * @return {Object}
           */
          findAllPrevNodesAndLinks(id, linksArr, saveObj) {
            let _saveObj = saveObj

            if (!saveObj) {
              _saveObj = {
                prevNodesId: [],
                prevLinksId: [],
              }
            }

            for (let j = 0; j < linksArr.length; j++) {
              const linkObj = linksArr[j]

              if (linkObj.nodeZ.id == id) {
                _saveObj.prevNodesId.push(linkObj.nodeA.id)
                _saveObj.prevLinksId.push(linkObj.id)

                JTopo.util.findAllPrevNodesAndLinks(linkObj.nodeA.id, linksArr, _saveObj)
              }
            }

            return _saveObj
          },
          /**
           * 递归找到当前节点的所有下级节点和线条的 id
           *
           * @param {String} id
           * @param {Array} linksArr
           * @param {Object} saveObj
           * @return {Object}
           */
          findAllNextNodesAndLinks(id, linksArr, saveObj) {
            let _saveObj = saveObj

            if (!saveObj) {
              _saveObj = {
                nextNodesId: [],
                nextLinksId: [],
              }
            }

            for (let j = 0; j < linksArr.length; j++) {
              const linkObj = linksArr[j]

              if (linkObj.nodeA.id == id) {
                _saveObj.nextNodesId.push(linkObj.nodeZ.id)
                _saveObj.nextLinksId.push(linkObj.id)

                JTopo.util.findAllNextNodesAndLinks(linkObj.nodeZ.id, linksArr, _saveObj)
              }
            }

            return _saveObj
          },
          // 根据 id 找到元素
          findEleById(id) {
            const idTypeName = id.indexOf('front') >= 0 ? '_id' : 'id'

            return JTopo.flag.curScene.childs.filter(function (child) {
              return (child[idTypeName] == id)
            })[0]
          },
          // 根据类型找到元素
          findEleByType(type) {
            return JTopo.flag.curScene.childs.filter(function (child) {
              return (child.elementType == type)
            })
          },
          /**
           * 设置弹窗的位置 TODO ?
           *
           * @param {Object} $pop - 弹窗 jquery 对象
           * @param {String} _nodeId - 节点 id
           * @param {Number} subW - 横坐标微调值
           * @param {Number} subH - 纵坐标微调值
           * @param {Number} $scroll
           *
           */
          setPopPos($pop, _nodeId, subW, subH, $scroll) {
            // 横坐标微调值
            const _subW = subW || 0
            // 纵坐标微调值
            const _subH = subH || 0
            // 节点 id
            const nodeId = _nodeId

            const $canvas = $('#canvas')
            const left = $canvas.offset().left
            const _top = $canvas.offset().top

            // 当前 scene 的缩放率
            const curSceneScaleXRate = JTopo.flag.curScene.scaleX
            const canvasW = $canvas.width()
            const canvasH = $canvas.height()

            // 弹窗 jquery 对象
            const $con = $pop

            // 目标节点
            let targetNode = null

            let px = null
            let py = null

            const scrollTop = $scroll ? $scroll.scrollTop() : 0

            JTopo.flag.curScene.childs.filter(function (child, p2, p3) {
              if (child.id == nodeId) {
                targetNode = child

                if (targetNode.elementType == 'link') {
                  px = (targetNode.nodeA.x + targetNode.nodeZ.x) * 0.5
                  py = (targetNode.nodeA.y + targetNode.nodeZ.y) * 0.5
                } else {
                  px = targetNode.x + targetNode.width
                  py = targetNode.y
                }
              }
            })

            //算法
            const conLeft = (1 - curSceneScaleXRate) * canvasW * 0.5 + (px + JTopo.flag.curScene.translateX) * curSceneScaleXRate + left + _subW
            const conTop = (1 - curSceneScaleXRate) * canvasH * 0.5 + (py + JTopo.flag.curScene.translateY) * curSceneScaleXRate + _top + _subH + scrollTop

            $con.css({
              left: conLeft,
              top: conTop,
            })
          },
          // 根据开辟空间的宽高和坐标,移动其四周的元素 TODO ?
          moveElePosByContainerBorder(eleObj, isOpen, callback) {
            JTopo.flag.curScene.childs.forEach(function (p) {
              if (isOpen) {
                // 1.不处理 1, 2, 3 象限
                // 2.处理 4 象限，且右移

                var subValue = eleObj.width

                if (p.elementType == 'node' && (p.x >= eleObj.x && p.y >= eleObj.y)) {
                  JTopo.Animate.stepByStep(p, {x: p.x + subValue}, 300, false).start()
                }
              } else {
                var subValue = eleObj.width

                eleObj.x += subValue

                if (p.elementType == 'node' && (p.x >= eleObj.x && p.y >= eleObj.y)) {
                  JTopo.Animate.stepByStep(p, {x: p.x - subValue}, 300, false).start()
                }
              }
            })

            callback && callback()
          },
        },
          JTopo.flag = {
            // canvas 上下文
            graphics,
            // 清除节点所有动画效果
            clearAllAnimateT: false,
            imageUrl: "./images/",
            // 当前场景
            curScene: null,
            // 连线配置
            linkConfigure: {
              // 连线描述文字是否倾斜
              textIsTilt: false,
              // 连线描述文字是否靠近终止节点端
              textIsNearToNodeZ: false,
            },
            // 节点配置
            nodeConfigure: {
              // 覆盖节点时，背景颜色，格式:"rgba(168, 202, 255, 0.5)"
              hoverBg: "rgba(168, 202, 255, 0.5)",
            },
            // 告警图片缓存
            alarmImageCache: {},
            // webpack打包时，需要把所有图片引入进来，形成静态资源，然后用映射来调用图片
            topoImgMap: null,
          },
          window.$for = $for,
          window.$foreach = $foreach
      }(JTopo),

      // 舞台 stage 方法的具体实现（JTopo.Stage(canvas) 构造器函数，参数为一个 canvas 元素节点对象）
      function (a) {
        // 返回鹰眼对象
        function b(a) {
          return {
            hgap: 16,
            // 鹰眼是否可见
            visible: !1,

            // 创建 canvas 元素
            exportCanvas: document.createElement("canvas"),

            getImage(b, c) {
              const d = a.getBound()
              let e = 1, f = 1

              this.exportCanvas.width = a.canvas.width,
                this.exportCanvas.height = a.canvas.height,
                null != b && null != c ? (this.exportCanvas.width = b,
                  this.exportCanvas.height = c,
                  e = b / d.width,
                  f = c / d.height) : (d.width > a.canvas.width && (this.exportCanvas.width = d.width),
                d.height > a.canvas.height && (this.exportCanvas.height = d.height));

              const g = this.exportCanvas.getContext("2d");

              return a.childs.length > 0 && (g.save(),
                g.clearRect(0, 0, this.exportCanvas.width, this.exportCanvas.height),
                a.childs.forEach(function (a) {
                  1 == a.visible && (a.save(),
                    a.translateX = 0,
                    a.translateY = 0,
                    a.scaleX = 1,
                    a.scaleY = 1,
                    g.scale(e, f),
                  d.left < 0 && (a.translateX = Math.abs(d.left)),
                  d.top < 0 && (a.translateY = Math.abs(d.top)),
                    a.paintAll = !0,
                    a.repaint(g),
                    a.paintAll = !1,
                    a.restore())
                }),
                g.restore()),
                this.exportCanvas.toDataURL("image/png")
            },

            // 创建 canvas 元素
            canvas: document.createElement("canvas"),

            update() {
              this.eagleImageDatas = this.getData(a)
            },

            // 设置鹰眼的宽高和鹰眼内 canvas 的宽高
            setSize(w, h) {
              this.width = this.canvas.width = w
              this.height = this.canvas.height = h
            },

            // 获取数据
            getData(b, c) {
              function d(a) {
                const b = a.stage.canvas.width
                const c = a.stage.canvas.height
                const d = b / a.scaleX / 2
                const e = c / a.scaleY / 2

                return {
                  translateX: a.translateX + d - d * a.scaleX,
                  translateY: a.translateY + e - e * a.scaleY,
                }
              }

              // 获取 canvas 元素
              const canvasObj = document.getElementById('canvas')
              // 设置鹰眼容器宽度
              const container_w = 250
              // 设置鹰眼容器高度
              const container_h = container_w * canvasObj.height / canvasObj.width

              // 设置鹰眼地图大小
              null != j && null != k
                ? this.setSize(b, c)
                : this.setSize(container_w, container_h)

              var ctx = this.canvas.getContext("2d")

              //绘制地图
              if (a.childs.length > 0) {
                ctx.save()
                // 清空鹰眼内 canvas 的内容
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

                a.childs.forEach(function (a) {
                  1 == a.visible && (
                    a.save(),
                      a.centerAndZoom(null, null, ctx),
                      a.repaint(ctx, 'eagleEye'),
                      a.restore()
                  )
                });

                // a 为 stage, a.childs[0] 为大画布
                var f = d(a.childs[0])
                var g = f.translateX * (this.canvas.width / a.canvas.width) * a.childs[0].scaleX
                var h = f.translateY * (this.canvas.height / a.canvas.height) * a.childs[0].scaleY
                var i = a.getBound()
                var j = a.canvas.width / a.childs[0].scaleX / i.width
                var k = a.canvas.height / a.childs[0].scaleY / i.height

                j > 1 && (j = 1),
                k > 1 && (j = 1),
                  g *= j,
                  h *= k,
                i.left < 0 && (g -= Math.abs(i.left) * (this.width / i.width)),
                i.top < 0 && (h -= Math.abs(i.top) * (this.height / i.height)),
                  ctx.save(),
                  ctx.fillStyle = "rgba(168,168,168,0.3)",
                  //  e.fillRect(-g, -h, e.canvas.width * j, e.canvas.height * k),
                  ctx.fillRect(-g + 9, -h + 5, this.canvas.width - 18, this.canvas.height - 10),
                  ctx.restore();
                //上面绘制小地图红色边框
                let l = null;
                try {
                  l = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
                } catch (m) {
                }

                return l;
              }
              return null
            },

            // 绘制
            paint() {
              if (null != this.eagleImageDatas) {
                const b = a.graphics
                const w = 4

                b.save(),
                  b.lineWidth = 1,
                  b.strokeStyle = "rgba(43, 43, 43, 0.8)",
                  b.strokeRect(
                    a.canvas.width - this.canvas.width - w,
                    a.canvas.height - this.canvas.height - w,
                    this.canvas.width + w - 1,
                    this.canvas.height + w
                  ),
                  b.putImageData(
                    this.eagleImageDatas,
                    a.canvas.width - this.canvas.width - w,
                    a.canvas.height - this.canvas.height - 1
                  ),
                  b.restore()
                //上述,strokeStyle为小地图边框
              } else {
                this.eagleImageDatas = this.getData(a)
              }
            },

            // 事件处理器
            eventHandler(eName, eObj, c) {
              let eX = eObj.x
              let eY = eObj.y

              if (
                eX > c.canvas.width - this.canvas.width
                && eY > c.canvas.height - this.canvas.height
              ) {
                if (
                  eX = eObj.x - this.canvas.width,
                    eY = eObj.y - this.canvas.height,
                  "mousedown" == eName && (
                    this.lastTranslateX = c.childs[0].translateX,
                    this.lastTranslateY = c.childs[0].translateY
                  ),
                  "mousedrag" == eName && c.childs.length > 0
                ) {
                  const f = eObj.dx
                    , g = eObj.dy
                    , h = c.getBound()
                    , i = this.canvas.width / c.childs[0].scaleX / h.width
                    , j = this.canvas.height / c.childs[0].scaleY / h.height;

                  c.childs[0].translateX = this.lastTranslateX - f / i,
                    c.childs[0].translateY = this.lastTranslateY - g / j
                }
              } else {

              }
            },
          }
        }

        function Stage(c) {
          // 返回事件被触发时鼠标和事件源的相关信息
          function d(e) {
            // 返回事件触发时鼠标的位置信息
            const eventObj = JTopo.util.getEventPosition(e)
            // 获取元素相对于其祖先元素的偏移位置
            const d = JTopo.util.getOffsetPosition(n.canvas)

            return eventObj.offsetLeft = eventObj.pageX - d.left,
              eventObj.offsetTop = eventObj.pageY - d.top,
              eventObj.x = eventObj.offsetLeft,
              eventObj.y = eventObj.offsetTop,
              eventObj.target = null,
              eventObj
          }

          // mouseover 事件处理程序
          function ee(e) {
            // 禁止选择
            document.onselectstart = function () {
              return !1
            }

            // 设置 stage.mouseOver 属性为 true
            this.mouseOver = !0

            // 返回事件被触发时鼠标和事件源的相关信息
            const b = d(e)

            n.dispatchEventToScenes("mouseover", b)
              , n.dispatchEvent("mouseover", b)
          }

          // mouseout 事件处理程序
          function f(e) {
            p = setTimeout(function () {
              o = !0
            }, 500),
              document.onselectstart = function () {
                return !0
              }
            ;
            const b = d(e);
            n.dispatchEventToScenes("mouseout", b),
              n.dispatchEvent("mouseout", b),
              n.needRepaint = 0 == n.animate ? !1 : !0
          }

          // mousedown 事件处理程序
          function g(e) {
            const b = d(e);

            n.mouseDown = !0,
              n.mouseDownX = b.x,
              n.mouseDownY = b.y,
              n.dispatchEventToScenes("mousedown", b),
              n.dispatchEvent("mousedown", b)
          }

          // mouseup 事件处理程序
          function h(e) {
            const b = d(e);

            n.dispatchEventToScenes("mouseup", b),
              n.dispatchEvent("mouseup", b),
              n.mouseDown = !1,
              n.needRepaint = 0 == n.animate ? !1 : !0
          }

          // mousemove 事件处理程序
          function i(e) {
            p && (window.clearTimeout(p),
              p = null),
              o = !1;

            const b = d(e);

            n.mouseDown ? 0 == e.button && (b.dx = b.x - n.mouseDownX,
              b.dy = b.y - n.mouseDownY,
              n.dispatchEventToScenes("mousedrag", b),
              n.dispatchEvent("mousedrag", b),
            1 == n.eagleEye.visible && n.eagleEye.update()) : (n.dispatchEventToScenes("mousemove", b),
              n.dispatchEvent("mousemove", b))
          }

          // click 事件处理程序
          function j(e) {
            const b = d(e);
            n.dispatchEventToScenes("click", b),
              n.dispatchEvent("click", b)
          }

          // dbclick 事件处理程序
          function k(e) {
            const b = d(e);
            n.dispatchEventToScenes("dbclick", b),
              n.dispatchEvent("dbclick", b)
          }

          // mousewheel 事件处理程序
          function l(e) {
            const b = d(e);
            n.dispatchEventToScenes("mousewheel", b),
              n.dispatchEvent("mousewheel", b),
            null != n.wheelZoom && (e.preventDefault ? e.preventDefault() : (e = e || window.event,
              e.returnValue = !1),
            1 == n.eagleEye.visible && n.eagleEye.update())
          }

          // 添加事件
          function m(ele) {
            JTopo.util.isIE || !window.addEventListener
              ? (ele.onmouseout = f,
                ele.onmouseover = ee,
                ele.onmousedown = g,
                ele.onmouseup = h,
                ele.onmousemove = i,
                ele.onclick = j,
                ele.ondblclick = k,
                ele.onmousewheel = l,
                ele.touchstart = g,
                ele.touchmove = i,
                ele.touchend = h)
              : (ele.addEventListener("mouseout", f),
                ele.addEventListener("mouseover", ee),
                ele.addEventListener("mousedown", g),
                ele.addEventListener("mouseup", h),
                ele.addEventListener("mousemove", i),
                ele.addEventListener("click", j),
                ele.addEventListener("dblclick", k),
                JTopo.util.isFirefox
                  ? ele.addEventListener("DOMMouseScroll", l)
                  : ele.addEventListener("mousewheel", l)), window.addEventListener && (window.addEventListener("keydown", function (e) {
              n.dispatchEventToScenes("keydown", JTopo.util.cloneEvent(e));

              const keyCode = e.keyCode;

              (37 == keyCode || 38 == keyCode || 39 == keyCode || 40 == keyCode) && (
                e.preventDefault
                  ? e.preventDefault()
                  : (e = e || window.event, e.returnValue = !1)
              )
            }, !0),

              window.addEventListener("keyup", function (e) {
                n.dispatchEventToScenes("keyup", JTopo.util.cloneEvent(e))

                const keyCode = e.keyCode

                (37 == keyCode || 38 == keyCode || 39 == keyCode || 40 == keyCode) && (
                  e.preventDefault
                    ? e.preventDefault()
                    : (e = e || window.event, e.returnValue = !1)
                )
              }, !0))
          }

          JTopo.stage = this

          var n = this

          // 舞台初始化
          this.initialize = function (canvas) {
            // 添加事件
            m(canvas),
              // 对应的 Canvas 对象
              this.canvas = canvas,
              // canvas 上下文
              this.graphics = canvas.getContext("2d"),
              // 场景对象列表
              this.childs = [],
              // 帧率: 设置当前舞台播放的帧数/秒
              //   - frames 可以为 0，表示：不自动绘制，由用户手工调用 Stage 对象的 paint() 方法来触发
              //   - 如果小于 0，表示：只有键盘、鼠标有动作时才会重绘，例如：stage.frames = -24
              this.frames = 24,
              this.messageBus = new JTopo.util.MessageBus,
              // 鹰眼对象
              //   - 显示鹰眼: stage.eagleEye.visible = true
              //   - 隐藏鹰眼: stage.eagleEye.visible = false
              this.eagleEye = b(this),
              // 鼠标滚轮缩放操作比例，默认为 null，不显示鹰眼
              //   - 启用鼠标滚轮缩放: stage.wheelZoom = 0.85; // 缩放比例为 0.85
              //   - 禁用鼠标滚轮缩放: stage.wheelZoom = null;
              this.wheelZoom = null,
              this.mouseDownX = 0,
              this.mouseDownY = 0,
              this.mouseDown = !1,
              this.mouseOver = !1,
              // 是否需要重绘
              this.needRepaint = !0,
              // 序列化的属性数组
              this.serializedProperties = ["frames", "wheelZoom"],
              // mode: 舞台模式，不同模式下有不同的表现（设置舞台模式，例如：stage.mode = "drag"）
              //   - normal[默认]：可以点击选中单个节点（按住 Ctrl 可以选中多个），点中空白处可以拖拽整个画面
              //   - drag: 该模式下不可以选择节点，只能拖拽整个画面
              //   - select: 可以框选多个节点、可以点击单个节点
              //   - edit: 在默认基础上增加了：选中节点时可以通过6个控制点来调整节点的宽、高
            this.mode = ''
          },

          null != c && this.initialize(c)

          var o = !0
          var p = null

          // 设置默认右键菜单是否可用
          document.oncontextmenu = function () {
            return o
          },

            /**
             * 为场景分配事件
             *
             * @param {String} eName - 事件名
             * @param {Object} eObj - 事件对象
             *
             */
            this.dispatchEventToScenes = function (eName, eObj) {
              if (
                0 != this.frames && (this.needRepaint = !0),
                1 == this.eagleEye.visible && -1 != eName.indexOf("mouse")
              ) {
                var eX = eObj.x
                var eY = eObj.y

                if (
                  eX > this.width - this.eagleEye.width
                  && eY > this.height - this.eagleEye.height
                ) {
                  return void this.eagleEye.eventHandler(eName, eObj, this)
                }
              }

              this.childs.forEach(function (c) {
                if (1 == c.visible) {
                  const d = c[eName + "Handler"]

                  if (null == d) {
                    throw new Error("Function not found:" + eName + "Handler")
                  }

                  d.call(c, eObj)
                }
              })
            },

            // add(Scene): 将一个 Scene 场景加入到舞台中（只有加入舞台才可以显示出来）
            this.add = function (scene) {
              for (let i = 0; i < this.childs.length; i++) {
                if (this.childs[i] === scene) {
                  return
                }
              }

              scene.addTo(this),
                this.childs.push(scene)
            },

            // remove(Scene): 将一个 Scene 场景从舞台中移除（不再显示）
            this.remove = function (scene) {
              if (null == scene) {
                throw new Error("Stage.remove鍑洪敊: 鍙傛暟涓簄ull!")
              }

              for (let i = 0; i < this.childs.length; i++) {
                if (this.childs[i] === scene) {
                  return scene.stage = null,
                    this.childs = this.childs.del(i),
                    this;
                }
              }

              return this
            },

            // 将所有 Scene 场景从舞台中移除
            this.clear = function () {
              this.childs = []
            },

            // 监听事件
            this.addEventListener = function (eName, cb) {
              const self = this
              const d = function (a) {
                cb.call(self, a)
              }

              return this.messageBus.subscribe(eName, d),
                this
            },

            // 移除监听事件，和 addEventListener 相对应
            this.removeEventListener = function (eName) {
              this.messageBus.unsubscribe(eName)
            },

            // 移除所有监听事件
            this.removeAllEventListener = function () {
              this.messageBus = new JTopo.util.MessageBus
            },

            // 分配事件
            this.dispatchEvent = function (eName, b) {
              return this.messageBus.publish(eName, b),
                this
            }
          ;

          const q = "click,dbclick,mousedown,mouseup,mouseover,mouseout,mousemove,mousedrag,mousewheel,touchstart,touchmove,touchend,keydown,keyup".split(","),
            r = this;
          q.forEach(function (a) {
            r[a] = function (b) {
              null != b ? this.addEventListener(a, b) : this.dispatchEvent(a)
            }
          }),

            // 导出成 PNG 图片（在新打开的浏览器 Tab 页中）
            this.saveImageInfo = function (a, b) {
              const c = this.eagleEye.getImage(a, b)
                , d = window.open("about:blank");
              return d.document.write("<img src='" + c + "' alt='from canvas'/>"),
                this
            },

            // 导出成 PNG 图片（直接弹出另存为对话框或者用下载软件下载）
            this.saveAsLocalImage = function (a, b) {
              const c = this.eagleEye.getImage(a, b);
              return c.replace("image/png", "image/octet-stream"),
                window.location.href = c,
                this
            },

            // 执行一次绘制，如果 frames 设置为 0，可以手工调用此方法来通知 jtopo 进行一次重绘
            this.paint = function () {
              null != this.canvas && (this.graphics.save(),
                this.graphics.clearRect(0, 0, this.width, this.height),
                this.childs.forEach(function (a) {
                  1 == a.visible && a.repaint(n.graphics)
                }),
              1 == this.eagleEye.visible && this.eagleEye.paint(this),
                this.graphics.restore())
            },

            this.repaint = function () {
              0 != this.frames && (this.frames < 0 && 0 == this.needRepaint || (this.paint(),
              this.frames < 0 && (this.needRepaint = !1)))
            },

            // zoom(scale): 缩放，scale 取值范围 [0-1], 实际上本操作是调用了舞台中所有 Scene 对象的 zoom 函数
            this.zoom = function (a) {
              this.childs.forEach(function (b) {
                0 != b.visible && b.zoom(a)
              })
            },

            // zoomOut(scale): 放大，scale 取值范围 [0-1]，调用 zoom 实现
            this.zoomOut = function (a) {
              this.childs.forEach(function (b) {
                0 != b.visible && b.zoomOut(a)
              })
            },

            // zoomIn(scale): 缩小，scale 取值范围 [0-1]，调用 zoom 实现
            this.zoomIn = function (a) {
              this.childs.forEach(function (b) {
                0 != b.visible && b.zoomIn(a)
              })
            },

            this.zoomReset = function () {
              this.childs.forEach(function (b) {
                0 != b.visible && b.zoomReset()
              })
            },

            // centerAndZoom(scale): 缩放并居中显示所有元素
            this.centerAndZoom = function () {
              this.childs.forEach(function (a) {
                0 != a.visible && a.centerAndZoom()
              })
            },

            // setCenter(x, y): 设置当前舞台的中心坐标（舞台平移）
            this.setCenter = function (a, b) {
              const c = this;
              this.childs.forEach(function (d) {
                let e = a - c.canvas.width / 2
                  , f = b - c.canvas.height / 2;
                d.translateX = -e,
                  d.translateY = -f
              })
            },

            // 得到舞台中所有元素位置确定的边界大小（left、top、right、bottom）
            this.getBound = function () {
              const a = {
                left: Number.MAX_VALUE,
                right: Number.MIN_VALUE,
                top: Number.MAX_VALUE,
                bottom: Number.MIN_VALUE
              };

              return this.childs.forEach(function (b) {
                const c = b.getElementsBound();

                c.left < a.left && (a.left = c.left,
                  a.leftNode = c.leftNode),
                c.top < a.top && (a.top = c.top,
                  a.topNode = c.topNode),
                c.right > a.right && (a.right = c.right,
                  a.rightNode = c.rightNode),
                c.bottom > a.bottom && (a.bottom = c.bottom,
                  a.bottomNode = c.bottomNode)
              }),
                a.width = a.right - a.left,
                a.height = a.bottom - a.top,
                a
            },

            // 把当前对象的属性序列化成 json 数据
            this.toJson = function () {
              {
                var b = this
                  , c = '{"version":"' + a.version + '",';
                this.serializedProperties.length
              }

              return this.serializedProperties.forEach(function (a) {
                let d = b[a];

                "string" == typeof d && (d = '"' + d + '"'),
                  c += '"' + a + '":' + d + ","
              }),

                c += '"childs":[',
                this.childs.forEach(function (a) {
                  c += a.toJson()
                }),
                c += "]",
                c += "}"
            },

            function hahaha() {
              0 == n.frames ? setTimeout(hahaha, 100) : n.frames < 0 ? (n.repaint(),
                setTimeout(hahaha, 1e3 / -n.frames)) : (n.repaint(),
                setTimeout(hahaha, 1e3 / n.frames))
            }(),

            setTimeout(function () {
              n.mousewheel(function (a) {
                const b = null == a.wheelDelta ? a.detail : a.wheelDelta;
                null != this.wheelZoom && (b > 0 ? this.zoomIn(this.wheelZoom) : this.zoomOut(this.wheelZoom))
              }),
                n.paint()
            }, 300),

            setTimeout(function () {
              n.paint()
            }, 1e3),

            setTimeout(function () {
              n.paint()
            }, 3e3)
        }

        Stage.prototype = {
          get width() {
            return this.canvas.width
          },
          get height() {
            return this.canvas.height
          },
          set cursor(a) {
            this.canvas.style.cursor = a
          },
          get cursor() {
            return this.canvas.style.cursor
          },
          set mode(a) {
            this.childs.forEach(function (b) {
              b.mode = a
            })
          }
        },
          JTopo.Stage = Stage
      }(JTopo),

      // 场景 scene 方法的具体实现（JTopo.Scene(stage) 构造器函数，参数为 stage 舞台实例）
      function (a) {
        function b(c) {
          function d(a, b, c, d) {
            return function (e) {
              e.beginPath(),
                e.strokeStyle = "rgba(0, 0, 236, 0.5)",
                e.fillStyle = "rgba(0, 0, 236, 0.1)",
                e.rect(a, b, c, d),
                e.fill(),
                e.stroke(),
                e.closePath()
            }
          }

          var e = this;
          JTopo.flag.curScene = this;

          /********************scene属性定制************************************/

          this.initialize = function () {
            b.prototype.initialize.apply(this, arguments),
              this.messageBus = new JTopo.util.MessageBus,
              this.elementType = "scene",
              this.childs = [],
              this.zIndexMap = {},
              this.zIndexArray = [],
              // 背景颜色，设置的时候请注意 alpha 属性
              this.backgroundColor = "255,255,255",
              // 得到、设置场景是否可见，默认为：true
              this.visible = !0,
              // 场景的透明度，默认为 0，即：完全透明。所以有时候即使设置了背景颜色却不起作用
              this.alpha = 0,
              this.scaleX = 1,
              this.scaleY = 1,
              // 舞台模式，不同模式下有不同的表现：
              //   - normal[默认]：可以点击选中单个节点（按住 Ctrl 可以选中多个），点中空白处可以拖拽整个画面
              //   - drag: 该模式下不可以选择节点，只能拖拽整个画面
              //   - select: 可以框选多个节点、可以点击单个节点
              //   - edit: 在默认基础上增加了：选中节点时可以通过6个控制点来调整节点的宽、高
              this.mode = a.SceneMode.normal,
              this.translate = !0,
              // 场景偏移量（水平方向），随鼠标拖拽变化
              this.translateX = 0,
              // 场景偏移量（垂直方向），随鼠标拖拽变化
              this.translateY = 0,
              this.lastTranslateX = 0,
              this.lastTranslateY = 0,
              this.mouseDown = !1,
              this.mouseDownX = null,
              this.mouseDownY = null,
              this.mouseDownEvent = null,
              // 在 select 模式中，是否显示选择矩形框
              this.areaSelect = !0,
              this.operations = [],
              // 当前场景中被选中的元素对象
              this.selectedElements = [],
              this.paintAll = !1;

            const c = "background,backgroundColor,mode,paintAll,areaSelect,translate,translateX,translateY,lastTranslatedX,lastTranslatedY,alpha,visible,scaleX,scaleY".split(",");

            this.serializedProperties = this.serializedProperties.concat(c)
          } ,

            this.initialize(),
            this.setBackground = function (a) {
              // 设置场景的背景图片
              //  - 与 backgroundColor 冲突，一旦设置了该属性，backgroundColor 属性将失效
              //  - 例如：scene.background = "./img/bg.png";
              this.background = a
            },

            this.addTo = function (a) {
              this.stage !== a && null != a && (this.stage = a)
            },

          null != c && (c.add(this),

            this.addTo(c)),

            // 显示
            this.show = function () {
              this.visible = !0
            },

            // 隐藏
            this.hide = function () {
              this.visible = !1
            },

            this.paint = function (a, mapTag) {
              if (0 != this.visible && null != this.stage) {
                if (a.save(),
                    this.paintBackgroud(a),
                    a.restore(),
                    a.save(),
                    a.scale(this.scaleX, this.scaleY),
                  1 == this.translate) {
                  const b = this.getOffsetTranslate(a);
                  if (mapTag != 'eagleEye') {
                    a.translate(b.translateX, b.translateY)
                  }

                }
                this.paintChilds(a),
                  a.restore(),
                  a.save(),
                  this.paintOperations(a, this.operations),
                  a.restore()
              }
            },

            this.repaint = function (a, mapTag) {
              0 != this.visible && this.paint(a, mapTag)
            },

            this.paintBackgroud = function (a) {
              null != this.background ? a.drawImage(this.background, 0, 0, a.canvas.width, a.canvas.height) : (a.beginPath(),
                a.fillStyle = "rgba(" + this.backgroundColor + "," + this.alpha + ")",
                a.fillRect(0, 0, a.canvas.width, a.canvas.height),
                a.closePath())
            },

            // 获取场景中可见并绘制出来的元素（超过 Canvas 边界）
            this.getDisplayedElements = function () {
              for (var a = [], b = 0; b < this.zIndexArray.length; b++) {
                const c = this.zIndexArray[b], d = this.zIndexMap[c];
                let e = 0;
                for (; e < d.length; e++) {
                  const f = d[e];
                  this.isVisiable(f) && a.push(f)
                }
              }
              return a
            },

            // 获取场景中可见并绘制出来的 Node 对象（超过 Canvas 边界）
            this.getDisplayedNodes = function () {
              for (var b = [], c = 0; c < this.childs.length; c++) {
                const d = this.childs[c];
                d instanceof a.Node && this.isVisiable(d) && b.push(d)
              }
              return b
            },

            this.paintChilds = function (b) {
              for (let c = 0; c < this.zIndexArray.length; c++) {
                const d = this.zIndexArray[c], e = this.zIndexMap[d];
                let f = 0;
                for (; f < e.length; f++) {
                  const g = e[f];
                  if (1 == this.paintAll || this.isVisiable(g)) {
                    if (b.save(),
                      1 == g.transformAble) {
                      const h = g.getCenterLocation();
                      b.translate(h.x, h.y),
                      g.rotate && b.rotate(g.rotate),
                        g.scaleX && g.scaleY ? b.scale(g.scaleX, g.scaleY) : g.scaleX ? b.scale(g.scaleX, 1) : g.scaleY && b.scale(1, g.scaleY)
                    }
                    1 == g.shadow && (b.shadowBlur = g.shadowBlur,
                      b.shadowColor = g.shadowColor,
                      b.shadowOffsetX = g.shadowOffsetX,
                      b.shadowOffsetY = g.shadowOffsetY),
                    g instanceof a.InteractiveElement && (g.selected && 1 == g.showSelected && g.paintSelected(b),
                    1 == g.isMouseOver && g.paintMouseover(b)),
                      g.paint(b),
                      b.restore()
                  }
                }
              }
            },

            // 获取相对位移
            this.getOffsetTranslate = function (a) {
              let b = this.stage.canvas.width
                , c = this.stage.canvas.height;
              null != a && "move" != a && (b = a.canvas.width, c = a.canvas.height);
              const d = b / this.scaleX / 2
                , e = c / this.scaleY / 2
                , f = {
                translateX: this.translateX + (d - d * this.scaleX),
                translateY: this.translateY + (e - e * this.scaleY)
              };
              return f
            },

            this.isVisiable = function (b) {
              if (1 != b.visible)
                return !1;
              if (b instanceof a.Link)
                return !0;
              const c = this.getOffsetTranslate()
              ;let d = b.x + c.translateX
                , e = b.y + c.translateY;
              d *= this.scaleX,
                e *= this.scaleY;
              const f = d + b.width * this.scaleX
                , g = e + b.height * this.scaleY;
              return d > this.stage.canvas.width || e > this.stage.canvas.height || 0 > f || 0 > g ? !1 : !0
            },

            this.paintOperations = function (a, b) {
              for (let c = 0; c < b.length; c++)
                b[c](a)
            },

            // 查找场景中的对象，例如：findElements(function(e) {return e.x>100;});
            this.findElements = function (a) {
              for (var b = [], c = 0; c < this.childs.length; c++)
                1 == a(this.childs[c]) && b.push(this.childs[c]);
              return b
            },

            this.getElementsByClass = function (a) {
              return this.findElements(function (b) {
                return b instanceof a
              })
            },

            this.addOperation = function (a) {
              return this.operations.push(a),
                this
            },

            this.clearOperations = function () {
              return this.operations = [],
                this
            },

            this.getElementByXY = function (b, c) {
              for (var d = null, e = this.zIndexArray.length - 1; e >= 0; e--) {
                const f = this.zIndexArray[e], g = this.zIndexMap[f];
                let h = g.length - 1;
                for (; h >= 0; h--) {
                  const i = g[h];
                  if (i instanceof a.InteractiveElement && this.isVisiable(i) && i.isInBound(b, c))
                    return d = i
                }
              }
              return d
            },

            // add(element): 添加对象到当前场景中来，例如：scene.add(new JTopo.Node()); scene.add(new JTopo.Link(nodeA, nodeZ))
            this.add = function (a) {
              this.childs.push(a),
              null == this.zIndexMap[a.zIndex] && (this.zIndexMap[a.zIndex] = [],
                this.zIndexArray.push(a.zIndex),
                this.zIndexArray.sort(function (a, b) {
                  return a - b
                })),
                this.zIndexMap["" + a.zIndex].push(a);
              const thisObj = this;
              setTimeout(function () {
                thisObj.stage && thisObj.stage.eagleEye.update();
              }, 100);
            },

            // remove(element): 移除场景中的某个元素，例如：scene.remove(myNode);
            this.remove = function (b) {
              this.childs = JTopo.util.removeFromArray(this.childs, b);
              const c = this.zIndexMap[b.zIndex];
              c && (this.zIndexMap[b.zIndex] = JTopo.util.removeFromArray(c, b)),
                b.removeHandler(this);
              const thisObj = this;
              setTimeout(function () {
                thisObj.stage && thisObj.stage.eagleEye.update();
              }, 100);
            },

            // clear(): 移除场景中的所有元素
            this.clear = function () {
              const a = this;
              this.childs.forEach(function (b) {
                b.removeHandler(a)
              }),
                this.childs = [],
                this.operations = [],
                this.zIndexArray = [],
                this.zIndexMap = {};
              const thisObj = this;
              setTimeout(function () {
                thisObj.stage && thisObj.stage.eagleEye.update();
              }, 100);
            },

            this.addToSelected = function (a) {

              this.selectedElements.push(a)
            },

            this.cancelAllSelected = function (a) {
              for (let b = 0; b < this.selectedElements.length; b++)
                this.selectedElements[b].unselectedHandler(a);
              this.selectedElements = []
            },

            this.notInSelectedNodes = function (a) {
              for (let b = 0; b < this.selectedElements.length; b++)
                if (a === this.selectedElements[b])
                  return !1;
              return !0
            },

            this.removeFromSelected = function (a) {
              for (let b = 0; b < this.selectedElements.length; b++) {
                const c = this.selectedElements[b];
                a === c && (this.selectedElements = this.selectedElements.del(b))
              }
            },

            this.toSceneEvent = function (b) {
              const c = JTopo.util.clone(b);
              if (c.x /= this.scaleX,
                  c.y /= this.scaleY,
                1 == this.translate) {
                const d = this.getOffsetTranslate();
                c.x -= d.translateX,
                  c.y -= d.translateY
              }
              return null != c.dx && (c.dx /= this.scaleX,
                c.dy /= this.scaleY),
              null != this.currentElement && (c.target = this.currentElement),
                c.scene = this,
                c
            },

            this.selectElement = function (a) {

              const b = e.getElementByXY(a.x, a.y);
              if (null != b)
                if (a.target = b,
                    b.mousedownHander(a),
                    b.selectedHandler(a),
                    e.notInSelectedNodes(b))
                  a.ctrlKey || e.cancelAllSelected(),
                    e.addToSelected(b);
                else {
                  1 == a.ctrlKey && (b.unselectedHandler(),
                    this.removeFromSelected(b));
                  for (let c = 0; c < this.selectedElements.length; c++) {
                    const d = this.selectedElements[c];
                    d.selectedHandler(a)
                  }
                }
              else
                a.ctrlKey || e.cancelAllSelected();
              this.currentElement = b
            },

            this.mousedownHandler = function (b) {
              const c = this.toSceneEvent(b);

              if (this.mouseDown = !0,
                  this.mouseDownX = c.x,
                  this.mouseDownY = c.y,
                  this.mouseDownEvent = c,
                this.mode == a.SceneMode.normal)
                this.selectElement(c),
                (null == this.currentElement || this.currentElement instanceof a.Link) && 1 == this.translate && (this.lastTranslateX = this.translateX,
                  this.lastTranslateY = this.translateY);
              else {
                if (this.mode == a.SceneMode.drag && 1 == this.translate)
                  return this.lastTranslateX = this.translateX,
                    void (this.lastTranslateY = this.translateY);
                this.mode == a.SceneMode.select ? this.selectElement(c) : this.mode == a.SceneMode.edit && (this.selectElement(c),
                (null == this.currentElement || this.currentElement instanceof a.Link) && 1 == this.translate && (this.lastTranslateX = this.translateX,
                  this.lastTranslateY = this.translateY))
              }
              e.dispatchEvent("mousedown", c)
            },

            this.mouseupHandler = function (b) {
              this.stage.cursor != a.MouseCursor.normal && (this.stage.cursor = a.MouseCursor.normal),
                e.clearOperations();
              const c = this.toSceneEvent(b);
              null != this.currentElement && (c.target = e.currentElement,
                this.currentElement.mouseupHandler(c)),
                this.dispatchEvent("mouseup", c),
                this.mouseDown = !1
            },

            this.dragElements = function (b) {
              if (null != this.currentElement && 1 == this.currentElement.dragable)
                for (let c = 0; c < this.selectedElements.length; c++) {
                  const d = this.selectedElements[c];
                  if (0 != d.dragable) {
                    const e = JTopo.util.clone(b);
                    e.target = d,
                      d.mousedragHandler(e)
                  }
                }
            },

            this.mousedragHandler = function (b) {
              const c = this.toSceneEvent(b);

              this.mode == a.SceneMode.normal ?
                null == this.currentElement || this.currentElement instanceof a.Link ?
                  1 == this.translate && (this.stage.cursor = a.MouseCursor.closed_hand,
                    this.translateX = this.lastTranslateX + c.dx,
                    this.translateY = this.lastTranslateY + c.dy)
                  :
                  this.dragElements(c) :
                this.mode == a.SceneMode.drag ?
                  1 == this.translate && (this.stage.cursor = a.MouseCursor.closed_hand,
                    this.translateX = this.lastTranslateX + c.dx,
                    this.translateY = this.lastTranslateY + c.dy)
                  :
                  this.mode == a.SceneMode.select ?
                    null != this.currentElement ? 1 == this.currentElement.dragable && this.dragElements(c)
                      :
                      1 == this.areaSelect && this.areaSelectHandle(c)
                    :
                    this.mode == a.SceneMode.edit && (null == this.currentElement || this.currentElement instanceof a.Link ?
                    1 == this.translate && (this.stage.cursor = a.MouseCursor.closed_hand,
                      this.translateX = this.lastTranslateX + c.dx,
                      this.translateY = this.lastTranslateY + c.dy)
                    :
                    this.dragElements(c)),
                this.dispatchEvent("mousedrag", c)
            },

            this.areaSelectHandle = function (a) {
              let b = a.offsetLeft
                , c = a.offsetTop
                , f = this.mouseDownEvent.offsetLeft
                , g = this.mouseDownEvent.offsetTop
                , h = b >= f ? f : b
                , i = c >= g ? g : c
                , j = Math.abs(a.dx) * this.scaleX
                , k = Math.abs(a.dy) * this.scaleY
              ;const l = new d(h, i, j, k);
              e.clearOperations().addOperation(l),
                b = a.x,
                c = a.y,
                f = this.mouseDownEvent.x,
                g = this.mouseDownEvent.y,
                h = b >= f ? f : b,
                i = c >= g ? g : c,
                j = Math.abs(a.dx),
                k = Math.abs(a.dy);
              const m = h + j, n = i + k;
              let o = 0;
              for (; o < e.childs.length; o++) {
                const p = e.childs[o];
                p.x > h && p.x + p.width < m && p.y > i && p.y + p.height < n && e.notInSelectedNodes(p) && (p.selectedHandler(a),
                  e.addToSelected(p))
              }
            },

            this.mousemoveHandler = function (b) {

              this.mousecoord = {
                x: b.x,
                y: b.y
              };
              const c = this.toSceneEvent(b);
              if (this.mode == a.SceneMode.drag)
                return void (this.stage.cursor = a.MouseCursor.open_hand);
              this.mode == a.SceneMode.normal ? this.stage.cursor = a.MouseCursor.normal : this.mode == a.SceneMode.select && (this.stage.cursor = a.MouseCursor.normal);
              const d = e.getElementByXY(c.x, c.y);
              null != d ? (e.mouseOverelement && e.mouseOverelement !== d && (c.target = d,
                e.mouseOverelement.mouseoutHandler(c)),
                e.mouseOverelement = d,
                0 == d.isMouseOver ? (c.target = d,
                  d.mouseoverHandler(c),
                  e.dispatchEvent("mouseover", c)) : (c.target = d,
                  d.mousemoveHandler(c),
                  e.dispatchEvent("mousemove", c))) : e.mouseOverelement ? (c.target = d,
                e.mouseOverelement.mouseoutHandler(c),
                e.mouseOverelement = null,
                e.dispatchEvent("mouseout", c)) : (c.target = null,
                e.dispatchEvent("mousemove", c))
            },

            this.mouseoverHandler = function (a) {
              const b = this.toSceneEvent(a);
              this.dispatchEvent("mouseover", b)
            },

            this.mouseoutHandler = function (a) {
              const b = this.toSceneEvent(a);
              this.dispatchEvent("mouseout", b)
            },

            this.clickHandler = function (a) {
              const b = this.toSceneEvent(a);
              this.currentElement && (b.target = this.currentElement,
                this.currentElement.clickHandler(b)),
                this.dispatchEvent("click", b)
            },

            this.dbclickHandler = function (a) {
              const b = this.toSceneEvent(a);
              this.currentElement ? (b.target = this.currentElement,
                this.currentElement.dbclickHandler(b)) : e.cancelAllSelected(),
                this.dispatchEvent("dbclick", b)
            },

            this.mousewheelHandler = function (a) {
              const b = this.toSceneEvent(a);
              this.dispatchEvent("mousewheel", b)
            },

            this.touchstart = this.mousedownHander,

            this.touchmove = this.mousedragHandler,

            this.touchend = this.mousedownHander,

            this.keydownHandler = function (a) {
              this.dispatchEvent("keydown", a)
            },

            this.keyupHandler = function (a) {
              this.dispatchEvent("keyup", a)
            },

            this.addEventListener = function (a, b) {
              const c = this
                , d = function (a) {
                b.call(c, a)
              };
              return this.messageBus.subscribe(a, d),
                this
            },

            this.removeEventListener = function (a) {
              this.messageBus.unsubscribe(a)
            },

            this.removeAllEventListener = function () {
              this.messageBus = new JTopo.util.MessageBus
            },

            this.dispatchEvent = function (a, b) {
              return this.messageBus.publish(a, b),
                this
            }
          ;
          var f = "click,dbclick,mousedown,mouseup,mouseover,mouseout,mousemove,mousedrag,mousewheel,touchstart,touchmove,touchend,keydown,keyup".split(","),
            g = this;
          return f.forEach(function (a) {
            g[a] = function (b) {
              null != b ? this.addEventListener(a, b) : this.dispatchEvent(a)
            }
          }),
            this.zoom = function (a, b) {
              null != a && 0 != a && (this.scaleX = a),
              null != b && 0 != b && (this.scaleY = b)
            },

            this.zoomOut = function (a) {
              0 != a && (null == a && (a = .8),
                this.scaleX /= a,
                this.scaleY /= a)
            },

            this.zoomIn = function (a) {
              0 != a && (null == a && (a = .8),
                this.scaleX *= a,
                this.scaleY *= a)
            },

            this.zoomReset = function () {
              this.scaleX = 1;
              this.scaleY = 1;
            },

            this.getBound = function () {
              return {
                left: 0,
                top: 0,
                right: this.stage.canvas.width,
                bottom: this.stage.canvas.height,
                width: this.stage.canvas.width,
                height: this.stage.canvas.height
              }
            },

            this.getElementsBound = function () {
              return JTopo.util.getElementsBound(this.childs)
            },

            this.translateToCenter = function (a) {
              const b = this.getElementsBound()
              ;let c = this.stage.canvas.width / 2 - (b.left + b.right) / 2
                , d = this.stage.canvas.height / 2 - (b.top + b.bottom) / 2;
              a && (c = a.canvas.width / 2 - (b.left + b.right) / 2,
                d = a.canvas.height / 2 - (b.top + b.bottom) / 2),
                this.translateX = c,
                this.translateY = d
            },

            this.setCenter = function (a, b) {
              let c = a - this.stage.canvas.width / 2
                , d = b - this.stage.canvas.height / 2;
              this.translateX = -c,
                this.translateY = -d
            },

            this.centerAndZoom = function (a, b, c) {
              if (a == 'toCenter') {
                this.translateToCenter(c);
                return;
              }
              if (
                this.translateToCenter(c),
                null == a || null == b) {
                const d = this.getElementsBound()
                ;let e = d.right - d.left
                  , f = d.bottom - d.top
                  , g = this.stage.canvas.width / e
                  , h = this.stage.canvas.height / f;
                if (c) {
                  const canvasObj = document.getElementById('canvas');
                  const canvasWidth = canvasObj.width;
                  const canvasHeight = canvasObj.height;
                  if (e < canvasWidth) {
                    e = canvasWidth;
                  }
                  if (f < canvasWidth) {
                    f = canvasHeight;
                  }
                  g = c.canvas.width / e;
                  h = c.canvas.height / f;
                }
                const i = Math.min(g, h);
                if (i > 1)
                  return;
                //    this.zoom(g,h)
                this.zoom(i, i)
              }
              this.zoom(a, b)
            },

            this.getCenterLocation = function () {
              return {
                x: e.stage.canvas.width / 2,
                y: e.stage.canvas.height / 2
              }
            },

            this.doLayout = function (a) {
              a && a(this, this.childs)
            },

            this.toJson = function () {
              {
                var a = this
                  , b = "{";
                this.serializedProperties.length
              }
              this.serializedProperties.forEach(function (c) {
                let d = a[c];
                "background" == c && (d = a._background.src),
                "string" == typeof d && (d = '"' + d + '"'),
                  b += '"' + c + '":' + d + ","
              }),
                b += '"childs":[';
              var c = this.childs.length;
              return this.childs.forEach(function (a, d) {
                b += a.toJson(),
                c > d + 1 && (b += ",")
              }),
                b += "]",
                b += "}"
            },
            e
        }

        b.prototype = new a.Element;

        var c = {};

        Object.defineProperties(b.prototype, {
          background: {
            get: function () {
              return this._background
            },
            set: function (a) {
              if ("string" == typeof a) {
                let b = c[a];
                null == b && (b = new Image,
                    b.src = a,
                    b.onload = function () {
                      c[a] = b
                    }
                ),
                  this._background = b
              } else
                this._background = a
            }
          }
        }),
          a.Scene = b
      }(JTopo),

      // displayElement 的具体实现,包含所有元素默认展示属性，挂载在 jTopo 上
      function (a) {
        // b - DisplayElement
        function b() {
          this.initialize = function () {
            b.prototype.initialize.apply(this, arguments),
              // 元素类型
              this.elementType = "displayElement",
              this.x = 0,
              this.y = 0,
              // 元素宽
              this.width = 32,
              // 元素高
              this.height = 32,
              // 元素是否可见
              this.visible = !0,
              // 元素透明度
              this.alpha = 1,
              // 元素旋转
              this.rotate = 0,
              // 元素横向缩放
              this.scaleX = 1,
              // 元素纵向缩放
              this.scaleY = 1
              // 元素描边颜色
              this.strokeColor = "22, 124, 255",
              // 元素边框颜色
              this.borderColor = "22, 124, 255",
                // 元素填充颜色
              this.fillColor = "255, 255, 255",
              // 元素是否有阴影
              this.shadow = !1,
              // 元素阴影模糊度
              this.shadowBlur = 5,
              // 元素阴影颜色
              this.shadowColor = "rgba(0, 0, 0, 0.5)",
              // 元素阴影横向偏移量
              this.shadowOffsetX = 3,
              // 元素阴影纵向偏移量
              this.shadowOffsetY = 6,
              // 元素是否可转换
              this.transformAble = !1,
              // 元素显示级别
              this.zIndex = 0;

            const a = "x,y,width,height,visible,alpha,rotate,scaleX,scaleY,strokeColor,fillColor,shadow,shadowColor,shadowOffsetX,shadowOffsetY,transformAble,zIndex".split(",")

            // 元素序列化属性
            this.serializedProperties = this.serializedProperties.concat(a)
          },
            this.initialize(),

            this.paint = function (ctx) {
              ctx.beginPath(),
                ctx.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")",
                ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height),
                ctx.fill(),
                ctx.stroke(),
                ctx.closePath()
            },

            this.getLocation = function () {
              return {
                x: this.x,
                y: this.y
              }
            },

            this.setLocation = function (x, y) {
              // 画布上鼠标移动时激活
              return this.x = x,
                this.y = y,
                this
            },

            this.getCenterLocation = function () {
              return {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2
              }
            },

            this.setCenterLocation = function (x, y) {
              return this.x = x - this.width / 2,
                this.y = y - this.height / 2,
                this
            },

            this.getSize = function () {
              return {
                width: this.width,
                height: this.heith
              }
            },

            this.setSize = function (w, h) {
              return this.width = w,
                this.height = h,
                this
            },

            this.getBound = function () {
              return {
                left: this.x,
                top: this.y,
                right: this.x + this.width,
                bottom: this.y + this.height,
                width: this.width,
                height: this.height
              }
            },

            this.setBound = function (x, y, w, h) {
              return this.setLocation(x, y),
                this.setSize(w, h),
                this
            },

            this.getDisplayBound = function () {
              return {
                left: this.x,
                top: this.y,
                right: this.x + this.width * this.scaleX,
                bottom: this.y + this.height * this.scaleY
              }
            },

            this.getDisplaySize = function () {
              return {
                width: this.width * this.scaleX,
                height: this.height * this.scaleY
              }
            },

            this.getPosition = function (posDesc) {
              let posObj
              const c = this.getBound()

              return "Top_Left" == posDesc ? posObj = {
                x: c.left,
                y: c.top
              } : "Top_Center" == posDesc ? posObj = {
                x: this.cx,
                y: c.top
              } : "Top_Right" == posDesc ? posObj = {
                x: c.right,
                y: c.top
              } : "Middle_Left" == posDesc ? posObj = {
                x: c.left,
                y: this.cy
              } : "Middle_Center" == posDesc ? posObj = {
                x: this.cx,
                y: this.cy
              } : "Middle_Right" == posDesc ? posObj = {
                x: c.right,
                y: this.cy
              } : "Bottom_Left" == posDesc ? posObj = {
                x: c.left,
                y: c.bottom
              } : "Bottom_Center" == posDesc ? posObj = {
                x: this.cx,
                y: c.bottom
              } : "Bottom_Top" == posDesc ? posObj = {
                x: this.cx,
                y: c.bottom
              } : "Bottom_Right" == posDesc && (posObj = {
                x: c.right,
                y: c.bottom
              }),
                posObj
            }
        }
        // c - InteractiveElement
        function c() {
          this.initialize = function () {
            c.prototype.initialize.apply(this, arguments),
              this.elementType = "interactiveElement",
              this.dragable = !1,
              this.selected = !1,
              this.showSelected = !0,
              this.selectedLocation = null,
              this.isMouseOver = !1;
            const a = "dragable,selected,showSelected,isMouseOver".split(",");
            this.serializedProperties = this.serializedProperties.concat(a)
          },
            this.initialize(),
            this.paintSelected = function (a) {
              0 != this.showSelected && (a.save(),
                a.beginPath(),
                a.strokeStyle = "rgba(168,202,255, 0.5)",
                a.fillStyle = JTopo.flag.nodeConfigure.hoverBg,//节点背景颜色
                a.rect(-this.width / 2 - 3, -this.height / 2 - 3, this.width + 6, this.height + 6),
                a.fill(),
                a.stroke(),
                a.closePath(),
                a.restore())
            },
            this.paintMouseover = function (a) {
              return this.paintSelected(a)
            },
            this.isInBound = function (a, b) {
              return a > this.x && a < this.x + this.width * Math.abs(this.scaleX) && b > this.y && b < this.y + this.height * Math.abs(this.scaleY)
            },
            this.selectedHandler = function () {
              this.selected = !0,
                this.selectedLocation = {
                  x: this.x,
                  y: this.y
                }
            },
            this.unselectedHandler = function () {
              this.selected = !1,
                this.selectedLocation = null
            },
            this.dbclickHandler = function (a) {
              this.dispatchEvent("dbclick", a)
            },
            this.clickHandler = function (a) {
              this.dispatchEvent("click", a)
            },
            this.mousedownHander = function (a) {
              this.dispatchEvent("mousedown", a)
            },
            this.mouseupHandler = function (a) {
              this.dispatchEvent("mouseup", a)
            },
            this.mouseoverHandler = function (a) {
              this.isMouseOver = !0,
                this.dispatchEvent("mouseover", a)
            },
            this.mousemoveHandler = function (a) {
              this.dispatchEvent("mousemove", a)
            },
            this.mouseoutHandler = function (a) {
              this.isMouseOver = !1,
                this.dispatchEvent("mouseout", a)
            },
            this.mousedragHandler = function (a) {
              const b = this.selectedLocation.x + a.dx
                , c = this.selectedLocation.y + a.dy;
              this.setLocation(b, c),
                this.dispatchEvent("mousedrag", a)
            },
            this.addEventListener = function (b, c) {
              const d = this
                , e = function (a) {
                c.call(d, a)
              };
              return this.messageBus || (this.messageBus = new JTopo.util.MessageBus),
                this.messageBus.subscribe(b, e),
                this
            },
            this.dispatchEvent = function (a, b) {
              return this.messageBus ? (this.messageBus.publish(a, b),
                this) : null
            },
            this.removeEventListener = function (a) {
              this.messageBus.unsubscribe(a)
            },
            this.removeAllEventListener = function () {
              this.messageBus = new JTopo.util.MessageBus
            }
          ;
          var b = "click,dbclick,mousedown,mouseup,mouseover,mouseout,mousemove,mousedrag,touchstart,touchmove,touchend".split(","),
            d = this;
          b.forEach(function (a) {
            d[a] = function (b) {
              null != b ? this.addEventListener(a, b) : this.dispatchEvent(a)
            }
          })
        }
        // d - EditableElement
        function d() {
          this.initialize = function () {
            d.prototype.initialize.apply(this, arguments),
              this.editAble = !1,
              this.selectedPoint = null
          },
            this.getCtrlPosition = function (a) {
              const b = 5
                , c = 5
                , d = this.getPosition(a);
              return {
                left: d.x - b,
                top: d.y - c,
                right: d.x + b,
                bottom: d.y + c
              }
            },
            this.selectedHandler = function (b) {
              d.prototype.selectedHandler.apply(this, arguments),
                this.selectedSize = {
                  width: this.width,
                  height: this.height
                },
              b.scene.mode == a.SceneMode.edit && (this.editAble = !0)
            },
            this.unselectedHandler = function () {
              d.prototype.unselectedHandler.apply(this, arguments),
                this.selectedSize = null,
                this.editAble = !1
            };
          var b = ["Top_Left", "Top_Center", "Top_Right", "Middle_Left", "Middle_Right", "Bottom_Left", "Bottom_Center", "Bottom_Top", "Bottom_Right"];
          this.paintCtrl = function (a) {
            if (0 != this.editAble) {
              a.save();
              for (let c = 0; c < b.length; c++) {
                const d = this.getCtrlPosition(b[c]);
                d.left -= this.cx,
                  d.right -= this.cx,
                  d.top -= this.cy,
                  d.bottom -= this.cy;
                const e = d.right - d.left
                  , f = d.bottom - d.top;
                a.beginPath(),
                  a.strokeStyle = "rgba(0,0,0,0.8)",
                  a.rect(d.left, d.top, e, f),
                  a.stroke(),
                  a.closePath(),
                  a.beginPath(),
                  a.strokeStyle = "rgba(255,255,255,0.3)",
                  a.rect(d.left + 1, d.top + 1, e - 2, f - 2),
                  a.stroke(),
                  a.closePath()
              }
              a.restore()
            }
          },
            this.isInBound = function (a, c) {
              if (this.selectedPoint = null,
                1 == this.editAble)
                for (let e = 0; e < b.length; e++) {
                  const f = this.getCtrlPosition(b[e]);
                  if (a > f.left && a < f.right && c > f.top && c < f.bottom)
                    return this.selectedPoint = b[e],
                      !0
                }
              return d.prototype.isInBound.apply(this, arguments)
            },
            this.mousedragHandler = function (a) {

              if (null == this.selectedPoint) {
                var b = this.selectedLocation.x + a.dx
                  , c = this.selectedLocation.y + a.dy;

                //tag:节点拖动时设置位置
                this.setLocation(b, c),
                  this.dispatchEvent("mousedrag", a)
              } else {
                if ("Top_Left" == this.selectedPoint) {
                  var d = this.selectedSize.width - a.dx
                    , e = this.selectedSize.height - a.dy
                    , b = this.selectedLocation.x + a.dx
                    , c = this.selectedLocation.y + a.dy;
                  b < this.x + this.width && (this.x = b,
                    this.width = d),
                  c < this.y + this.height && (this.y = c,
                    this.height = e)
                } else if ("Top_Center" == this.selectedPoint) {
                  var e = this.selectedSize.height - a.dy
                    , c = this.selectedLocation.y + a.dy;
                  c < this.y + this.height && (this.y = c,
                    this.height = e)
                } else if ("Top_Right" == this.selectedPoint) {
                  var d = this.selectedSize.width + a.dx
                    , c = this.selectedLocation.y + a.dy;
                  c < this.y + this.height && (this.y = c,
                    this.height = this.selectedSize.height - a.dy),
                  d > 1 && (this.width = d)
                } else if ("Middle_Left" == this.selectedPoint) {
                  var d = this.selectedSize.width - a.dx
                    , b = this.selectedLocation.x + a.dx;
                  b < this.x + this.width && (this.x = b),
                  d > 1 && (this.width = d)
                } else if ("Middle_Right" == this.selectedPoint) {
                  var d = this.selectedSize.width + a.dx;
                  d > 1 && (this.width = d)
                } else if ("Bottom_Left" == this.selectedPoint) {
                  var d = this.selectedSize.width - a.dx
                    , b = this.selectedLocation.x + a.dx;
                  d > 1 && (this.x = b,
                    this.width = d);
                  var e = this.selectedSize.height + a.dy;
                  e > 1 && (this.height = e)
                } else if ("Bottom_Center" == this.selectedPoint) {
                  var e = this.selectedSize.height + a.dy;
                  e > 1 && (this.height = e)
                } else if ("Bottom_Top" == this.selectedPoint) {
                  var e = this.selectedSize.height + a.dy;
                  e > 1 && (this.height = e)
                } else if ("Bottom_Right" == this.selectedPoint) {
                  var d = this.selectedSize.width + a.dx;
                  d > 1 && (this.width = d);
                  var e = this.selectedSize.height + a.dy;
                  e > 1 && (this.height = e)
                }
                this.dispatchEvent("resize", a)
              }
            }
        }

        b.prototype = new JTopo.Element,
          Object.defineProperties(b.prototype, {
            // 获取或设置元素中心点的横坐标
            cx: {
              get: function () {
                return this.x + this.width / 2
              },
              set: function (a) {
                this.x = a - this.width / 2
              }
            },
            // 获取或设置元素中心点的纵坐标
            cy: {
              get: function () {
                return this.y + this.height / 2
              },
              set: function (a) {
                this.y = a - this.height / 2
              }
            }
          }),
          c.prototype = new b,
          d.prototype = new c,
          JTopo.DisplayElement = b,
          JTopo.InteractiveElement = c,
          JTopo.EditableElement = d
      }(JTopo),

      // node 的具体实现（包括 textNode 和 linkNode、CircleNode、AnimateNode）
      function (a) {
        // new b -
        function b(c) {
          this.initialize = function (c) {
            b.prototype.initialize.apply(this, arguments),
              // 节点元素类型
              this.elementType = "node",
              // 节点元素显示的优先级，范围 [10-999]，10 以下保留占用
              this.zIndex = a.zIndex_Node,
              // 设置节点的名字（显示文本）
              this.text = c,
              this.nodeFn = null,
              this.textBreakNumber = 5;

            // 节点文字行高
            this.textLineHeight = 15;
            // 节点文字透明度
            this.textAlpah = 1;
            // 节点字体
            this.font = "12px Consolas",
              // 节点字体颜色
              this.fontColor = "85, 85, 85",
              // 节点边框宽度
              this.borderWidth = 0,
              // 节点边框宽度
              this.borderColor = "255, 255, 255",
              // 节点边框圆角
              this.borderRadius = null,
              // 告警颜色
              this.alarmColor = "255, 0, 0";
            this.fillAlarmNode = [255, 0, 0];
            this.nodeOriginColor = null;
            // false
            this.showAlarmText = false;
            // true 则保持改变后的颜色不变
            this.keepChangeColor = false;
            // 设置节点是否可以拖动
            this.dragable = !0,
              // 节点文字位置
              this.textPosition = "Bottom_Center",
              // 节点文字位置偏移
              this.textOffsetX = 0,
              this.textOffsetY = 0,
              this.transformAble = !0,
              this.inLinks = null,
              this.outLinks = null;
            // 线性渐变
            this.linearGradient = null;
            this.colorStop = null;
            // 告警图片图片宽高
            this.smallAlarmImage_w = 20;
            this.smallAlarmImage_h = 20;
            // 告警图片位置
            this.smallAlarmImage_x = null;
            this.smallAlarmImage_y = null;
            // 是否开启告警图片变色
            this.smallAlarmImageTag = false;
            // 告警图片对象
            this.smallAlarmImageObj = null;
            // 告警变色图片对象
            this.smallAlarmImageChangeObj = null;
            // 告警变色图片最初的颜色
            this.smallImageOriginColor = [255, 0, 0];
            // 告警图片需要变换的颜色
            this.smallImageChangeColor = null;
            // 节点绘制回调
            this.paintCallback = null;
            // 节点绘制前回调
            this.beforePaintCallback = null;

            const d = "text,font,fontColor,textPosition,textOffsetX,textOffsetY,borderRadius".split(",");
            this.serializedProperties = this.serializedProperties.concat(d)
          },
            this.initialize(c),

            // 节点绘制方法
            this.paint = function (a) {
              this.beforePaintCallback && this.beforePaintCallback(a)

              if (this.image) {
                const b = a.globalAlpha
                a.globalAlpha = this.alpha

                if (typeof this.image != 'string') {
                  if (this.keepChangeColor) {
                    a.drawImage(this.image.alarm, -this.width / 2, -this.height / 2, this.width, this.height)
                  } else {
                    if (null != this.image.alarm && null != this.alarm) {
                      a.drawImage(this.image.alarm, -this.width / 2, -this.height / 2, this.width, this.height)
                    } else {
                      a.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)
                    }
                  }
                }
                a.globalAlpha = b;
              } else {
                a.beginPath(),
                  a.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")",
                  null == this.borderRadius || 0 == this.borderRadius ? a.rect(-this.width / 2, -this.height / 2, this.width, this.height) : a.JTopoRoundRect(-this.width / 2, -this.height / 2, this.width, this.height, this.borderRadius),
                  a.fill();
              }
              if (this.linearGradient) {
                const kVal = this.kVal;
                const grd = a.createLinearGradient(this.linearGradient[0], this.linearGradient[1], this.linearGradient[2] * kVal, this.linearGradient[3]);
                for (let grdCount = 0; grdCount < this.colorStop.length / 2; grdCount++) {
                  grd.addColorStop(this.colorStop[grdCount * 2], this.colorStop[grdCount * 2 + 1]);
                }
                a.fillStyle = grd;
                null == this.borderRadius || 0 == this.borderRadius ? a.rect(-this.width / 2, -this.height / 2, this.width * kVal, this.height) : a.JTopoRoundRect(-this.width / 2, -this.height / 2, this.width * kVal, this.height, kVal < 0.03 ? 0 : this.borderRadius);
                a.fill();

              }
              a.closePath();

              this.paintText(a),
                this.paintBorder(a),
                this.paintCtrl(a),
                this.paintAlarmText(a),
                this.paintAlarmImage(a),
              this.paintCallback && this.paintCallback(a);
            },

            // 节点告警文字显示方法
            this.paintAlarmText = function (a) {
              if (null != this.alarm && "" != this.alarm && this.showAlarmText) {
                const b = this.alarmColor
                  , c = this.alarmAlpha || .5;
                a.beginPath(),
                  a.font = this.alarmFont || "10px 微软雅黑";
                const d = a.measureText(this.alarm).width + 6
                  , e = a.measureText("田").width + 6
                  , f = this.width / 2 - d / 2
                  , g = -this.height / 2 - e - 8;
                a.strokeStyle = "rgba(" + b + ", " + c + ")",
                  //   a.fillStyle = "rgba(" + b + ", " + c + ")",
                  a.fillStyle = "rgba(255,255,255,0.5)",//背景颜色
                  a.lineCap = "round",
                  a.lineWidth = 1,
                  a.moveTo(f, g),
                  a.lineTo(f + d, g),
                  a.lineTo(f + d, g + e),
                  a.lineTo(f + d / 2 + 6, g + e),
                  a.lineTo(f + d / 2, g + e + 8),
                  a.lineTo(f + d / 2 - 6, g + e),
                  a.lineTo(f, g + e),
                  a.lineTo(f, g),
                  a.fill(),
                  a.stroke(),
                  a.closePath(),
                  a.beginPath(),
                  a.strokeStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
                  a.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",//告警文字颜色
                  a.fillText(this.alarm, f + 16.5, g + e - 4),
                  a.closePath()
              }
            },

            //luozheao20170616
            this.paintAlarmImage = function (a) {
              //this.smallAlarmImageTag  是否开启告警图片变色
              //this.smallAlarmImage  告警图片名称
              //smallAlarmImage_w,smallAlarmImage_h   你猜这是什么
              //this.smallAlarmImageObj 为告警图片对象
              //this.smallAlarmImageChangeObj 为告警变色图片对象

              if (null != this.smallAlarmImageObj && "" != this.smallAlarmImageObj) {
                const b = a.globalAlpha;
                a.globalAlpha = this.alpha,
                  this.smallAlarmImageChangeObj && this.smallAlarmImageTag
                    ? a.drawImage(this.smallAlarmImageChangeObj, this.smallAlarmImage_x !== null ? this.smallAlarmImage_x : -10 - this.width / 2, this.smallAlarmImage_y !== null ? this.smallAlarmImage_y : -this.height / 2, this.smallAlarmImage_w, this.smallAlarmImage_h)
                    : a.drawImage(this.smallAlarmImageObj, this.smallAlarmImage_x !== null ? this.smallAlarmImage_x : -10 - this.width / 2, this.smallAlarmImage_y !== null ? this.smallAlarmImage_y : -this.height / 2, this.smallAlarmImage_w, this.smallAlarmImage_h),
                  a.globalAlpha = b
              }
            },

            // 节点文字绘制
            this.paintText = function (a) {
              const b = this.text;
              if (null != b && "" != b) {
                a.beginPath(),
                  a.font = this.font;
                const c = a.measureText(b).width
                  , d = a.measureText("田").width;
                a.fillStyle = "rgba(" + this.fontColor + ", " + this.textAlpah + ")";
                const e = this.getTextPostion(this.textPosition, c, d);

                draw_long_text(b, a, e.x, e.y, this, d),
                  a.closePath();

                //处理节点文字的换行问题
                function draw_long_text(longtext, cxt, nBegin_width, nBegin_height, obj, textHeight) {
                  var lineHeight = obj.textLineHeight;
                  if (obj.nodeFn == 'alarm') {
                    //告警类型节点，改变字体颜色
                    const arr = longtext.split(/\d+/);
                    const strArr = longtext.match(/\d+/);
                    var begin_width = nBegin_width;
                    //第一段
                    const len1 = cxt.measureText(arr[0]).width;
                    const startP1 = begin_width;
                    cxt.fillText(arr[0], startP1, nBegin_height);
                    //第二段
                    const len2 = cxt.measureText(strArr[0]).width;
                    const startP2 = startP1 + len1;
                    if (parseInt(strArr[0]) == 0) {
                      cxt.fillStyle = 'rgba(149,193,90,1)';
                    } else {
                      cxt.fillStyle = 'rgba(249,2,2,1)';
                    }
                    cxt.fillText(strArr[0], startP2, nBegin_height);
                    //第三段
                    const len3 = cxt.measureText(arr[2]).width;
                    const startP3 = startP2 + len2;
                    cxt.fillStyle = 'rgba(43,43,43,1)';
                    cxt.fillText(arr[1], startP3, nBegin_height);

                  }
                  else if (longtext.indexOf('$') > 0) {
                    let text = "";
                    let count = 0;
                    var begin_width;//基准位，默认为节点中心点的x坐标
                    let begin_height = nBegin_height;
                    var lineHeight = lineHeight || 12;
                    const stringLenght = longtext.length;

                    const newtext = longtext.split("");
                    const context = cxt;
                    context.textAlign = obj.textAlign;
                    switch (obj.textAlign) {
                      case "center":
                        begin_width = 0;
                        break;
                      case "left":
                        begin_width = nBegin_width + 7;
                        const cn = (longtext.split('$')).length;//行数
                        const csh = cn * lineHeight - textHeight; //总高度
                        begin_height = nBegin_height - csh / 2;
                        break;
                      default:
                        console.log('少年，等待你来拓展' + obj.textAlign + '这个功能');
                    }


                    for (let i = 0; i <= stringLenght; i++) {

                      if (newtext[0] == '$') {
                        context.fillText(text, begin_width, begin_height);
                        begin_height = begin_height + lineHeight;
                        text = "";
                        newtext.shift();
                      }
                      if (i == stringLenght) {
                        context.fillText(text, begin_width, begin_height);
                      }
                      if (newtext[0] != undefined) {
                        text = text + newtext[0];
                      }

                      count++;
                      newtext.shift();
                    }
                  }
                  else {
                    cxt.fillText(longtext, nBegin_width, nBegin_height);
                  }
                }
              }
            },

            // 节点边框绘制
            this.paintBorder = function (a) {
              if (0 != this.borderWidth) {
                a.beginPath(),
                  a.lineWidth = this.borderWidth,
                  a.strokeStyle = "rgba(" + this.borderColor + "," + this.alpha + ")";
                const b = this.borderWidth / 2;
                null == this.borderRadius || 0 == this.borderRadius ? a.rect(-this.width / 2 - b, -this.height / 2 - b, this.width + this.borderWidth, this.height + this.borderWidth) : a.JTopoRoundRect(-this.width / 2 - b, -this.height / 2 - b, this.width + this.borderWidth, this.height + this.borderWidth, this.borderRadius),
                  a.stroke(),
                  a.closePath()
              }
            },

            // 获取节点文本位置
            this.getTextPostion = function (a, b, c) {
              let d = null;
              return null == a || "Bottom_Center" == a ? d = {
                x: -this.width / 2 + (this.width - b) / 2,
                y: this.height / 2 + c
              } : "Bottom_Top" == a ? d = {
                x: -this.width / 2 + (this.width - b) / 2,
                // y: this.height / 2 + c
                y: c
              } : "Top_Center" == a ? d = {
                x: -this.width / 2 + (this.width - b) / 2,
                y: -this.height / 2 - c / 2
              } : "Top_Right" == a ? d = {
                x: this.width / 2,
                y: -this.height / 2 - c / 2
              } : "Top_Left" == a ? d = {
                x: -this.width / 2 - b,
                y: -this.height / 2 - c / 2
              } : "Bottom_Right" == a ? d = {
                x: this.width / 2,
                y: this.height / 2 + c
              } : "Bottom_Left" == a ? d = {
                x: -this.width / 2 - b,
                y: this.height / 2 + c
              } : "Middle_Center" == a ? d = {
                x: -this.width / 2 + (this.width - b) / 2,
                y: c / 2
              } : "Middle_Right" == a ? d = {
                x: this.width / 2,
                y: c / 2
              } : "Middle_Left" == a && (d = {
                x: -this.width / 2 - b,
                y: c / 2
              }),
              null != this.textOffsetX && (d.x += this.textOffsetX),
              null != this.textOffsetY && (d.y += this.textOffsetY),
                d
            },

            // 设置节点图片
            this.setImage = function (b, c) {
              if (null == b) {
                throw new Error("Node.setImage(): 参数Image对象为空!")
              }

              const d = this

              if (b == 'changeColor') {
                d.image && (
                  d.image.alarm = JTopo.util.getImageAlarm(d.image, null, d.fillAlarmNode, d.nodeOriginColor)
                )
              } else if (b == 'changeSmallImageColor') {
                d.smallAlarmImageObj && (
                  d.smallAlarmImageChangeObj = JTopo.util.getImageAlarm(d.smallAlarmImageObj, null, d.smallImageChangeColor, d.smallImageOriginColor)
                )
              } else if ("string" == typeof b && c == 'setSmallImage') {
                var e = null

                e = new Image,
                  e.src = b,
                  e.onload = function () {
                    const f = JTopo.util.getImageAlarm(e, null, d.smallImageChangeColor, d.smallImageOriginColor)

                    d.smallAlarmImageChangeObj = f
                    d.smallAlarmImageObj = e
                  }
              } else if (c == 'imageDataFlow') {
                var e = null

                e = new Image,
                  e.src = JTopo.flag.topoImgMap[b],
                  e.onload = function () {
                    const f = JTopo.util.getImageAlarm(e, null, d.fillAlarmNode, d.nodeOriginColor)

                    f && (e.alarm = f)
                    d.image = e
                  }
              } else if ("string" == typeof b) {
                // 不能用缓存，j为作用域较大，每次切换都不会清空
                // var e = j[b]

                var e = null

                null == e
                  ? (
                    e = new Image,
                    e.src = b,
                    e.onload = function () {
                      j[b] = e,
                      1 == c && d.setSize(e.width, e.height);
                      //告警色,指定色
                      const f = JTopo.util.getImageAlarm(e, null, d.fillAlarmNode, d.nodeOriginColor)

                      f && (e.alarm = f),
                        d.image = e
                  }
                  )
                  : (c && this.setSize(e.width, e.height),
                  this.image = e)
              } else {
                debugger
                this.image = b,
                1 == c && this.setSize(b.width, b.height)
              }
            },

            this.removeHandler = function (a) {
              const b = this

              this.outLinks && (this.outLinks.forEach(function (c) {
                c.nodeA === b && a.remove(c)
              }),
                this.outLinks = null),
              this.inLinks && (this.inLinks.forEach(function (c) {
                c.nodeZ === b && a.remove(c)
              }),
                this.inLinks = null);

              //对父级容器处理
              const pc = this.parentContainer

              if (pc && pc.length > 0) {
                for (let i = 0; i < pc.length; i++) {
                  const pcObj = pc[i]

                  pcObj.remove(b)

                  if (pcObj.childs.length == 0) {
                    JTopo.flag.curScene.remove(pcObj)
                  }
                }
              }
            }
        }

        // new c -
        function c() {
          c.prototype.initialize.apply(this, arguments)
        }

        // d - TextNode
        function d(a) {
          this.initialize(),
            this.text = a,
            this.elementType = "TextNode",
            //textnode 放到容器中，容器再外加一个容器，移动容器，textnode 不能触发位移
            this.paint = function (a) {
              a.beginPath(),
                a.font = this.font,
                this.width = a.measureText(this.text).width,
                this.height = a.measureText("田").width,
                // 描边样式
                a.strokeStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
                // 填充样式
                a.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
                // 填充文本
                a.fillText(this.text, -this.width / 2, this.height / 2),

                a.closePath(),
                // 绘制边框
                this.paintBorder(a),

                this.paintCtrl(a),

                // 绘制告警文本
                this.paintAlarmText(a)
            }
        }

        // e - LinkNode
        function e(a, b, c) {
          this.initialize(),

            this.text = a,
            this.href = b,
            this.target = c,
            this.elementType = "LinkNode",
            this.isVisited = !1,
            this.isStopLinkNodeClick = false,
            this.visitedColor = null,

            this.paint = function (a) {
              a.beginPath(),
                a.font = this.font,
                this.width = a.measureText(this.text).width,
                this.height = a.measureText("田").width,
                this.isVisited && null != this.visitedColor ? (a.strokeStyle = "rgba(" + this.visitedColor + ", " + this.alpha + ")",
                  a.fillStyle = "rgba(" + this.visitedColor + ", " + this.alpha + ")") : (a.strokeStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
                  a.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")");
              draw_long_text(this.text, a, -this.width / 2, this.height / 2, this);
              // a.fillText(this.text, -this.width / 2, this.height / 2);
              this.isMouseOver && (a.moveTo(-this.width / 2, this.height),
                a.lineTo(this.width / 2, this.height),
                a.stroke()),
                a.closePath(),
                this.paintBorder(a),
                this.paintCtrl(a),
                this.paintAlarmText(a);

              /**
               * 绘制长文本
               *
               * @param {String} longtext - 文字内容
               * @param {Object} cxt - 画布对象
               * @param {String} nBegin_width - 坐标 x
               * @param {String} nBegin_height - 坐标 y
               * @param {Object} obj - 结点对象
               * @return
               */
              function draw_long_text(longtext, cxt, nBegin_width, nBegin_height, obj) {
                // 文本行高
                const lineHeight = obj.textLineHeight

                if (obj.nodeFn == 'alarm') {
                  // 告警类型节点，改变字体颜色
                  const arr = longtext.split(/\d+/)
                  const strArr = longtext.match(/\d+/)
                  const begin_width = nBegin_width

                  //第一段
                  const len1 = cxt.measureText(arr[0]).width
                  const startP1 = begin_width
                  cxt.fillText(arr[0], startP1, nBegin_height)

                  //第二段
                  const len2 = cxt.measureText(strArr[0]).width
                  const startP2 = startP1 + len1

                  if (parseInt(strArr[0]) == 0) {
                    cxt.fillStyle = 'rgba(149, 193, 90, 1)'
                  } else {
                    cxt.fillStyle = 'rgba(249, 2, 2, 1)'
                  }

                  cxt.fillText(strArr[0], startP2, nBegin_height)

                  //第三段
                  const len3 = cxt.measureText(arr[2]).width
                  const startP3 = startP2 + len2
                  cxt.fillStyle = 'rgba(43, 43, 43, 1)'
                  cxt.fillText(arr[1], startP3, nBegin_height)
                }
              }
            },

            this.mousemove(function () {
              const a = document.getElementsByTagName("canvas")

              if (a && a.length > 0)
                for (let b = 0; b < a.length; b++)
                  a[b].style.cursor = "pointer"
            }),

            this.mouseout(function () {
              const a = document.getElementsByTagName("canvas");
              if (a && a.length > 0)
                for (let b = 0; b < a.length; b++)
                  a[b].style.cursor = "default"
            }),

            this.click(function () {
              if (!this.isStopLinkNodeClick) {
                "_blank" == this.target ? window.open(this.href) : location = this.href,
                  this.isVisited = !0
              }
            })
        }

        // f - CircleNode
        function f(a) {
          this.initialize(arguments),

            this._radius = 20,
            this.beginDegree = 0,
            this.endDegree = 2 * Math.PI,
            this.text = a,

            this.paint = function (a) {
              a.save(),
                a.beginPath(),
                a.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")",
                a.arc(0, 0, this.radius, this.beginDegree, this.endDegree, !0),
                a.fill(),
                a.closePath(),
                a.restore(),
                this.paintText(a),
                this.paintBorder(a),
                this.paintCtrl(a),
                this.paintAlarmText(a)
            },

            this.paintSelected = function (a) {
              a.save(),
                a.beginPath(),
                a.strokeStyle = "rgba(168, 202, 255, 0.9)",
                a.fillStyle = "rgba(168, 202, 236, 0.7)",
                a.arc(0, 0, this.radius + 3, this.beginDegree, this.endDegree, !0),
                a.fill(),
                a.stroke(),
                a.closePath(),
                a.restore()
            }
        }

        // g -
        function g(a, b, c) {
          this.initialize(),
            this.frameImages = a || [],
            this.frameIndex = 0,
            this.isStop = !0;
          const d = b || 1e3;
          this.repeatPlay = !1;
          const e = this;
          this.nextFrame = function () {
            if (!this.isStop && null != this.frameImages.length) {
              if (this.frameIndex++,
                this.frameIndex >= this.frameImages.length) {
                if (!this.repeatPlay)
                  return;
                this.frameIndex = 0
              }
              this.setImage(this.frameImages[this.frameIndex], c),
                setTimeout(function () {
                  e.nextFrame()
                }, d / a.length)
            }
          }
        }

        function h(a, b, c, d, e) {
          this.initialize();
          const f = this;
          this.setImage(a),
            this.frameIndex = 0,
            this.isPause = !0,
            this.repeatPlay = !1;
          const g = d || 1e3;
          e = e || 0,
            this.paint = function (a) {
              if (this.image) {
                let b = this.width
                  , d = this.height;
                a.save(),
                  a.beginPath(),
                  a.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")";
                const f = (Math.floor(this.frameIndex / c) + e) * d
                  , g = Math.floor(this.frameIndex % c) * b;
                a.drawImage(this.image, g, f, b, d, -b / 2, -d / 2, b, d),
                  a.fill(),
                  a.closePath(),
                  a.restore(),
                  this.paintText(a),
                  this.paintBorder(a),
                  this.paintCtrl(a),
                  this.paintAlarmText(a)
              }
            },
            this.nextFrame = function () {
              if (!this.isStop) {
                if (this.frameIndex++,
                  this.frameIndex >= b * c) {
                  if (!this.repeatPlay)
                    return;
                  this.frameIndex = 0
                }
                setTimeout(function () {
                  f.isStop || f.nextFrame()
                }, g / (b * c))
              }
            }
        }

        // i - AnimateNode
        // 可能参数：图片地址，行，列，时间间隔，行偏移量
        function i() {
          let a = null;
          return a = arguments.length <= 3 ? new g(arguments[0], arguments[1], arguments[2]) : new h(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]),
            a.stop = function () {
              a.isStop = !0
            },
            a.play = function () {
              a.isStop = !1,
                a.frameIndex = 0,
                a.nextFrame()
            },
            a
        }

        var j = {};
        b.prototype = new JTopo.EditableElement,
          c.prototype = new b,
          d.prototype = new c,
          e.prototype = new d,
          f.prototype = new c,
          Object.defineProperties(f.prototype, {
            radius: {
              get: function () {
                return this._radius
              },
              set: function (a) {
                this._radius = a;
                const b = 2 * this.radius
                  , c = 2 * this.radius;
                this.width = b,
                  this.height = c
              }
            },
            width: {
              get: function () {
                return this._width
              },
              set: function (a) {
                this._radius = a / 2,
                  this._width = a
              }
            },
            height: {
              get: function () {
                return this._height
              },
              set: function (a) {
                this._radius = a / 2,
                  this._height = a
              }
            }
          }),
          g.prototype = new c,
          h.prototype = new c,
          i.prototype = new c,
          JTopo.Node = c,
          JTopo.TextNode = d,
          JTopo.LinkNode = e,
          JTopo.CircleNode = f,
          JTopo.AnimateNode = i
      }(JTopo),

      // link 的具体实现
      function (a) {
        function b(a, b) {
          const c = [];
          if (null == a || null == b)
            return c;
          if (a && b && a.outLinks && b.inLinks)
            for (let d = 0; d < a.outLinks.length; d++) {
              const e = a.outLinks[d];
              let f = 0;
              for (; f < b.inLinks.length; f++) {
                const g = b.inLinks[f];
                e === g && c.push(g)
              }
            }
          return c
        }

        function c(a, c) {
          const d = b(a, c), e = b(c, a), f = d.concat(e);
          return f
        }

        function d(a) {
          let b = c(a.nodeA, a.nodeZ);
          return b = b.filter(function (b) {
            return a !== b
          })
        }

        function e(a, b) {
          return c(a, b).length
        }

        // f -- Link
        function f(b, c, g) {
          function h(b, c) {
            const d = JTopo.util.lineF(b.cx, b.cy, c.cx, c.cy)
              , e = b.getBound()
              , f = JTopo.util.intersectionLineBound(d, e);
            return f
          }

          this.initialize = function (b, c, d) {
            if (
              f.prototype.initialize.apply(this, arguments),
                this.elementType = "link",
                this.zIndex = a.zIndex_Link,
              0 != arguments.length
            ) {
              this.text = d,
                this.nodeA = b,
                this.nodeZ = c,
              this.nodeA && null == this.nodeA.outLinks && (this.nodeA.outLinks = []),
              this.nodeA && null == this.nodeA.inLinks && (this.nodeA.inLinks = []),
              this.nodeZ && null == this.nodeZ.inLinks && (this.nodeZ.inLinks = []),
              this.nodeZ && null == this.nodeZ.outLinks && (this.nodeZ.outLinks = []),
              null != this.nodeA && this.nodeA.outLinks.push(this),
              null != this.nodeZ && this.nodeZ.inLinks.push(this),
                this.caculateIndex(),
                this.font = "12px Consolas",
                this.fontColor = "43, 43, 43",
                this.isShowLinkName = true,
                this.lineWidth = 2,
                this.lineJoin = "miter",
                this.transformAble = !1,
                this.bundleOffset = 20,
                this.bundleGap = 12,
                this.textOffsetX = 0,
                this.textOffsetY = 0,
                this.arrowsRadius = null,
                this.arrowsOffset = 0,
                this.dashedPattern = null,
                this.path = [];
              this.animateNodePath = null;
              // 线条类型
              this.linkType = null;
              // 线条上的动画节点
              this.animateNode = null;
              // 连接类型，null 为连接到中心点，toBorder 为连接到边缘
              this.linkConnectType = 'toBorder为连接到边缘';
              // 合并出线条，多条线条从节点出去，合并成一根线条
              this.mergeOutLink = true;
              // 二次折线的弧度半径
              this.flexionalRadius = null;
              this.openStartRadius = true;
              this.openEndRadius = true;

              const e = "text,font,fontColor,lineWidth,lineJoin".split(",");
              this.serializedProperties = this.serializedProperties.concat(e)
            }
          },
            this.caculateIndex = function () {
              const a = e(this.nodeA, this.nodeZ);
              a > 0 && (this.nodeIndex = a - 1)
            },
            this.initialize(b, c, g),
            this.removeHandler = function () {
              const a = this;
              this.nodeA && this.nodeA.outLinks && (this.nodeA.outLinks = this.nodeA.outLinks.filter(function (b) {
                return b !== a
              })),
              this.nodeZ && this.nodeZ.inLinks && (this.nodeZ.inLinks = this.nodeZ.inLinks.filter(function (b) {
                return b !== a
              }));
              var b = d(this);
              b.forEach(function (a, b) {
                a.nodeIndex = b
              })
            },
            this.getStartPosition = function (linksSum, subY, angle) {
              let a = {};
              const pi = Math.PI;
              switch (this.linkConnectType) {
                case 'toBorder':
                  //链接边框
                  a = h(this.nodeA, this.nodeZ),
                  null == a && (a = {
                    x: this.nodeA.cx,
                    y: this.nodeA.cy
                  });
                  break;
                default:
                  a = {
                    x: this.nodeA.cx,
                    y: this.nodeA.cy
                  };
              }
              ;

              //根据倾斜角,设置a.x和a.y
              if (angle < pi * 30 / 180) {
                a.y += (this.nodeIndex - (linksSum - 1) / 2) * subY;
              } else {
                a.x += (this.nodeIndex - (linksSum - 1) / 2) * this.bundleGap;
              }
              //到达一定角度
              return a
            },
            this.getEndPosition = function (linksSum, subY, angle) {
              let a;
              const pi = Math.PI;
              switch (this.linkConnectType) {
                case 'toBorder':
                  a = h(this.nodeZ, this.nodeA),
                  null == a && (a = {
                    x: this.nodeZ.cx,
                    y: this.nodeZ.cy
                  })
                  break;
                default:
                  null != this.arrowsRadius && (a = h(this.nodeZ, this.nodeA)),
                  null == a && (a = {
                    x: this.nodeZ.cx,
                    y: this.nodeZ.cy
                  });
              }
              if (angle < pi * 30 / 180) {
                a.y += (this.nodeIndex - (linksSum - 1) / 2) * subY;
              } else {
                a.x += (this.nodeIndex - (linksSum - 1) / 2) * this.bundleGap;
              }


              return a
            },
            this.getPath = function () {
              const d = e(this.nodeA, this.nodeZ);//d是连线数量
              const angle = Math.atan2(Math.abs(this.nodeZ.cy - this.nodeA.cy), Math.abs(this.nodeZ.cx - this.nodeA.cx));
              const subY = this.bundleGap / Math.cos(angle);
              const a = []
                , b = this.getStartPosition(d, subY, angle)
                , c = this.getEndPosition(d, subY, angle);
              if (this.nodeA === this.nodeZ)
                return [b, c];

              if (1 == d)
                return [b, c];
              const f = Math.atan2(c.y - b.y, c.x - b.x)
                , g = {
                  x: b.x + this.bundleOffset * Math.cos(f),
                  y: b.y + this.bundleOffset * Math.sin(f)
                }
                , h = {
                  x: c.x + this.bundleOffset * Math.cos(f - Math.PI),
                  y: c.y + this.bundleOffset * Math.sin(f - Math.PI)
                }
                , i = f - Math.PI / 2
                , j = f - Math.PI / 2
                , k = d * this.bundleGap / 2 - this.bundleGap / 2
                , l = this.bundleGap * this.nodeIndex  // nodeIndex线条序号
              ;let m = {
                x: g.x + l * Math.cos(i),
                y: g.y + l * Math.sin(i)
              }
                , n = {
                  x: h.x + l * Math.cos(j),
                  y: h.y + l * Math.sin(j)
                };

              return m = {
                x: m.x + k * Math.cos(i - Math.PI),
                y: m.y + k * Math.sin(i - Math.PI)
              },
                n = {
                  x: n.x + k * Math.cos(j - Math.PI),
                  y: n.y + k * Math.sin(j - Math.PI)
                },
                a.push({
                  x: b.x,
                  y: b.y
                }),
                // a.push({
                //     x: m.x,
                //     y: m.y
                // }),
                // a.push({
                //     x: n.x,
                //     y: n.y
                // }),
                a.push({
                  x: c.x,
                  y: c.y
                }),
                a
            },
            this.paintPath = function (a, b) {
              switch (this.linkType) {
                case 'flexional':
                  if (this.nodeA === this.nodeZ) return void this.paintLoop(a);
                  a.beginPath(), a.moveTo(b[0].x, b[0].y);
                  if (this.flexionalRadius != null) {
                    const b0 = b[0];
                    const b1 = b[1];
                    const b2 = b[2];
                    const b3 = b[3];

                    if (this.openStartRadius && this.openEndRadius) {
                      a.lineTo((b1.x + b0.x) / 2, (b1.y + b0.y) / 2);
                      a.arcTo(b1.x, b1.y, (b1.x + b2.x) / 2, (b1.y + b2.y) / 2, this.flexionalRadius);
                      a.lineTo((b1.x + b2.x) / 2, (b1.y + b2.y) / 2);
                      a.arcTo(b2.x, b2.y, (b3.x + b2.x) / 2, (b3.y + b2.y) / 2, this.flexionalRadius);
                      a.lineTo(b3.x, b3.y);
                    } else if (this.openStartRadius && !this.openEndRadius) {
                      a.lineTo((b1.x + b0.x) / 2, (b1.y + b0.y) / 2);
                      a.arcTo(b1.x, b1.y, (b1.x + b2.x) / 2, (b1.y + b2.y) / 2, this.flexionalRadius);
                      a.lineTo((b1.x + b2.x) / 2, (b1.y + b2.y) / 2);
                      a.lineTo(b2.x, b2.y);
                      a.lineTo(b3.x, b3.y);
                    } else if (!this.openStartRadius && this.openEndRadius) {
                      a.lineTo(b1.x, b1.y);
                      a.lineTo((b1.x + b2.x) / 2, (b1.y + b2.y) / 2);
                      a.arcTo(b2.x, b2.y, (b3.x + b2.x) / 2, (b3.y + b2.y) / 2, this.flexionalRadius);
                      a.lineTo(b3.x, b3.y);
                    } else {
                      for (var c = 1; c < b.length; c++) {
                        null == this.dashedPattern ?
                          a.lineTo(b[c].x, b[c].y)
                          :
                          a.JTopoDashedLineTo(b[c - 1].x, b[c - 1].y, b[c].x, b[c].y, this.dashedPattern);
                      }
                    }
                  } else {
                    for (var c = 1; c < b.length; c++) {
                      null == this.dashedPattern ?
                        a.lineTo(b[c].x, b[c].y)
                        :
                        a.JTopoDashedLineTo(b[c - 1].x, b[c - 1].y, b[c].x, b[c].y, this.dashedPattern);
                    }
                  }
                  if (a.stroke(),
                      a.closePath(),
                    null != this.arrowsRadius) {
                    var d = b[b.length - 2]
                      , e = b[b.length - 1];
                    this.paintArrow(a, d, e)
                  }
                  ;
                  break;
                case 'dArrow':
                  if (this.nodeA === this.nodeZ) return void this.paintLoop(a);
                  a.beginPath(), a.moveTo(b[0].x, b[0].y);
                  for (var c = 1; c < b.length; c++) {

                    null == this.dashedPattern ? (
                      (null == this.PointPathColor ? a.lineTo(b[c].x, b[c].y) : a.JtopoDrawPointPath(b[c - 1].x, b[c - 1].y, b[c].x, b[c].y, a.strokeStyle, this.PointPathColor))
                    ) : a.JTopoDashedLineTo(b[c - 1].x, b[c - 1].y, b[c].x, b[c].y, this.dashedPattern)
                  }
                  ;
                  if (a.stroke(), a.closePath(), null != this.arrowsRadius) {
                    var d = b[b.length - 2],
                      e = b[b.length - 1];
                    this.paintArrow(a, d, e);
                    this.paintArrow(a, e, d);//双箭头精髓
                  }
                  break;

                case 'flow':

                  if (this.nodeA === this.nodeZ) return void this.paintLoop(a);
                  a.beginPath(), a.moveTo(b[0].x, b[0].y);
                  for (var c = 1; c < b.length; c++) {
                    null == this.dashedPattern ?
                      ((null == this.PointPathColor ?
                        a.lineTo(b[c].x, b[c].y)
                        :
                        a.JtopoDrawPointPath(b[c - 1].x, b[c - 1].y, b[c].x, b[c].y, a.strokeStyle, this.PointPathColor)))
                      :
                      a.JTopoDashedLineTo(b[c - 1].x, b[c - 1].y, b[c].x, b[c].y, this.dashedPattern)
                  }
                  if (a.stroke(), a.closePath(), null != this.arrowsRadius) {
                    var d = b[b.length - 2],
                      e = b[b.length - 1];
                    this.paintArrow(a, d, e)
                  }
                  break;
                default:
                  if (this.nodeA === this.nodeZ) return void this.paintLoop(a);
                  a.beginPath(), a.moveTo(b[0].x, b[0].y);
                  for (var c = 1; c < b.length; c++)
                    null == this.dashedPattern ? a.lineTo(b[c].x, b[c].y) : a.JTopoDashedLineTo(b[c - 1].x, b[c - 1].y, b[c].x, b[c].y, this.dashedPattern);
                  if (a.stroke(),
                      a.closePath(),
                    null != this.arrowsRadius) {
                    var d = b[b.length - 2]
                      , e = b[b.length - 1];
                    this.paintArrow(a, d, e)
                  }
                  ;
              }
            },
            this.paintLoop = function (a) {
              a.beginPath();
              {
                var b = this.bundleGap * (this.nodeIndex + 1) / 2;
                Math.PI + Math.PI / 2
              }
              a.arc(this.nodeA.x, this.nodeA.y, b, Math.PI / 2, 2 * Math.PI),
                a.stroke(),
                a.closePath()
            },
            this.paintArrow = function (b, c, d) {
              const e = this.arrowsOffset
                , f = this.arrowsRadius / 2
                , g = c
                , h = d
              ;let i = Math.atan2(h.y - g.y, h.x - g.x)
              ;const j = JTopo.util.getDistance(g, h) - this.arrowsRadius
                , k = g.x + (j + e) * Math.cos(i)
                , l = g.y + (j + e) * Math.sin(i)
                , m = h.x + e * Math.cos(i)
                , n = h.y + e * Math.sin(i);
              i -= Math.PI / 2;
              const o = {
                x: k + f * Math.cos(i),
                y: l + f * Math.sin(i)
              }
                , p = {
                x: k + f * Math.cos(i - Math.PI),
                y: l + f * Math.sin(i - Math.PI)
              };
              b.beginPath(),
                b.fillStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
                b.moveTo(o.x, o.y),
                b.lineTo(m, n),
                b.lineTo(p.x, p.y),
                b.stroke(),
                b.closePath()
            },
            this.paint = function (a) {
              if (null != this.nodeA && null != !this.nodeZ) {
                const b = this.getPath(this.nodeIndex);
                this.path = b,
                  a.strokeStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
                  a.lineWidth = this.lineWidth,
                  this.paintPath(a, b),
                b && b.length > 0 && this.paintText(a, b)
              }
            };
          var i = -(Math.PI / 2 + Math.PI / 4);
          this.paintText = function (a, b) {
            let c = b[0]
              , d = b[b.length - 1];
            if (!this.isShowLinkName) {
              return;
            }

            if (4 == b.length && (c = b[1],
                d = b[2]),
              this.text && this.text.length > 0) {

              if (JTopo.flag.linkConfigure.textIsNearToNodeZ) {
                var e = (d.x + c.x) / 2
                  , f = (d.y + c.y) / 2;
                e = (d.x + e) / 2 + this.textOffsetX
                  , f = (d.y + f) / 2 + this.textOffsetY;
              } else {
                var e = (d.x + c.x) / 2 + this.textOffsetX
                  , f = (d.y + c.y) / 2 + this.textOffsetY;
              }
              a.save(),
                a.beginPath(),
                a.font = this.font;

              const g = a.measureText(this.text).width
                , h = a.measureText("田").width;

              if (a.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
                this.nodeA === this.nodeZ) {
                var j = this.bundleGap * (this.nodeIndex + 1) / 2
                  , e = this.nodeA.x + j * Math.cos(i)
                  , f = this.nodeA.y + j * Math.sin(i);
                a.fillText(this.text, e, f)
              } else {
                let kh = h / 2;
                if (JTopo.flag.linkConfigure.textIsTilt) {
                  //todo:倾斜算法还有点问题
                  a.translate(e - g / 2, f - h / 2);
                  const rotate = JTopo.util.getRotateAng(this.nodeA, this.nodeZ);
                  a.rotate(rotate);
                  a.translate(-(e - g / 2), -(f - h / 2));

                  const xkh = g / 2;
                  const r = Math.abs(180 * rotate / Math.PI);
                  if (r > 20) {
                    kh = rotate > 0 ? 5 : -5;
                  }
                  if (r > 40) {
                    kh = rotate > 0 ? 15 : -15;
                  }
                  if (r > 60) {
                    kh = rotate > 0 ? 20 : -20;
                  }
                  if (r > 80) {
                    kh = rotate > 0 ? 25 : -25;
                    //  xkh=rotate>0&&g;
                  }

                  a.fillText(this.text, e - xkh, f - kh);

                } else {
                  a.fillText(this.text, e - g / 2, f - kh);
                }


              }
              a.stroke(),
                a.closePath(),
                a.restore()
            }
          },
            this.paintSelected = function (a) {
              a.shadowBlur = 10,
                a.shadowColor = "rgba(0,0,0,1)",
                a.shadowOffsetX = 0,
                a.shadowOffsetY = 0
            },
            this.isInBound = function (b, c) {
              if (this.nodeA === this.nodeZ) {
                const d = this.bundleGap * (this.nodeIndex + 1) / 2
                  , e = JTopo.util.getDistance(this.nodeA, {
                  x: b,
                  y: c
                }) - d;
                return Math.abs(e) <= 3
              }
              for (var f = !1, g = 1; g < this.path.length; g++) {
                const h = this.path[g - 1]
                  , i = this.path[g];
                if (1 == JTopo.util.isPointInLine({
                    x: b,
                    y: c
                  }, h, i)) {
                  f = !0;
                  break
                }
              }
              return f
            }
        }

        function g(a, b, c) {
          this.initialize = function () {
            g.prototype.initialize.apply(this, arguments),
              this.direction = "horizontal"
          },
            this.initialize(a, b, c),
            this.getStartPosition = function () {
              const a = {
                x: this.nodeA.cx,
                y: this.nodeA.cy
              };
              return "horizontal" == this.direction ? this.nodeZ.cx > a.x ? a.x += this.nodeA.width / 2 : a.x -= this.nodeA.width / 2 : this.nodeZ.cy > a.y ? a.y += this.nodeA.height / 2 : a.y -= this.nodeA.height / 2,
                a
            },
            this.getEndPosition = function () {
              const a = {
                x: this.nodeZ.cx,
                y: this.nodeZ.cy
              };
              return "horizontal" == this.direction ?
                this.nodeA.cy < a.y ? a.y -= this.nodeZ.height / 2 : a.y += this.nodeZ.height / 2
                :
                a.x = this.nodeA.cx < a.x ? this.nodeZ.x : this.nodeZ.x + this.nodeZ.width, a
            },
            this.getPath = function (a) {
              const b = []
                , c = this.getStartPosition()
                , d = this.getEndPosition();
              if (this.nodeA === this.nodeZ)
                return [c, d];
              let f, g;
              const h = e(this.nodeA, this.nodeZ), i = (h - 1) * this.bundleGap, j = this.bundleGap * a - i / 2;
              return "horizontal" == this.direction ? (f = d.x + j,
                g = c.y - j,
                b.push({
                  x: c.x,
                  y: g
                }),
                b.push({
                  x: f,
                  y: g
                }),
                b.push({
                  x: f,
                  y: d.y
                })) : (f = c.x + j,
                g = d.y - j,
                b.push({
                  x: f,
                  y: c.y
                }),
                b.push({
                  x: f,
                  y: g
                }),
                b.push({
                  x: d.x,
                  y: g
                })),
                b
            },
            this.paintText = function (a, b) {
              if (this.text && this.text.length > 0) {
                const c = b[1]
                  , d = c.x + this.textOffsetX
                  , e = c.y + this.textOffsetY;
                a.save(),
                  a.beginPath(),
                  a.font = this.font;
                const f = a.measureText(this.text).width
                  , g = a.measureText("田").width;
                a.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
                  a.fillText(this.text, d - f / 2, e - g / 2),
                  a.stroke(),
                  a.closePath(),
                  a.restore()
              }
            }
        }

        function h(a, b, c) {
          this.initialize = function () {
            h.prototype.initialize.apply(this, arguments),
              this.direction = "vertical",
              this.offsetGap = 44
          },
            this.initialize(a, b, c),
            this.getStartPosition = function () {
              const a = {
                x: this.nodeA.cx,
                y: this.nodeA.cy
              };
              return "horizontal" == this.direction ?
                a.x = this.nodeZ.cx < a.x ? this.nodeA.x : this.nodeA.x + this.nodeA.width
                :
                a.y = this.nodeZ.cy < a.y ? this.nodeA.y : this.nodeA.y + this.nodeA.height
                ,
                a
            },
            this.getEndPosition = function () {
              const a = {
                x: this.nodeZ.cx,
                y: this.nodeZ.cy
              };
              return "horizontal" == this.direction ? a.x = this.nodeA.cx < a.x ? this.nodeZ.x : this.nodeZ.x + this.nodeZ.width : a.y = this.nodeA.cy < a.y ? this.nodeZ.y : this.nodeZ.y + this.nodeZ.height,
                a
            },
            this.getPath = function (a) {
              const b = this.getStartPosition()
                , c = this.getEndPosition();
              if (this.nodeA === this.nodeZ)
                return [b, c];
              const d = [];
              const f = e(this.nodeA, this.nodeZ);//连线个数
              const g = (f - 1) * this.bundleGap;//所占宽度
              const h = this.bundleGap * a - g / 2;//h具体分配坐标,a为线序号
              let outH = h;//出线的相对坐标
              this.mergeOutLink && (outH = 0);//如果合并,则出线的相对坐标为0
              let i = this.offsetGap;
              return "horizontal" == this.direction ? (this.nodeA.cx > this.nodeZ.cx && (i = -i),
                  d.push({
                    x: b.x,
                    y: b.y + outH
                  }),
                  d.push({
                    x: b.x + i,
                    y: b.y + outH
                  }),
                  d.push({
                    x: c.x - i,
                    y: c.y + h
                  }),
                  d.push({
                    x: c.x,
                    y: c.y + h
                  }))
                :
                (
                  this.nodeA.cy > this.nodeZ.cy && (i = -i),
                    d.push({
                      x: b.x + outH,
                      y: b.y
                    }),
                    d.push({
                      x: b.x + outH,
                      y: b.y + i
                    }),
                    d.push({
                      x: c.x + h,
                      y: c.y - i
                    }),
                    d.push({
                      x: c.x + h,
                      y: c.y
                    })),
                d
            }
        }

        function i(a, b, c) {
          this.initialize = function () {
            i.prototype.initialize.apply(this, arguments)
          },
            this.initialize(a, b, c),
            this.paintPath = function (a, b) {
              if (this.nodeA === this.nodeZ)
                return void this.paintLoop(a);
              a.beginPath(),
                a.moveTo(b[0].x, b[0].y);
              for (let c = 1; c < b.length; c++) {
                const d = b[c - 1]
                  , e = b[c]
                  , f = (d.x + e.x) / 2
                ;let g = (d.y + e.y) / 2;
                g += (e.y - d.y) / 2,
                  a.strokeStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
                  a.lineWidth = this.lineWidth,
                  a.moveTo(d.x, d.cy),
                  a.quadraticCurveTo(f, g, e.x, e.y),
                  a.stroke()
              }
              if (a.stroke(),
                  a.closePath(),
                null != this.arrowsRadius) {
                const h = b[b.length - 2]
                  , i = b[b.length - 1];
                this.paintArrow(a, h, i)
              }
            }
        }

        /**
         * 在线条上绘制动画图片
         *
         * @param {String} imgurl - 图片地址
         * @param {Object} scene - 当前场景实例
         * @param {Number} rate - 计时器周期
         * @param {Number} speed - 距离
         * @param {Number} width - 节点宽度
         * @param {Number} height - 节点高度
         * @param {Number} row - 行
         * @param {Number} col - 列
         * @param {Number} time - 时间间隔
         * @param {Number} offsetRow - 行偏移量
         * @return {Object} - 图片节点
         */
        function drawanimepic(imgurl, scene, rate, speed, width, height, row, col, time, offsetRow) {
          const w = width || 16
          const h = height || 16
          const thislink = this

          /**
           * 创建动画节点
           *
           * 参数：图片地址，1 行，4 列，1000 毫秒播放一轮，行偏移量
           * 返回：动画节点实例
           */
          const imgnode = new JTopo.AnimateNode(imgurl, row, col, time, offsetRow)

          // 节点宽高
          imgnode.setSize(w, h)
          // 节点显示级别
          imgnode.zIndex = 2.5
          // 节点是否需要保存
          imgnode.isNeedSave = false
          // 节点是否重复播放
          imgnode.repeatPlay = true

          // 节点元素类型
          imgnode.elementType = 'linkAnimateNode'
          // 节点是否可拖拽
          imgnode.dragable = false
          // 节点是否被选中
          imgnode.selected = false

          imgnode.paintMouseover = function () {}
          // 节点绑定鼠标松开事件
          imgnode.addEventListener('mouseup', function (e) {
            imgnode.selected = false
          })
          // 节点开始播放
          imgnode.play()
          // 节点是否可见
          imgnode.visible = true

          // 如果存在动画节点
          if (thislink.animateNode) {
            // 清除计时器
            clearInterval(thislink.animateT)
            // 移除动画节点
            JTopo.flag.curScene.remove(thislink.animateNode)
            // 删除动画节点指向
            delete thislink.animateNode
          }

          // 设置动画节点的值为 imgnode
          thislink.animateNode = imgnode

          // 动画次数
          let timeT = 0

          // 清空定时器
          thislink.animateT = null
          // 是否结束动画
          thislink.endAnimate = false
          // 动画回调
          thislink.animateCallback = null

          // 当前路径索引
          let currentPathIndex = 0
          // 计时器周期
          const _rate = rate || 200
          // 距离
          const _speed = speed || 10
          // 是否已移除
          this.isremove = false

          // 返回起始与终止节点中进线和出线相等的线条
          function b(nodeA, nodeZ) {
            const equalLinksArr = []

            if (null == nodeA || null == nodeZ) {
              return equalLinksArr
            }

            if (nodeA && nodeZ && nodeA.outLinks && nodeZ.inLinks) {
              for (let i = 0; i < nodeA.outLinks.length; i++) {

                const nodeAoutLink = nodeA.outLinks[i]
                let j = 0

                for (; j < nodeZ.inLinks.length; j++) {
                  const nodeZinLink = nodeZ.inLinks[j]

                  nodeAoutLink === nodeZinLink && equalLinksArr.push(nodeZinLink)
                }
              }
            }

            return equalLinksArr
          }

          // 返回起始与终止节点（或终止节点与起始节点）中进线和出线相等的所有线条
          function c(nodeA, nodeZ) {
            const aToZequalLinksArr = b(nodeA, nodeZ)
            const zToAequalLinksArr = b(nodeZ, nodeA)
            const allEqualLinksArr = aToZequalLinksArr.concat(zToAequalLinksArr)

            return allEqualLinksArr
          }

          // 返回与当前连线对象不等的所有相等连线（出线与入线相等）
          function d(thislink) {
            let allEqualLinksArr = c(thislink.nodeA, thislink.nodeZ)

            return allEqualLinksArr = allEqualLinksArr.filter(function (equalLink) {
              return thislink !== equalLink
            })
          }

          // 移除处理器
          thislink.removeHandler = function () {
            this.isremove = true

            const thisLink = this

            this.nodeA
            && this.nodeA.outLinks
            && (this.nodeA.outLinks = this.nodeA.outLinks.filter(function (outLink) {
              return outLink !== thisLink
            })),

            this.nodeZ
            && this.nodeZ.inLinks
            && (this.nodeZ.inLinks = this.nodeZ.inLinks.filter(function (inLink) {
              return inLink !== thisLink
            }));

            // 返回与当前连线对象不等的所有相等连线（出线与入线相等）
            var allEqualLinksArr = d(this)

            allEqualLinksArr.forEach(function (equalLink, index) {
              // 为出线与入线相等的连线设置节点索引
              equalLink.nodeIndex = index
            })
          }

          // 图片节点动画函数：图片在连线上的运动
          function imgnodeanime() {
            // 如果未移除
            if (!thislink.isremove) {
              if (thislink.nodeA.outLinks) {
                // 如果存在动画节点路径 且 动画节点路径数组的长度大于 0
                if (thislink.animateNodePath && thislink.animateNodePath.length > 0) {
                  // 将动画节点路径赋值给路径
                  thislink.path = thislink.animateNodePath
                }

                // 设置起始节点为当前路径索引对应的元素值
                const nodeA = thislink.path[currentPathIndex]
                // 设置终止节点为当前路径索引 + 1 后对应的元素值
                const nodeZ = thislink.path[currentPathIndex + 1]

                // 如果需要跳过当前终止节点
                if (nodeZ.jump) {
                  ++currentPathIndex
                  imgnodeanime()
                  debugger
                  return
                }

                let L
                // 横向微调
                let subX
                // 纵向微调
                let subY
                // sin(a) or cos(a)
                let xl
                // sin(a) or cos(a)
                let yl
                // 起始节点和终止节点的横坐标差值
                const xs = nodeA.x - nodeZ.x
                // 起始节点和终止节点的纵坐标差值
                const xy = nodeA.y - nodeZ.y
                // 起始节点到终止节点的长度
                const l = Math.floor(Math.sqrt(xs * xs + xy * xy))

                ++timeT

                if (thislink.path.length == 2) {
                  L = l
                  xl = xs / L
                  yl = xy / L
                  subX = 0
                  subY = 0
                } else {
                  if (currentPathIndex == 0) {
                    // 起点
                    L = l
                    xl = xs / L
                    yl = xy / L
                    subX = 0
                    subY = 0
                  }
                  else if (currentPathIndex == thislink.path.length - 2) {
                    // 末点
                    L = l
                    xl = xs / L
                    yl = xy / L
                    subX = 0
                    subY = 0
                  }
                  else {
                    // 中间
                    L = l
                    xl = xs / L
                    yl = xy / L
                    subX = 0
                    subY = 0
                  }
                }

                // 动画在横轴移动的总长度
                const lenX = timeT * xl * _speed
                // 动画在纵轴移动的总长度
                const lenY = timeT * yl * _speed

                // 节点旋转弧度 todo: 算法有问题 ？？
                imgnode.rotate = (Math.atan(xy / xs)) + (xs > 0 ? Math.PI : 0)

                imgnode.cx = nodeA.x - lenX - subX
                imgnode.cy = nodeA.y - lenY - subY

                if (L <= Math.floor(Math.sqrt(lenX * lenX + lenY * lenY))) {
                  timeT = 0
                  ++currentPathIndex

                  if (currentPathIndex == thislink.path.length - 1) {
                    currentPathIndex = 0
                    thislink.endAnimate = false
                    thislink.endCallback && thislink.endCallback()
                  }
                  imgnode.cx = thislink.path[currentPathIndex].x
                  imgnode.cy = thislink.path[currentPathIndex].y
                }
              }
            } else {
              // 清除动画计时器
              clearInterval(thislink.animateT)
              // 移除动画节点
              scene.remove(imgnode)
            }
          }

          // 设置定时器
          thislink.animateT = setInterval(function () {
            // 执行图片节点动画函数：图片在连线上的运动
            imgnodeanime()
            // 如果需要清除所有动画
            if (JTopo.flag.clearAllAnimateT) {
              // 清除动画计时器
              clearInterval(thislink.animateT)
            }
          }, _rate)

          // 将图片节点添加到场景中
          scene.add(imgnode)
          // 返回图片节点
          return imgnode
        }
        f.prototype = new JTopo.InteractiveElement,
          // 连线构造函数原型上绑定函数：在线条上绘制动画图片
          f.prototype.drawanimepic = drawanimepic;
        g.prototype = new f,
          h.prototype = new f,
          i.prototype = new f,
          JTopo.Link = f,
          // 1次折线
          JTopo.FoldLink = g,
          // 2次折线
          JTopo.FlexionalLink = h,
          // 曲线
          JTopo.CurveLink = i
      }(JTopo),

      // container 的具体实现 ,container不能使用layout布局,如果要用,需要自己实现
      function (d) {
        function c(a) {
          this.initialize = function (b) {
            c.prototype.initialize.apply(this, null),
              this.elementType = "container",
              this.zIndex = d.zIndex_Container,
              // 容器宽度
              this.width = 100,
              this.containerPadding = 0,
              // 容器高度
              this.height = 100,
              this.childs = [],
              // 透明度
              this.alpha = 0,
              // 是否可以拖动
              this.dragable = !0,
              this.childDragble = !0,
              this.visible = !0,
              this.fillColor = "79,164,218",
              this.borderBgFillColor = null,//背景颜色
              this.borderBgAlpha = 0.3,
              this.borderTextBg = "rgba(108,208,226,1)",
              this.borderWidth = 1,
              this.shadowBlur = 5,
              this.shadowColor = "rgba(43,43,43,0.5)",
              this.shadowOffsetX = 0,
              this.shadowOffsetY = 0,
              this.borderColor = "108,208,226",
              this.borderRadius = 5,
              this.borderDashed = false,
              this.borderAlpha = 1,
              this.borderPadding = 15,
              this.topPadding = 60,//顶部间距
              this.font = "16px 微软雅黑",
              this.fontColor = "255,255,255",
              // 名称（文本），不会显示
              this.text = b,
              this.textAlpha = 1,
              this.textPosition = "Top_Bottom",
              this.textOffsetX = 0,
              this.textOffsetY = 11 ,
              this.textPositionMsg = {
                x: null,
                y: null,
                width: null,
                height: null
              };
            this.layout = new d.layout.AutoBoundLayout
          },
            this.initialize(a),
            this.add = function (b) {
              this.childs.push(b),
                b.dragable = this.childDragble;
              if (!b.parentContainer) {
                b.parentContainer = []
              }
              ;
              b.parentContainer.push(this);
            },
            this.remove = function (f) {
              for (let e = 0; e < this.childs.length; e++) {
                if (this.childs[e] === f) {
                  f.parentContainer = null,
                    this.childs = this.childs.del(e),
                    f.lastParentContainer = this;
                  break;
                }
              }
            }
            ,
            this.removeAll = function () {
              this.childs = []
            }
            ,
            this.setLocation = function (h, g) {
              const l = h - this.x
                , k = g - this.y;
              this.x = h,
                this.y = g;
              for (let j = 0; j < this.childs.length; j++) {
                const i = this.childs[j];
                i.setLocation(i.x + l, i.y + k)
              }
            }
            ,
            this.doLayout = function (b) {
              b && b(this, this.childs)
            }
            ,
            this.paint = function (b) {
              this.visible && (this.layout && this.layout(this, this.childs),
                b.beginPath(),
                b.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")",
                null == this.borderRadius || 0 == this.borderRadius ? b.rect(this.x, this.y, this.width, this.height) : b.JTopoRoundRect(this.x, this.y, this.width, this.height, this.borderRadius),
                b.fill(),
                b.closePath(),
                this.paintBorder(b)),
                this.paintText(b);    //先绘制边框,再绘制文字

              if (this.childs.length == 0) {
                JTopo.flag.scene.remove(this);
              }
            },
            this.paintBorder = function (a) {
              if (0 != this.borderWidth) {
                //获取容器内部所有的子元素
                const textHeight = a.measureText("田").width;//所有一行文字的高度
                const thisObj = this;
                const compareObj = {
                  left: null,
                  right: null,
                  top: null,
                  bottom: null
                };
                thisObj.childs.forEach(function (p) {
                  let textWidth = a.measureText(p.text || '').width;

                  const pObj = p.getTextPostion(p.textPosition, textWidth, textHeight);//获取文字的相对位置
                  //获取文字左下角的位置，注意不是左上角
                  pObj.x += p.x + p.width / 2;
                  pObj.y += p.y + p.height / 2;

                  //获取文字+节点整体的边界
                  if (p.width > textWidth) {
                    pObj.x = p.x;
                    textWidth = p.width;
                  }

                  if (compareObj.left === null || compareObj.left > pObj.x) {
                    compareObj.left = pObj.x
                  }
                  ;
                  if (compareObj.right === null || compareObj.right < pObj.x + textWidth) {
                    compareObj.right = pObj.x + textWidth
                  }
                  ;
                  if (compareObj.top === null || compareObj.top > pObj.y - textHeight) {
                    compareObj.top = pObj.y - textHeight

                  }
                  ;
                  if (compareObj.bottom === null || compareObj.bottom < pObj.y) {
                    compareObj.bottom = pObj.y
                  }
                  ;
                });
                sugar(thisObj, compareObj);

                function sugar(thisObj, compareObj) {
                  const leftW = thisObj.x - compareObj.left;
                  const rightW = thisObj.x + thisObj.width - compareObj.right;
                  const topH = thisObj.y - compareObj.top;
                  const bottomH = thisObj.y + textHeight - compareObj.bottom;
                  if (leftW > 0) {
                    thisObj.x = compareObj.left;
                    thisObj.width += leftW;
                  }
                  if (rightW < 0) {
                    thisObj.width = compareObj.right - thisObj.x;
                  }
                  if (topH > 0) {
                    thisObj.y = compareObj.top;
                    thisObj.height += topH;
                  }
                  if (bottomH < 0) {
                    thisObj.height = compareObj.bottom - thisObj.y;
                  }

                  const len = thisObj.borderPadding;
                  thisObj.x -= len * 2;
                  thisObj.y -= thisObj.topPadding;
                  thisObj.width += len * 4;
                  thisObj.height += len * 5;
                  //跟title比较宽度
                  const titleWidth = a.measureText(thisObj.text || '').width + 60;
                  const subWidth = titleWidth - thisObj.width;
                  if (subWidth > 0) {
                    thisObj.x -= subWidth / 2 + len;
                    thisObj.width = titleWidth + 2 * len;
                  }
                }

                const pp = this.containerPadding;
                a.beginPath(),
                  a.lineWidth = this.borderWidth,
                  a.strokeStyle = "rgba(" + this.borderColor + "," + this.borderAlpha + ")";
                const b = this.borderWidth / 2;

                null == this.borderRadius || 0 == this.borderRadius
                  ?
                  a.rect(this.x - b - pp, this.y - b - pp, this.width + this.borderWidth + 2 * pp, this.height + this.borderWidth + 200)
                  :
                  a.JTopoRoundRect(this.x - b - pp, this.y - b - pp, this.width + this.borderWidth + 2 * pp, this.height + this.borderWidth + 200, this.borderRadius, this.borderDashed),
                  a.stroke();
                if (this.borderBgFillColor) {
                  a.fillStyle = "rgba(" + this.borderBgFillColor + "," + this.borderBgAlpha + ")";
                  a.fill();
                }
                a.closePath();
              }
            }
          this.paintText = function (g) {
            const f = this.text;
            if (null != f && "" != f) {
              g.beginPath(),
                g.font = this.font;
              const j = g.measureText(f || "").width
                , i = g.measureText("田").width;
              const h = this.getTextPostion(this.textPosition, j, i);
              h.y -= 0.8;
              g.fillStyle = this.borderTextBg;

              g.beginPath();
              g.moveTo(h.x - 20, h.y - i - 3);
              g.lineTo(h.x + j + 20, h.y - i - 3);
              g.lineTo(h.x + j + 10, h.y + 5);
              g.lineTo(h.x - 10, h.y + 5);
              g.fill();
              g.fillStyle = "rgba(" + this.fontColor + ", " + this.textAlpha + ")";
              g.fillText(f, h.x, h.y - 1),
                g.closePath();
              this.textPositionMsg = {
                x: h.x - 20,
                y: h.y - i - 3,
                width: j + 40,
                height: i + 8
              }
            }
          }
            ,
            this.getTextPostion = function (f, e, h) {
              let g = null;
              return null == f || "Bottom_Center" == f ? g = {
                x: this.x + this.width / 2 - e / 2,
                y: this.y + this.height + h
              } : "Bottom_Top" == f ? g = {
                x: this.x + this.width / 2 - e / 2,
                y: this.y + this.height + h
              } : "Top_Center" == f ? g = {
                x: this.x + this.width / 2 - e / 2,
                y: this.y - h / 2
              } : "Top_Bottom" == f ? g = {
                x: this.x + this.width / 2 - e / 2,
                y: this.y + h / 2
              } : "Top_Right" == f ? g = {
                x: this.x + this.width - e,
                y: this.y - h / 2
              } : "Top_Left" == f ? g = {
                x: this.x,
                y: this.y - h / 2
              } : "Bottom_Right" == f ? g = {
                x: this.x + this.width - e,
                y: this.y + this.height + h
              } : "Bottom_Left" == f ? g = {
                x: this.x,
                y: this.y + this.height + h
              } : "Middle_Center" == f ? g = {
                x: this.x + this.width / 2 - e / 2,
                y: this.y + this.height / 2 + h / 2
              } : "Middle_Right" == f ? g = {
                x: this.x + this.width - e,
                y: this.y + this.height / 2 + h / 2
              } : "Middle_Left" == f && (g = {
                x: this.x,
                y: this.y + this.height / 2 + h / 2
              }),
              null != this.textOffsetX && (g.x += this.textOffsetX),
              null != this.textOffsetY && (g.y += this.textOffsetY),
                g
            }
            ,
            this.paintMouseover = function () {
            }
            ,
            this.paintSelected = function (b) {
              b.shadowBlur = this.shadowBlur,
                b.shadowColor = this.shadowColor,
                b.shadowOffsetX = this.shadowOffsetX,
                b.shadowOffsetY = this.shadowOffsetY
            }
            ,
            this.removeHandler = function (f) {
              const e = this;
              this.outLinks && (this.outLinks.forEach(function (b) {
                b.nodeA === e && f.remove(b)
              }),
                this.outLinks = null),
              this.inLinks && (this.inLinks.forEach(function (b) {
                b.nodeZ === e && f.remove(b)
              }),
                this.inLinks = null)
            }
        }

        c.prototype = new d.InteractiveElement,
          d.Container = c
      }(JTopo),

      // containerNode 的具体实现
      function (a) {
        function b(c) {
          this.initialize = function (c) {
            b.prototype.initialize.apply(this, null),
              //定制化 by luozheao
              this.elementType = "containerNode",
              this.zIndex = a.zIndex_Container,
              this.width = 100,
              this.height = 100,
              this.childs = [],
              this.alpha = .5,
              this.dragable = !0,
              this.childDragble = !0,
              this.visible = !0,
              this.fillColor = "10,100,80",
              this.borderWidth = 0,
              this.shadowBlur = 10,
              this.shadowColor = "rgba(255,255,255,1)",
              this.shadowOffsetX = 0,
              this.shadowOffsetY = 0,
              this.borderColor = "255,255,255",
              this.borderRadius = null,
              this.font = "12px Consolas",
              this.fontColor = "255,255,255",
              this.text = c,
              this.textPosition = "Bottom_Center",
              this.textOffsetX = 0,
              this.textOffsetY = 0,
              this.layout = new a.layout.AutoBoundLayout
          },
            this.initialize(c),
            this.add = function (b) {
              this.childs.push(b),
                b.dragable = this.childDragble;
              if (!b.parentContainer) {
                b.parentContainer = []
              }
              ;
              b.parentContainer.push(this);
            },
            this.remove = function (a) {
              for (let b = 0; b < this.childs.length; b++)
                if (this.childs[b] === a) {
                  a.parentContainer = null,
                    this.childs = this.childs.del(b),
                    a.lastParentContainer = this;
                  break
                }
            },
            this.removeAll = function () {
              this.childs = []
            },
            this.setLocation = function (a, b) {

              const c = a - this.x
                , d = b - this.y;
              this.x = a,
                this.y = b;
              for (let e = 0; e < this.childs.length; e++) {
                const f = this.childs[e];

                f.setLocation(f.x + c, f.y + d) //相对位置


              }
            },

            this.doLayout = function (a) {
              a && a(this, this.childs)
            },


            this.paint = function (a) {

              this.visible && (this.layout && this.layout(this, this.childs),
                a.beginPath(),
                a.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")",
                null == this.borderRadius || 0 == this.borderRadius ? a.rect(this.x, this.y, this.width, this.height) : a.JTopoRoundRect(this.x, this.y, this.width, this.height, this.borderRadius),
                a.fill(),
                a.closePath(),
                this.paintText(a),
                this.paintBorder(a))
            },
            this.paintBorder = function (a) {
              if (0 != this.borderWidth) {
                a.beginPath(),
                  a.lineWidth = this.borderWidth,
                  a.strokeStyle = "rgba(" + this.borderColor + "," + this.alpha + ")";
                const b = this.borderWidth / 2;
                null == this.borderRadius || 0 == this.borderRadius ? a.rect(this.x - b, this.y - b, this.width + this.borderWidth, this.height + this.borderWidth) : a.JTopoRoundRect(this.x - b, this.y - b, this.width + this.borderWidth, this.height + this.borderWidth, this.borderRadius),
                  a.stroke(),
                  a.closePath()
              }
            },
            this.paintText = function (a) {
              const b = this.text;
              if (null != b && "" != b) {
                a.beginPath(),
                  a.font = this.font;
                const c = a.measureText(b).width
                  , d = a.measureText("田").width;
                a.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")";
                const e = this.getTextPostion(this.textPosition, c, d);
                a.fillText(b, e.x, e.y),
                  a.closePath()
              }
            },
            this.getTextPostion = function (a, b, c) {
              let d = null;


              return null == a || "Bottom_Center" == a ? d = {
                x: this.x + this.width / 2 - b / 2,
                y: this.y + this.height + c
              } : "Bottom_Top" == a ? d = {
                x: this.x + this.width / 2 - b / 2,
                y: this.y + this.height + c
              } : "Top_Center" == a ? d = {
                x: this.x + this.width / 2 - b / 2,
                y: this.y - c / 2
              } : "Top_Right" == a ? d = {
                x: this.x + this.width - b,
                y: this.y - c / 2
              } : "Top_Left" == a ? d = {
                x: this.x,
                y: this.y - c / 2
              } : "Bottom_Right" == a ? d = {
                x: this.x + this.width - b,
                y: this.y + this.height + c
              } : "Bottom_Left" == a ? d = {
                x: this.x,
                y: this.y + this.height + c
              } : "Middle_Center" == a ? d = {
                x: this.x + this.width / 2 - b / 2,
                y: this.y + this.height / 2 + c / 2
              } : "Middle_Right" == a ? d = {
                x: this.x + this.width - b,
                y: this.y + this.height / 2 + c / 2
              } : "Middle_Left" == a && (d = {
                x: this.x,
                y: this.y + this.height / 2 + c / 2
              }),
              null != this.textOffsetX && (d.x += this.textOffsetX),
              null != this.textOffsetY && (d.y += this.textOffsetY),
                d
            },
            this.paintMouseover = function () {

            },
            this.paintMouseout = function () {

            },
            this.paintSelected = function (a) {
              a.shadowBlur = this.shadowBlur,
                a.shadowColor = this.shadowColor,
                a.shadowOffsetX = this.shadowOffsetX,
                a.shadowOffsetY = this.shadowOffsetY
            },
            this.removeHandler = function (f) {
              const e = this;
              this.outLinks && (this.outLinks.forEach(function (b) {
                b.nodeA === e && f.remove(b)
              }),
                this.outLinks = null),
              this.inLinks && (this.inLinks.forEach(function (b) {
                b.nodeZ === e && f.remove(b)
              }),
                this.inLinks = null)
            }
        }

        b.prototype = new a.InteractiveElement,
          a.ContainerNode = b
      }(JTopo),

      // layout 的具体实现
      function (a) {
        function b(a) {
          let b = 0, c = 0;
          a.forEach(function (a) {
            b += a.cx,
              c += a.cy
          });
          const d = {
            x: b / a.length,
            y: c / a.length
          };
          return d
        }

        function c(c, d) {
          null == d && (d = {});
          {
            var e = d.cx
              , f = d.cy
              , g = d.minRadius
              , h = d.nodeDiameter
              , i = d.hScale || 1
              , j = d.vScale || 1;

            d.beginAngle || 0,
            d.endAngle || 2 * Math.PI
          }
          if (null == e || null == f) {
            const k = b(c);
            e = k.x,
              f = k.y
          }
          let l = 0;
          const m = [], n = [];
          c.forEach(function (a) {
            null == d.nodeDiameter ? (a.diameter && (h = a.diameter),
              h = a.radius ? 2 * a.radius : Math.sqrt(2 * a.width * a.height),
              n.push(h)) : n.push(h),
              l += h
          }),
            c.forEach(function (a, b) {
              const c = n[b] / l;
              m.push(Math.PI * c)
            });
          const o = (c.length,
          m[0] + m[1]), p = n[0] / 2 + n[1] / 2;
          let q = p / 2 / Math.sin(o / 2);
          null != g && g > q && (q = g);
          const r = q * i, s = q * j, t = d.animate;
          if (t) {
            var u = t.time || 1e3
              , v = 0;
            c.forEach(function (b, c) {
              v += 0 == c ? m[c] : m[c - 1] + m[c];
              const d = e + Math.cos(v) * r
                , g = f + Math.sin(v) * s;
              a.Animate.stepByStep(b, {
                x: d - b.width / 2,
                y: g - b.height / 2
              }, u).start()
            })
          } else {
            var v = 0;
            c.forEach(function (a, b) {
              v += 0 == b ? m[b] : m[b - 1] + m[b];
              const c = e + Math.cos(v) * r
                , d = f + Math.sin(v) * s;
              a.cx = c,
                a.cy = d
            })
          }
          return {
            cx: e,
            cy: f,
            radius: r,
            radiusA: r,
            radiusB: s
          }
        }

        function d(a, b) {
          return function (c) {
            const d = c.childs;
            if (!(d.length <= 0)) {
              const e = c.getBound(),
                f = d[0],
                g = (e.width - f.width) / b,
                h = (e.height - f.height) / a,
                i = (d.length, 0);
              let j = 0;
              for (; a > j; j++) {
                for (let k = 0; b > k; k++) {
                  const l = d[i++]
                    , m = e.left + g / 2 + k * g
                    , n = e.top + h / 2 + j * h;
                  if (l.setLocation(m, n),
                    i >= d.length)
                    return
                }
              }
            }
          }
        }

        function e(a, b) {
          return null == a && (a = 0),
          null == b && (b = 0),
            function (c) {
              const d = c.childs;
              if (!(d.length <= 0)) {
                const e = c.getBound();
                let f = e.left, g = e.top, h = 0;
                for (; h < d.length; h++) {
                  const i = d[h];
                  f + i.width >= e.right && (f = e.left,
                    g += b + i.height),
                    i.setLocation(f + a / 2, g + b / 2),
                    f += a + i.width
                }
              }
            }
        }

        function f() {
          return function (a, b) {
            if (b.length > 0) {
              for (var c = 1e7, d = -1e7, e = 1e7, f = -1e7, g = d - c, h = f - e, i = 0; i < b.length; i++) {
                const j = b[i];
                j.x <= c && (c = j.x),
                j.x >= d && (d = j.x),
                j.y <= e && (e = j.y),
                j.y >= f && (f = j.y),
                  g = d - c + j.width,
                  h = f - e + j.height
              }
              a.x = c,
                a.y = e,
                a.width = g,
                a.height = h
            }
          }
        }

        function g(b) {
          const c = [], d = b.filter(function (b) {
            return b instanceof a.Link ? !0 : (c.push(b),
              !1)
          });
          return b = c.filter(function (a) {
            for (let b = 0; b < d.length; b++)
              if (d[b].nodeZ === a)
                return !1;
            return !0
          }),
            b = b.filter(function (a) {
              for (let b = 0; b < d.length; b++)
                if (d[b].nodeA === a)
                  return !0;
              return !1
            })
        }

        function h(a) {
          let b = 0, c = 0;
          return a.forEach(function (a) {
            b += a.width,
              c += a.height
          }),
            {
              width: b / a.length,
              height: c / a.length
            }
        }

        function i(a, b, c, d) {
          b.x += c,
            b.y += d;
          const e = q(a, b);
          let f = 0;
          for (; f < e.length; f++)
            i(a, e[f], c, d)
        }

        function j(a, b) {
          function c(b, e) {
            const f = q(a, b);
            null == d[e] && (d[e] = {},
              d[e].nodes = [],
              d[e].childs = []),
              d[e].nodes.push(b),
              d[e].childs.push(f);
            for (let g = 0; g < f.length; g++)
              c(f[g], e + 1),
                f[g].parent = b
          }

          var d = [];
          return c(b, 0),
            d
        }

        function k(b, c, d) {
          return function (e) {
            function f(f, g) {
              for (var h = a.layout.getTreeDeep(f, g), k = j(f, g), l = k["" + h].nodes, m = 0; m < l.length; m++) {
                const n = l[m]
                ;let o = (m + 1) * (c + 10)
                  , p = h * d;
                "down" == b || ("up" == b ? p = -p : "left" == b ? (o = -h * d,
                  p = (m + 1) * (c + 10)) : "right" == b && (o = h * d,
                  p = (m + 1) * (c + 10))),
                  n.setLocation(o, p)
              }
              for (let q = h - 1; q >= 0; q--)
                for (var r = k["" + q].nodes, s = k["" + q].childs, m = 0; m < r.length; m++) {
                  const t = r[m]
                    , u = s[m];
                  if ("down" == b ? t.y = q * d : "up" == b ? t.y = -q * d : "left" == b ? t.x = -q * d : "right" == b && (t.x = q * d),
                      u.length > 0 ? "down" == b || "up" == b ? t.x = (u[0].x + u[u.length - 1].x) / 2 : ("left" == b || "right" == b) && (t.y = (u[0].y + u[u.length - 1].y) / 2) : m > 0 && ("down" == b || "up" == b ? t.x = r[m - 1].x + r[m - 1].width + c : ("left" == b || "right" == b) && (t.y = r[m - 1].y + r[m - 1].height + c)),
                    m > 0)
                    if ("down" == b || "up" == b) {
                      if (t.x < r[m - 1].x + r[m - 1].width)
                        for (var v = r[m - 1].x + r[m - 1].width + c, w = Math.abs(v - t.x), x = m; x < r.length; x++)
                          i(e.childs, r[x], w, 0)
                    } else if (("left" == b || "right" == b) && t.y < r[m - 1].y + r[m - 1].height)
                      for (var y = r[m - 1].y + r[m - 1].height + c, z = Math.abs(y - t.y), x = m; x < r.length; x++)
                        i(e.childs, r[x], 0, z)
                }
            }

            var g = null;
            null == c && (g = h(e.childs),
              c = g.width,
            ("left" == b || "right" == b) && (c = g.width + 10)),
            null == d && (null == g && (g = h(e.childs)),
              d = 2 * g.height),
            null == b && (b = "down");
            var k = a.layout.getRootNodes(e.childs);
            if (k.length > 0) {
              f(e.childs, k[0]);

              var l = JTopo.util.getElementsBound(e.childs)
                , m = e.getCenterLocation()
                , n = m.x - (l.left + l.right) / 2
                , o = m.y - (l.top + l.bottom) / 2;
              e.childs.forEach(function (b) {
                b instanceof a.Node && (b.x += n,
                  b.y += o)
              })
            }
          }
        }

        function l(b) {
          return function (c) {
            function d(a, c, e) {
              const f = q(a, c);
              if (0 != f.length) {
                null == e && (e = b);
                const g = 2 * Math.PI / f.length;
                f.forEach(function (b, f) {
                  const h = c.x + e * Math.cos(g * f)
                    , i = c.y + e * Math.sin(g * f);
                  b.setLocation(h, i);
                  const j = e / 2;
                  d(a, b, j)
                })
              }
            }

            var e = a.layout.getRootNodes(c.childs);
            if (e.length > 0) {
              d(c.childs, e[0]);
              var f = JTopo.util.getElementsBound(c.childs)
                , g = c.getCenterLocation()
                , h = g.x - (f.left + f.right) / 2
                , i = g.y - (f.top + f.bottom) / 2;
              c.childs.forEach(function (b) {
                b instanceof a.Node && (b.x += h,
                  b.y += i)
              })
            }
          }
        }

        function m(a, b, c, d, e, f) {
          for (var g = [], h = 0; c > h; h++)
            for (let i = 0; d > i; i++)
              g.push({
                x: a + i * e,
                y: b + h * f
              });
          return g
        }

        function n(a, b, c, d, e, f) {
          let g = e ? e : 0;
          const h = f ? f : 2 * Math.PI, i = h - g, j = i / c, k = [];
          g += j / 2;
          for (let l = g; h >= l; l += j) {
            const m = a + Math.cos(l) * d
              , n = b + Math.sin(l) * d;
            k.push({
              x: m,
              y: n
            })
          }
          return k
        }

        function o(a, b, c, d, e, f) {
          const g = f || "bottom", h = [];
          if ("bottom" == g)
            for (var i = a - c / 2 * d + d / 2, j = 0; c >= j; j++)
              h.push({
                x: i + j * d,
                y: b + e
              });
          else if ("top" == g)
            for (var i = a - c / 2 * d + d / 2, j = 0; c >= j; j++)
              h.push({
                x: i + j * d,
                y: b - e
              });
          else if ("right" == g)
            for (var i = b - c / 2 * d + d / 2, j = 0; c >= j; j++)
              h.push({
                x: a + e,
                y: i + j * d
              });
          else if ("left" == g)
            for (var i = b - c / 2 * d + d / 2, j = 0; c >= j; j++)
              h.push({
                x: a - e,
                y: i + j * d
              });
          return h
        }

        function m(a, b, c, d, e, f) {
          for (var g = [], h = 0; c > h; h++)
            for (let i = 0; d > i; i++)
              g.push({
                x: a + i * e,
                y: b + h * f
              });
          return g
        }

        function p(a, b) {
          if (a.layout) {
            const c = a.layout
              , d = c.type
            ;let e = null;
            if ("circle" == d) {
              const f = c.radius || Math.max(a.width, a.height);
              e = n(a.cx, a.cy, b.length, f, a.layout.beginAngle, a.layout.endAngle)
            } else if ("tree" == d) {
              const g = c.width || 50
                , h = c.height || 50
                , i = c.direction;
              e = o(a.cx, a.cy, b.length, g, h, i)
            } else {
              if ("grid" != d)
                return;
              e = m(a.x, a.y, c.rows, c.cols, c.horizontal || 0, c.vertical || 0)
            }
            for (let j = 0; j < b.length; j++)
              b[j].setCenterLocation(e[j].x, e[j].y)
          }
        }

        function q(b, c) {
          for (var d = [], e = 0; e < b.length; e++)
            b[e] instanceof a.Link && b[e].nodeA === c && d.push(b[e].nodeZ);
          return d
        }

        function r(a, b, c) {
          const d = q(a.childs, b);
          if (0 == d.length)
            return null;
          if (p(b, d),
            1 == c)
            for (let e = 0; e < d.length; e++)
              r(a, d[e], c);
          return null
        }

        function s(b, c) {
          function d(a, b) {
            const c = a.x - b.x
              , d = a.y - b.y;
            i += c * f,
              j += d * f,
              i *= g,
              j *= g,
              j += h,
              b.x += i,
              b.y += j
          }

          function e() {
            if (!(++k > 150)) {
              for (let a = 0; a < l.length; a++)
                l[a] != b && d(b, l[a], l);
              setTimeout(e, 1e3 / 24)
            }
          }

          var f = .01, g = .95, h = -5, i = 0, j = 0, k = 0, l = c.getElementsByClass(a.Node);
          e()
        }

        function t(a, b) {
          function c(a, b, e) {
            const f = q(a, b);
            e > d && (d = e);
            for (let g = 0; g < f.length; g++)
              c(a, f[g], e + 1)
          }

          var d = 0;
          return c(a, b, 0),
            d
        }

        JTopo.layout = JTopo.Layout = {
          layoutNode: r,
          getNodeChilds: q,
          adjustPosition: p,
          springLayout: s,
          getTreeDeep: t,
          getRootNodes: g,
          GridLayout: d,
          FlowLayout: e,
          AutoBoundLayout: f,
          CircleLayout: l,
          TreeLayout: k,
          getNodesCenter: b,
          circleLayoutNodes: c
        }
      }(JTopo),

      // circleNode 的具体实现
      function (a) {
        function b() {
          const b = new a.CircleNode;
          return b.radius = 150,
            b.colors = ["#3666B0", "#2CA8E0", "#77D1F6"],
            b.datas = [.3, .3, .4],
            b.titles = ["A", "B", "C"],
            b.paint = function (a) {
              const c = 2 * b.radius
                , d = 2 * b.radius;
              b.width = c,
                b.height = d;
              let e = 0, f = 0;
              for (; f < this.datas.length; f++) {
                const g = this.datas[f] * Math.PI * 2;
                a.save(),
                  a.beginPath(),
                  a.fillStyle = b.colors[f],
                  a.moveTo(0, 0),
                  a.arc(0, 0, this.radius, e, e + g, !1),
                  a.fill(),
                  a.closePath(),
                  a.restore(),
                  a.beginPath(),
                  a.font = this.font;
                const h = this.titles[f] + ": " + (100 * this.datas[f]).toFixed(2) + "%"
                  , i = a.measureText(h).width
                  , j = (a.measureText("田").width,
                  (e + e + g) / 2)
                ;let k = this.radius * Math.cos(j)
                ;const l = this.radius * Math.sin(j);
                j > Math.PI / 2 && j <= Math.PI ? k -= i : j > Math.PI && j < 2 * Math.PI * 3 / 4 ? k -= i : j > 2 * Math.PI * .75,
                  a.fillStyle = "#FFFFFF",
                  a.fillText(h, k, l),
                  a.moveTo(this.radius * Math.cos(j), this.radius * Math.sin(j)),
                j > Math.PI / 2 && j < 2 * Math.PI * 3 / 4 && (k -= i),
                j > Math.PI,
                  a.fill(),
                  a.stroke(),
                  a.closePath(),
                  e += g
              }
            },
            b
        }

        function c() {
          const b = new a.Node;
          return b.showSelected = !1,
            b.width = 250,
            b.height = 180,
            b.colors = ["#3666B0", "#2CA8E0", "#77D1F6"],
            b.datas = [.3, .3, .4],
            b.titles = ["A", "B", "C"],
            b.paint = function (a) {
              const c = 3
                , d = (this.width - c) / this.datas.length;
              a.save(),
                a.beginPath(),
                a.fillStyle = "#FFFFFF",
                a.strokeStyle = "#FFFFFF",
                a.moveTo(-this.width / 2 - 1, -this.height / 2),
                a.lineTo(-this.width / 2 - 1, this.height / 2 + 3),
                a.lineTo(this.width / 2 + c + 1, this.height / 2 + 3),
                a.stroke(),
                a.closePath(),
                a.restore();
              for (let e = 0; e < this.datas.length; e++) {
                a.save(),
                  a.beginPath(),
                  a.fillStyle = b.colors[e];
                const f = this.datas[e]
                  , g = e * (d + c) - this.width / 2
                  , h = this.height - f - this.height / 2;
                a.fillRect(g, h, d, f);
                const i = "" + parseInt(this.datas[e])
                  , j = a.measureText(i).width
                  , k = a.measureText("田").width;
                a.fillStyle = "#FFFFFF",
                  a.fillText(i, g + (d - j) / 2, h - k),
                  a.fillText(this.titles[e], g + (d - j) / 2, this.height / 2 + k),
                  a.fill(),
                  a.closePath(),
                  a.restore()
              }
            },
            b
        }

        a.BarChartNode = c,
          a.PieChartNode = b
      }(JTopo),

      // Animate 和 Effect 的具体实现
      function (a) {
        function b(b, c) {
          let d, e = null;
          return {
            stop: function () {
              return d ? (window.clearInterval(d),
              e && e.publish("stop"),
                this) : this
            },
            start: function () {
              const a = this;
              return d = setInterval(function () {
                b.call(a)
              }, c),
                this
            },
            onStop: function (b) {
              return null == e && (e = new JTopo.util.MessageBus),
                e.subscribe("stop", b),
                this
            }
          }
        }

        // 特效：重力效果
        function gravity(a, c) {
          c = c || {};
          const d = c.gravity || .1, e = c.dx || 0;
          let f = c.dy || 5;
          const g = c.stop, h = c.interval || 30, i = new b(function () {
            g && g() ? (f = .5,
              this.stop()) : (f += d,
              a.setLocation(a.x + e, a.y + f))
          }, h);
          return i
        }

        // 动画：逐步
        function stepByStep(a, c, d, e, f) {
          //节点、属性、时间、true(是否循环)、是否逆循环
          const g = 1e3 / 24, h = {};
          for (let i in c) {
            const j = c[i]
              , k = j - a[i];
            h[i] = {
              oldValue: a[i],
              targetValue: j,
              step: k / d * g,
              isDone: function (b) {
                const c = this.step > 0 && a[b] >= this.targetValue || this.step < 0 && a[b] <= this.targetValue;
                return c
              }
            }
          }
          const l = new b(function () {
            let b = !0;
            for (var d in c)
              h[d].isDone(d) || (a[d] += h[d].step,
                b = !1);
            if (b) {
              if (!e)
                return this.stop();
              for (var d in c)
                if (f) {
                  const g = h[d].targetValue;
                  h[d].targetValue = h[d].oldValue,
                    h[d].oldValue = g,
                    h[d].step = -h[d].step
                } else
                  a[d] = h[d].oldValue
            }
            return this
          }, g);
          return l
        }

        // 特效：喷泉效果
        function spring(a) {
          null == a && (a = {});
          const b = a.spring || .1, c = a.friction || .8, d = a.grivity || 0, e = (a.wind || 0,
          a.minLength || 0);
          return {
            items: [],
            timer: null,
            isPause: !1,
            addNode: function (a, b) {
              const c = {
                node: a,
                target: b,
                vx: 0,
                vy: 0
              };
              return this.items.push(c),
                this
            },
            play: function (a) {
              this.stop(),
                a = null == a ? 1e3 / 24 : a;
              const b = this;
              this.timer = setInterval(function () {
                b.nextFrame()
              }, a)
            },
            stop: function () {
              null != this.timer && window.clearInterval(this.timer)
            },
            nextFrame: function () {
              for (let a = 0; a < this.items.length; a++) {
                const f = this.items[a]
                  , g = f.node
                  , h = f.target
                ;let i = f.vx
                  , j = f.vy
                ;const k = h.x - g.x
                  , l = h.y - g.y
                  , m = Math.atan2(l, k);
                if (0 != e) {
                  const n = h.x - Math.cos(m) * e
                    , o = h.y - Math.sin(m) * e;
                  i += (n - g.x) * b,
                    j += (o - g.y) * b
                } else
                  i += k * b,
                    j += l * b;
                i *= c,
                  j *= c,
                  j += d,
                  g.x += i,
                  g.y += j,
                  f.vx = i,
                  f.vy = j
              }
            }
          }
        }

        // 动画：旋转效果
        function rotate(a, b) {
          function c() {
            return e = setInterval(function () {
              return o ? void f.stop() : (a.rotate += g || .2,
                void (a.rotate > 2 * Math.PI && (a.rotate = 0)))
            }, 100),
              f
          }

          function d() {
            return window.clearInterval(e),
            f.onStop && f.onStop(a),
              f
          }

          var e = (b.context,
            null), f = {}, g = b.v;
          return f.run = c,
            f.stop = d,
            f.onStop = function (a) {
              return f.onStop = a,
                f
            },
            f
        }

        // 动画：重力效果
        function animateGravity(a, b) {
          function c() {
            return window.clearInterval(g),
            h.onStop && h.onStop(a),
              h
          }

          function d() {
            const d = b.dx || 0
            ;let i = b.dy || 2;
            return g = setInterval(function () {
              return o ? void h.stop() : (i += f,
                void (a.y + a.height < e.stage.canvas.height ? a.setLocation(a.x + d, a.y + i) : (i = 0,
                  c())))
            }, 20),
              h
          }

          var e = b.context, f = b.gravity || .1, g = null, h = {};
          return h.run = d,
            h.stop = c,
            h.onStop = function (a) {
              return h.onStop = a,
                h
            },
            h
        }

        // 动画：dividedTwoPiece
        function dividedTwoPiece(b, c) {
          function d(c, d, e, f, g) {
            const h = new a.Node;
            return h.setImage(b.image),
              h.setSize(b.width, b.height),
              h.setLocation(c, d),
              h.showSelected = !1,
              h.dragable = !1,
              h.paint = function (a) {
                a.save(),
                  a.arc(0, 0, e, f, g),
                  a.clip(),
                  a.beginPath(),
                  null != this.image ? a.drawImage(this.image, -this.width / 2, -this.height / 2) : (a.fillStyle = "rgba(" + this.style.fillStyle + "," + this.alpha + ")",
                    a.rect(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2),
                    a.fill()),
                  a.closePath(),
                  a.restore()
              }
              ,
              h
          }

          function e(c, e) {
            const f = c
              , g = c + Math.PI
              , h = d(b.x, b.y, b.width, f, g)
              , j = d(b.x - 2 + 4 * Math.random(), b.y, b.width, f + Math.PI, f);
            b.visible = !1,
              e.add(h),
              e.add(j),
              a.Animate.gravity(h, {
                context: e,
                dx: .3
              }).run().onStop(function () {
                e.remove(h),
                  e.remove(j),
                  i.stop()
              }),
              a.Animate.gravity(j, {
                context: e,
                dx: -.2
              }).run()
          }

          function f() {
            return e(c.angle, h),
              i
          }

          function g() {
            return i.onStop && i.onStop(b),
              i
          }

          var h = c.context, i = (b.style,
            {});
          return i.onStop = function (a) {
            return i.onStop = a,
              i
          },
            i.run = f,
            i.stop = g,
            i
        }

        // 动画：repeatThrow
        function repeatThrow(a, b) {
          function c(a) {
            a.visible = !0,
              a.rotate = Math.random();
            const b = g.stage.canvas.width / 2;
            a.x = b + Math.random() * (b - 100) - Math.random() * (b - 100),
              a.y = g.stage.canvas.height,
              a.vx = 5 * Math.random() - 5 * Math.random(),
              a.vy = -25
          }

          function d() {
            return c(a),
              h = setInterval(function () {
                return o ? void i.stop() : (a.vy += f,
                  a.x += a.vx,
                  a.y += a.vy,
                  void ((a.x < 0 || a.x > g.stage.canvas.width || a.y > g.stage.canvas.height) && (i.onStop && i.onStop(a),
                    c(a))))
              }, 50),
              i
          }

          function e() {
            window.clearInterval(h)
          }

          var f = .8, g = b.context, h = null, i = {};
          return i.onStop = function (a) {
            return i.onStop = a,
              i
          },
            i.run = d,
            i.stop = e,
            i
        }

        // 动画：停止所有
        function stopAll() {
          o = !0
        }

        // 动画：开始所有
        function startAll() {
          o = !1
        }

        // 动画：循环效果
        function cycle(b, c) {
          function d() {
            return n = setInterval(function () {
              if (o)
                return void m.stop();
              const a = f.y + h + Math.sin(k) * j;
              b.setLocation(b.x, a),
                k += l
            }, 100),
              m
          }

          function e() {
            window.clearInterval(n)
          }

          var f = c.p1, g = c.p2, h = (c.context,
            f.x + (g.x - f.x) / 2), i = f.y + (g.y - f.y) / 2, j = JTopo.util.getDistance(f, g) / 2, k = Math.atan2(i, h),
            l = c.speed || .2, m = {}, n = null;
          return m.run = d,
            m.stop = e,
            m
        }

        // 动画：移动效果
        function move(a, b) {
          function c() {
            return h = setInterval(function () {
              if (o)
                return void g.stop();
              const b = e.x - a.x
                , c = e.y - a.y
                , h = b * f
                , i = c * f;
              a.x += h,
                a.y += i,
              .01 > h && .1 > i && d()
            }, 100),
              g
          }

          function d() {
            window.clearInterval(h)
          }

          var e = b.position, f = (b.context,
          b.easing || .2), g = {}, h = null;
          return g.onStop = function (a) {
            return g.onStop = a,
              g
          },
            g.run = c,
            g.stop = d,
            g
        }

        // 动画：缩放效果
        function scale(a, b) {
          function c() {
            return j = setInterval(function () {
              a.scaleX += f,
                a.scaleY += f,
              a.scaleX >= e && d()
            }, 100),
              i
          }

          function d() {
            i.onStop && i.onStop(a),
              a.scaleX = g,
              a.scaleY = h,
              window.clearInterval(j)
          }

          var e = (b.position,
            b.context,
          b.scale || 1), f = .06, g = a.scaleX, h = a.scaleY, i = {}, j = null;
          return i.onStop = function (a) {
            return i.onStop = a,
              i
          },
            i.run = c,
            i.stop = d,
            i
        }

        // 动画
        JTopo.Animate = {},
          // 特效
          JTopo.Effect = {};
        var o = !1;
        // 特效：喷泉效果
        JTopo.Effect.spring = spring,
          // 特效：重力效果
          JTopo.Effect.gravity = gravity,
          // 动画：逐步
          JTopo.Animate.stepByStep = stepByStep,
          // 动画：旋转效果
          JTopo.Animate.rotate = rotate,
          // 动画：缩放效果
          JTopo.Animate.scale = scale,
          // 动画：移动效果
          JTopo.Animate.move = move,
          // 动画：循环效果
          JTopo.Animate.cycle = cycle,
          // 动画：repeatThrow
          JTopo.Animate.repeatThrow = repeatThrow,
          // 动画：dividedTwoPiece
          JTopo.Animate.dividedTwoPiece = dividedTwoPiece,
          // 动画：重力效果
          JTopo.Animate.gravity = animateGravity,
          // 动画：开始所有
          JTopo.Animate.startAll = startAll,
          // 动画：停止所有
          JTopo.Animate.stopAll = stopAll
      }(JTopo),

      // stage 和 scene 的 find 功能
      function (JTopo) {
        function b(a, b) {
          let c = []

          if (0 == a.length) {
            return c
          }

          let d = b.match(/^\s*(\w+)\s*$/)

          if (null != d) {
            var e = a.filter(function (a) {
              return a.elementType == d[1]
            })

            null != e && e.length > 0 && (c = c.concat(e))
          } else {
            let f = !1

            if (d = b.match(/\s*(\w+)\s*\[\s*(\w+)\s*([>=<])\s*['"](\S+)['"]\s*\]\s*/),
              (null == d || d.length < 5) && (d = b.match(/\s*(\w+)\s*\[\s*(\w+)\s*([>=<])\s*(\d+(\.\d+)?)\s*\]\s*/),
                f = !0),
              null != d && d.length >= 5) {
              const g = d[1]
                , h = d[2]
                , i = d[3]
                , j = d[4];
              e = a.filter(function (a) {
                if (a.elementType != g)
                  return !1;
                let b = a[h];
                return 1 == f && (b = parseInt(b)),
                  "=" == i ? b == j : ">" == i ? b > j : "<" == i ? j > b : "<=" == i ? j >= b : ">=" == i ? b >= j : "!=" == i ? b != j : !1
              }),
              null != e && e.length > 0 && (c = c.concat(e))
            }
          }

          return c
        }

        function c(a) {
          if (a.find = function (a) {
              return d.call(this, a)
            }
              ,
              e.forEach(function (b) {
                a[b] = function (a) {
                  for (let c = 0; c < this.length; c++)
                    this[c][b](a);
                  return this
                }
              }),
            a.length > 0) {
            var b = a[0];
            for (var c in b) {
              let f = b[c];
              "function" == typeof f && !function (b) {
                a[c] = function () {
                  for (var c = [], d = 0; d < a.length; d++)
                    c.push(b.apply(a[d], arguments));
                  return c
                }
              }(f)
            }
          }
          return a.attr = function (a, b) {
            if (null != a && null != b)
              for (var c = 0; c < this.length; c++)
                this[c][a] = b;
            else {
              if (null != a && "string" == typeof a) {
                for (var d = [], c = 0; c < this.length; c++)
                  d.push(this[c][a]);
                return d
              }
              if (null != a)
                for (var c = 0; c < this.length; c++)
                  for (let e in a)
                    this[c][e] = a[e]
            }
            return this
          },
            a
        }

        function d(d) {
          let e = []
          let f = []

          this instanceof JTopo.Stage
            ? (e = this.childs, f = f.concat(e))
            : this instanceof JTopo.Scene ? e = [this] : f = this, e.forEach(function (a) {
              f = f.concat(a.childs)
            });

          let g = null

          return g = "function" == typeof d ? f.filter(d) : b(f, d),
            g = c(g)
        }

        var e = "click,mousedown,mouseup,mouseover,mouseout,mousedrag,keydown,keyup".split(",");

        JTopo.Stage.prototype.find = d,
          JTopo.Scene.prototype.find = d
      }(JTopo),

      // 未开发完的功能，待研究
      function (window) {
        function Point(x, y) {
          this.x = x
          this.y = y
        }

        // Logo.Tortoise
        function Tortoise(paint) {
          this.p = new Point(0, 0)
          this.w = new Point(1, 0)
          this.paint = paint
        }

        // Logo.shift
        function shift(a, b, c) {
          return function (tortoise) {
            for (let i = 0; i < b; i++) {
              a()
            }

            c && tortoise.turn(c),
              tortoise.move(3)
          }
        }

        // Logo.spin
        function spin(a, b) {
          const c = 2 * Math.PI

          return function (d) {
            for (let i = 0; b > i; i++) {
              a()
            }

            d.turn(c / b)
          }
        }

        // Logo.scale
        function scale(a, b, c) {
          return function (d) {
            for (let i = 0; b > i; i++) {
              a()
            }

            d.resize(c)
          }
        }

        // Logo.polygon
        function polygon(sides) {
          const rad = 2 * Math.PI

          return function (tortoise) {
            for (let i = 0; i < sides; i++) {
              tortoise.forward(1)
            }

            tortoise.turn(rad / sides)
          }
        }

        // Logo.star
        function star(a) {
          const rad = 4 * Math.PI

          return function (tortoise) {
            for (let i = 0; i < a; i++) {
              tortoise.forward(1)
            }

            tortoise.turn(rad / a)
          }
        }

        // Logo.spiral
        function spiral(a, b, c, d) {
          return function (tortoise) {
            for (let i = 0; i < b; i++) {
              a()
            }

            tortoise.forward(1),
              tortoise.turn(c),
              tortoise.resize(d)
          }
        }

        const Logo = {}

        Tortoise.prototype.forward = function (a) {
          const p = this.p
          const w = this.w

          return p.x = p.x + a * w.x,
            p.y = p.y + a * w.y,
          this.paint && this.paint(p.x, p.y),
            this
        },
          Tortoise.prototype.move = function (a) {
            const p = this.p
            const w = this.w

            return p.x = p.x + a * w.x,
              p.y = p.y + a * w.y,
              this
          },
          Tortoise.prototype.moveTo = function (x, y) {
            return this.p.x = x,
              this.p.y = y,
              this
          },
          Tortoise.prototype.turn = function (a) {
            const w = (this.p, this.w)
            const x = Math.cos(a) * w.x - Math.sin(a) * w.y
            const y = Math.sin(a) * w.x + Math.cos(a) * w.y

            return w.x = x,
              w.y = y,
              this
          },
          Tortoise.prototype.resize = function (a) {
            const w = this.w

            return w.x = w.x * a,
              w.y = w.y * a,
              this
          },
          Tortoise.prototype.save = function () {
            return null == this._stack && (this._stack = []),
              this._stack.push([this.p, this.w]),
              this
          },
          Tortoise.prototype.restore = function () {
            if (null != this._stack && this._stack.length > 0) {
              const a = this._stack.pop()

              this.p = a[0],
                this.w = a[1]
            }
            return this
          },
          Logo.Tortoise = Tortoise,
          Logo.shift = shift,
          Logo.spin = spin,
          // 多边形
          Logo.polygon = polygon,
          Logo.spiral = spiral,
          Logo.star = star,
          Logo.scale = scale,
          window.Logo = Logo
      }(window);

    return JTopo
  });

