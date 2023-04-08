;(() => {
  const LOCAL_KEY_FORMDATA = 'configFormData' // 配置
  const TIMER_ID = 'lutian_store_goods_links_copy_timer' // 定时器id
  const GOODS_IDS_CACHE = 'lutian_store_goods_ids_cache' // 商品id列表缓存
  const BGC = '#36e170'
  const STORE_HISTORY = 'storeHistory'

  function checkoutToken(userName?: string) {
    const envWhiteListStr = import.meta.env.VITE_APP_WHITE_LIST
    const whiteList: string[] | null = envWhiteListStr ? JSON.parse(envWhiteListStr).map(methods.myEncode) : null
    let text = '暂未开通权限'
    const isPastDue =
      Date.now() - parseInt(import.meta.env.VITE_APP_END_TIME) >
      parseInt(import.meta.env.VITE_APP_DAY) * 24 * 3600 * 1000 // 是否过期

    if (isPastDue) {
      text = '软件已过期'
    }

    if (!userName || (whiteList && !whiteList.includes(userName!)) || isPastDue) {
      return true
    }
    return false
  }

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
    myEncode(str: string) {
      return str?.split(encodeURI('kaki')).join('')
    },
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

  let potentialText = '复制商家潜力链接'

  async function renderBar(links: string[], localFormData: IFormInitialValues) {
    if (checkoutToken(document.querySelector<HTMLElement>('#header_user_nick')?.innerText)) {
      return
    }
    const storeHistory: string[] = (await chrome.storage.local.get([STORE_HISTORY]))[STORE_HISTORY] || []
    const userName = document.querySelector<HTMLElement>('.user-id')?.innerText
    document.querySelector('.kaki-bar')?.remove()
    let qianli = `
      <div class="kaki-bar-item">
        <div class="kaki-button copy-potential-links">${potentialText}</div>
      </div>
      <div class="kaki-bar-item">
        <div class="lutian-tips">${storeHistory.includes(userName!) ? '商家已被复制' : ''}</div>
      </div>
    `
    qianli = ''
    const htmlStr = `
        <div class="kaki-bar-item">
          <label>符合条件：</label>
          <span>${links.length}个</span>
        </div>
        <div class="kaki-bar-item">
          <div class="kaki-button copy-current-page-links">复制当前页链接</div>
        </div>
        ${qianli}
    `
    const container = document.createElement('div')
    container.classList.add('kaki-bar')
    container.innerHTML = htmlStr
    document.body.appendChild(container)
    ;(container.querySelector('.copy-current-page-links') as HTMLElement).onclick = () => {
      methods.copyToClipboard(links.join('\n') || '暂无数据')
    }
    const copyPotentialLinkButton = container.querySelector<HTMLElement>('.copy-potential-links')!
    if (copyPotentialLinkButton) {
      copyPotentialLinkButton.onclick = async () => {
        if (potentialText === '正在拉取数据，请稍等') {
          return
        }
        copyPotentialLinkButton.innerText = potentialText = '正在拉取数据，请稍等'

        if (!userName) {
          const errInfo = '没有找到userName'
          copyPotentialLinkButton.innerText = potentialText = errInfo
          setTimeout(() => {
            renderBar(links, localFormData)
          }, 200)
          return
        }
        const storeInfo: IStoreResponse = await fetch(
          `https://rapi.ruten.com.tw/api/users/v1/index.php/${userName}/storeinfo`
        ).then((res) => res.json())
        if (storeInfo.status !== 'success') {
          const errInfo = '商家信息请求失败'
          copyPotentialLinkButton.innerText = potentialText = errInfo
          setTimeout(() => {
            renderBar(links, localFormData)
          }, 200)
          return
        }
        const { goodsAllNum } = getGoodsAllNum()
        const pageSize = 30
        const potentialLinks: string[] = []
        let chanceNum = 0 // 兜底操作。
        let chanceMaxNum = 5
        for (let limit = 1; limit < goodsAllNum / pageSize && chanceNum < chanceMaxNum; limit += pageSize) {
          const scriptStr = await fetch(
            `https://rtapi.ruten.com.tw/api/search/v3/index.php/core/seller/${
              storeInfo.data.user_id
            }/prod?sort=ords/dc&limit=${pageSize}&offset=${limit}&_=${Date.now()}&_callback=1`
          ).then((response) => response.text())
          const jsonStr = scriptStr
            .replace('try{1(', '')
            .replace(');}catch(e){if(window.console){console.log(e);}}', '')
          const goodsIdsInfo: IGoodsIdsCallbackInfo = JSON.parse(jsonStr)
          const ids = goodsIdsInfo.Rows.map((item) => item.Id).toString()
          const { data }: IGoodsResponse = await fetch(`https://rapi.ruten.com.tw/api/items/v2/list?gno=${ids}`).then(
            (res) => res.json()
          )
          const dataLinks = data
            .filter((item) => {
              if (item.sold_num === 0) {
                return false
              }
              // const createTime = methods.dateFormat(new Date(parseInt(item.post_time) * 1000))
              const createTime = methods.dateFormat(new Date(item.update_time))
              // 小于最小价格
              if (item.goods_price_range.max < localFormData.minPrice) {
                return false
              }
              // 一年半以前上架的商品就不要了
              if (createTime < methods.dateFormat(methods.getBeforeDate(365 + 180))) {
                return false
              }
              if (item.sold_num <= 3) {
                // 1半个月内没有卖出3单
                if (createTime < methods.dateFormat(methods.getBeforeDate(45))) {
                  return false
                }
              } else if (item.sold_num <= 5) {
                // 2个月内没有卖出5单
                if (createTime < methods.dateFormat(methods.getBeforeDate(60))) {
                  return false
                }
              } else if (item.sold_num <= 10) {
                // 4个月内没有卖出10单
                if (createTime < methods.dateFormat(methods.getBeforeDate(120))) {
                  return false
                }
              }
              return true
            })
            .map((item) => `https://www.ruten.com.tw/item/show?${item.id}`)

          potentialLinks.push(...dataLinks)
          // 如果数据为0; 则最多往后面查找3页
          if (dataLinks.length === 0) {
            chanceNum++
          } else {
            chanceNum = 0
          }
        }
        methods.copyToClipboard(potentialLinks.join('\n') || '暂无数据')

        if (!storeHistory.includes(userName)) {
          chrome.storage.local.set({
            [STORE_HISTORY]: [...storeHistory, userName],
          })
        }
        copyPotentialLinkButton.innerText = potentialText = potentialLinks.length
          ? '复制商家潜力链接（复制成功！）'
          : '暂无数据'
      }
    }
  }
  // 初始化商品筛选
  async function initGoodsScreening() {
    if (checkoutToken(document.querySelector<HTMLElement>('#header_user_nick')?.innerText)) {
      return
    }
    const envWhiteListStr = import.meta.env.VITE_APP_WHITE_LIST
    const whiteList: string[] | null = envWhiteListStr ? JSON.parse(envWhiteListStr).map(methods.myEncode) : null
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

    renderBar(links, localFormData)
  }
  clearInterval(window[TIMER_ID])
  window[TIMER_ID] = setInterval(initGoodsScreening, 500)

  // 显示上架、修改时间逻辑
  async function initShowTimeInfo() {
    if (checkoutToken(document.querySelector<HTMLElement>('#header_user_nick')?.innerText)) {
      return
    }
    // // 获取商家信息
    // const storeInfo: IStoreResponse = await fetch(
    //   `https://rapi.ruten.com.tw/api/users/v1/index.php/${userName}/storeinfo`
    // ).then((res) => res.json())
    // if (storeInfo.status !== 'success') {
    //   console.error('商家信息请求失败')
    //   setTimeout(initShowTimeInfo, 1000)
    //   return
    // }
    // console.log(storeInfo)

    // 获取商家商品id列表 排序：rnk/dc ords/dc
    // const query = new URLSearchParams(location.search);
    // const scriptStr = await fetch(
    //   `https://rtapi.ruten.com.tw/api/search/v3/index.php/core/seller/${
    //     storeInfo.data.user_id
    //   }/prod?sort=${query.get('sort')}&limit=30&offset=1&_=${Date.now()}&_callback=1`
    // ).then((response) => response.text())
    // const jsonStr = scriptStr.replace('try{1(', '').replace(');}catch(e){if(window.console){console.log(e);}}', '')
    // const goodsIdsInfo: IGoodsIdsCallbackInfo = JSON.parse(jsonStr)
    // const ids = goodsIdsInfo.Rows.map((item) => item.Id).toString()
    // console.log('ids:', ids)
    const goodsAEle = document.querySelectorAll<HTMLElement>(`.rt-product-card-img-wrap > a`)
    if (!goodsAEle.length) {
      return
    }

    const ids = Array.prototype.map.call(goodsAEle, (a: HTMLLinkElement) => {
      return a.href.split('?')[1]
    }) as string[]

    if (ids.toString() === window[GOODS_IDS_CACHE]?.toString()) {
      return
    }
    window[GOODS_IDS_CACHE] = ids

    const res: IGoodsResponse = await fetch(`https://rapi.ruten.com.tw/api/items/v2/list?gno=${ids.toString()}`).then(
      (res) => res.json()
    )
    document.querySelectorAll<HTMLElement>('.lutian-time-info').forEach((item) => item.remove())
    res.data.forEach((item) => {
      const div = document.createElement('div')
      div.classList.add('lutian-time-info')
      div.innerHTML = `
        <p>上架时间：${new Date(parseInt(item.post_time) * 1000).toLocaleDateString()}</p>
        <p>更新时间：${item.update_time}</p>
      `
      document.querySelector(`a[title="${item.name}"]`)?.parentElement?.parentElement?.appendChild(div)
    })
  }
  setInterval(initShowTimeInfo, 200)
})()
export default {}
