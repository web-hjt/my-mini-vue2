class Vue {
  constructor(options) {
    // console.log(options)
    this.$options = options
    this.$watchEvent = {}
    if (typeof options.beforeCreate === 'function') {
      options.beforeCreate.bind(this)()
    }

    this.$data = options.data
    this.proxyData()
    this.observer()
    if (typeof options.create === 'function') {
      options.create.bind(this)()
    }
    if (typeof options.beforeMounted === 'function') {
      options.beforeMounted.bind(this)()
    }
    this.$el = document.querySelector(options.el)
    // 模版解析
    this.compile(this.$el)
    if (typeof options.mounted === 'function') {
      options.mounted.bind(this)()
    }
  }
  // 给vue大对象赋属性，来自于data中
  // data中的属性和vue大对象的属性保持双向（数据劫持）
  proxyData() {
    for (let key in this.$data) {
      // 数据劫持原理
      Object.defineProperty(this, key, {
        get() {
          return this.$data[key]
        },
        set(val) {
          this.$data[key] = val
        },
      })
    }
  }
  // 触发data中的数据发生变化来执行watch中的update
  observer() {
    for (let key in this.$data) {
      let value = this.$data[key]
      let that = this
      Object.defineProperty(this.$data, key, {
        get() {
          return value
        },
        set(val) {
          console.log('observer', that.$watchEvent)
          value = val
          if (that.$watchEvent[key]) {
            that.$watchEvent[key].forEach((item, index) => {
              item.update()
            })
          }
        },
      })
    }
  }
  compile(node) {
    node.childNodes.forEach((item) => {
      // console.log(item.nodeType)
      if (item.nodeType === 1) {
        if (item.hasAttribute('@click')) {
          // @click后绑定的属性名 btn
          let vmKey = item.getAttribute('@click').trim()
          item.addEventListener('click', (event) => {
            this.eventFn = this.$options.methods[vmKey].bind(this)
            this.eventFn(event)
          })
        }
        // 判断元素节点是否添了v-model
        if (item.hasAttribute('v-model')) {
          let vmKey = item.getAttribute('v-model').trim()
          if (this.hasOwnProperty(vmKey)) {
            // console.log(this[vmKey])

            item.value = this[vmKey]
          }
          item.addEventListener('input', (event) => {
            // console.log(222222, event.target.value, item)
            // 这个item是dom节点

            // 等价于 this.str = event.target.value || item.value
            // this.str 改变出发 observer 中的数据劫持 从而触发update
            this[vmKey] = item.value
          })
        }

        if (item.childNodes.length > 0) {
          this.compile(item)
        }
      }
      // 文本节点 如果有{{}}就替换成数据
      if (item.nodeType === 3) {
        // 正则匹配
        let reg = /\{\{(.*?)\}\}/g
        let text = item.textContent
        item.textContent = text.replace(reg, (match, vmKey) => {
          // console.log(match, vmKey)
          vmKey = vmKey.trim()
          if (this.hasOwnProperty(vmKey)) {
            let wacther = new Watch(this, vmKey, item, 'textContent')
            if (this.$watchEvent[vmKey]) {
              this.$watchEvent[vmKey].push(wacther)
            } else {
              this.$watchEvent[vmKey] = []
              this.$watchEvent[vmKey].push(wacther)
            }
          }
          return this.$data[vmKey]
        })
      }
    })
  }
}

class Watch {
  constructor(vm, key, node, attr) {
    // 对象
    this.vm = vm
    // 属性名称
    this.key = key
    // 节点
    this.node = node
    // 改变文本节点内容的字串
    this.attr = attr
  }
  // 执行改变操作
  update() {
    this.node[this.attr] = this.vm[this.key]
  }
}
