;(() => {
  const LOCAL_KEY_FORMDATA = 'configFormData' // 配置
  const TIMER_ID = 'lutian_store_goods_links_copy_timer' // 定时器id
  const BGC = '#36e170'

  const formInitialValues: IFormInitialValues = {
    minPrice: 50,
    maxPrice: 99999,
    minSalesQuantity: 1,
    minGoodsQuantity: 2000,
    isOpenPriceTransform: true,
  }

  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === LOCAL_KEY_FORMDATA) {
        initGoodsScreening()
      }
    }
  })

  const methods = {
    copyToClipboard(str: string) {
      console.log(str)
      // function copyText(text: string) {
      const div = document.createElement('div')
      div.classList.add('wj-copy-text')
      div.style.cssText = `
        position: absolute;
        opacity: 0;
        left: -200vw;
      `
      div.innerText = str
      document.body.appendChild(div)
      //复制文本 需要在文档中添加一个复制用的input
      const range = document.createRange() //创建一个range
      window.getSelection()?.removeAllRanges() //清楚页面中已有的selection
      range.selectNode(div) // 选中需要复制的节点
      window.getSelection()?.addRange(range) // 执行选中元素
      const successful = document.execCommand('copy') // 执行 copy 操作
      if (successful) {
        // alert('复制成功！')
      } else {
        const el = document.createElement('textarea') // 创建一个 <textarea> 元素
        el.value = str // 设置它的值为你想复制的字符串
        el.setAttribute('readonly', '') // 设置为只读以防止干扰
        el.style.position = 'absolute'
        el.style.left = '-9999px' // 移出屏幕外以使其不可见
        document.body.appendChild(el) // 插入 <textarea> 元素到 HTML 文档中
        const selected =
          document.getSelection()?.rangeCount! > 0 // 检查是否之前曾选中过内容
            ? document.getSelection()!.getRangeAt(0) // 如果找到，则保存选中
            : false // 标记为  false 以表示不存在之前选中的内容
        el.select() // 选中 <textarea> 的内容
        document.execCommand('copy') // 复制 - 仅当作为用户操作的响应结果时才可以工作(比如，点击事件)
        const successful = document.execCommand('copy') // 执行 copy 操作
        if (!successful) {
          alert(`复制失败，请按F12打开控制台手动复制`)
        }
        // alert('复制成功！')
        document.body.removeChild(el) // 移除 <textarea> 元素
        if (selected) {
          // 如果在复制前已存在选中的内容
          document.getSelection()!.removeAllRanges() // 取消 HTML 文档中所有的选中部分
          document.getSelection()!.addRange(selected) // 恢复原来的选中
        }
      } // 移除选中的元素
      window.getSelection()?.removeAllRanges()
      document.querySelector<HTMLElement>('.wj-copy-text')?.remove()
    },
    getNumber(str: string, defaultStr: string = '0') {
      return str ? parseInt(str.replace(/[^\d]/g, '') || defaultStr) : 0
    },
    getBeforeDate(day = 1) {
      return new Date(Date.now() - day * 24 * 3600 * 1000)
    },
    dateFormat(date: Date, fmt = 'YYYY-mm-dd') {
      let ret
      const opt: any = {
        'Y+': date.getFullYear().toString(), // 年
        'm+': (date.getMonth() + 1).toString(), // 月
        'd+': date.getDate().toString(), // 日
        'H+': date.getHours().toString(), // 时
        'M+': date.getMinutes().toString(), // 分
        'S+': date.getSeconds().toString(), // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
      }
      for (let k in opt) {
        ret = new RegExp('(' + k + ')').exec(fmt)
        if (ret) {
          fmt = fmt.replace(ret[1], ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'))
        }
      }
      return fmt
    },
  }

  // 获取商品总数
  function getGoodsAllNum() {
    const goodsAllEle = document.querySelector('.category-all-goods') as HTMLElement
    const goodsAllRealEle = document.querySelector('.search-result-text') as HTMLElement
    const goodsNum = methods.getNumber(goodsAllEle.innerText)
    const goodsRealNum = methods.getNumber(goodsAllRealEle.innerText)
    const goodsAllNum = goodsRealNum || goodsNum
    return {
      goodsAllEle: goodsRealNum ? goodsAllRealEle : goodsAllEle,
      goodsAllNum,
    }
  }

  async function renderBar(links: string[]) {
    document.querySelector('.kaki-bar')?.remove()
    const htmlStr = `
        <div class="kaki-bar-item">
          <label>符合条件：</label>
          <span>${links.length}个</span>
        </div>
        <div class="kaki-bar-item">
          <div class="kaki-button copy-current-page-links">复制当前页链接</div>
        </div>
    `
    const container = document.createElement('div')
    container.classList.add('kaki-bar')
    container.innerHTML = htmlStr
    document.body.appendChild(container)
    ;(container.querySelector('.copy-current-page-links') as HTMLElement).onclick = () => {
      methods.copyToClipboard(links.join('\n') || '暂无数据')
    }
  }
  // 初始化商品筛选
  async function initGoodsScreening() {
    const envWhiteListStr = import.meta.env.VITE_APP_WHITE_LIST
    const whiteList: string[] | null = envWhiteListStr ? JSON.parse(envWhiteListStr) : null
    const userName = document.querySelector<HTMLElement>('#header_user_nick')?.innerText
    if (whiteList && !whiteList.includes(userName!)) {
      return
    }
    const productCards = document.querySelectorAll('.rt-product-card')
    if (productCards.length === 0) {
      return
    }
    const localFormData: IFormInitialValues = {
      ...formInitialValues,
      ...(await chrome.storage.local.get([LOCAL_KEY_FORMDATA]))[LOCAL_KEY_FORMDATA],
    }
    const { goodsAllNum, goodsAllEle } = getGoodsAllNum()
    const isGoodsLengthHit = goodsAllNum > localFormData.minGoodsQuantity
    const successGoodsList = Array.prototype.filter.call(productCards, (item: HTMLElement) => {
      item.style.backgroundColor = '#fff'
      item.style.outline = `none`

      const xiaoliang = methods.getNumber(
        item.querySelectorAll<HTMLElement>('.rt-product-card-sold span')[1]?.innerText
      )
      const priceSpan = item.querySelectorAll<HTMLElement>('.rt-product-card-price-wrap span.text-price-dollar')
      const minPrice = methods.getNumber(priceSpan[0]?.innerText)
      const maxPrice = methods.getNumber(priceSpan[1]?.innerText) || minPrice
      return (
        isGoodsLengthHit &&
        (xiaoliang > localFormData.minSalesQuantity || xiaoliang == 999) &&
        (minPrice >= localFormData.minPrice || maxPrice >= localFormData.minPrice) &&
        localFormData.maxPrice >= maxPrice
      )
    })

    // 设置突出颜色
    successGoodsList.forEach((item) => {
      item.style.backgroundColor = BGC
      item.style.outline = `3px solid BGC`
    })

    if (isGoodsLengthHit) {
      goodsAllEle.style.backgroundColor = BGC
      goodsAllEle.style.fontSize = '25px'
    } else {
      goodsAllEle.style.backgroundColor = '#ff5555'
    }
    const links = successGoodsList.map((item) => {
      return item.querySelector('.rt-product-card-img-wrap > a').href
    })

    renderBar(links)
  }
  clearInterval(window[TIMER_ID])
  window[TIMER_ID] = setInterval(initGoodsScreening, 500)

})()
export default {}
