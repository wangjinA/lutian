;(() => {
  const LOCAL_KEY_FORMDATA = 'configFormData' // 配置
  const NATIVE_PRICE = 'nativePrice' // 本次转换前的价格
  const TRANSFORM_PRICE = 'transformPriceOver' // 上一次转换过后的价格
  const TIMER_ID = 'lutian_price_transform_timer' // 定时器id
  const GOODS_IDS_CACHE = 'lutian_find_goods_ids_cache' // 商品id列表缓存
  const cahceObj: { [id: string]: IGoodsInfo } = {} // 商品信息缓存

  const BGC = '#36e170'
  const formInitialValues: IFormInitialValues = {
    minPrice: 100,
    maxPrice: 99999,
    minSalesQuantity: 5,
    minGoodsQuantity: 3000,
    isOpenPriceTransform: true,
  }
  const methods = {
    getNumber(str: string, defaultStr: string = '0') {
      return str ? parseInt(str.replace(/[^\d]/g, '') || defaultStr) : 0
    },
    priceTransform(str: string) {
      return (methods.getNumber(str.replace(/[^\d]/g, '')) * 0.23).toFixed(1)
    },
  }
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === LOCAL_KEY_FORMDATA) {
        init()
      }
    }
  })
  async function init() {
    const localFormData: IFormInitialValues = {
      ...formInitialValues,
      ...(await chrome.storage.local.get([LOCAL_KEY_FORMDATA]))[LOCAL_KEY_FORMDATA],
    }
    const goodsAEleList = document.querySelectorAll<HTMLElement>('.product-item .rt-product-card-img-wrap a')
    if (goodsAEleList.length === 0) {
      return
    }
    let ids: string[] = Array.prototype.map.call(goodsAEleList, (item: HTMLLinkElement) => {
      return item.href.split('?')[1]
    }) as string[]

    if (ids.every((id) => window[GOODS_IDS_CACHE]?.includes(id))) {
      console.log('页面dom不变')
      return
    }
    console.error('页面dom改变')
    window[GOODS_IDS_CACHE] = ids

    // 读取一下缓存
    const cahceGoodsInfo = ids
      .filter((id) => cahceObj[id])
      .reduce<IGoodsInfo[]>((pre, id) => {
        return [...pre, cahceObj[id]]
      }, [])

    // 去除有缓存的id
    ids = ids.filter((id) => !cahceObj[id])

    const { data }: IGoodsResponse = await fetch(
      `https://rapi.ruten.com.tw/api/items/v2/list?gno=${ids.toString()}`
    ).then((res) => res.json())

    // 记录一下缓存
    data.forEach((item) => {
      cahceObj[item.id] = item
    })

    data.push(...cahceGoodsInfo) // 将命中的缓存添加到data中

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      const storeInfo: IStoreResponse = await fetch(
        `https://rapi.ruten.com.tw/api/users/v1/index.php/${item.user}/storeinfo`
      ).then((res) => res.json())
      const targetAEle: HTMLElement = Array.prototype.find.call(goodsAEleList, (oitem: HTMLLinkElement) => {
        return oitem.href.split('?')[1] == item.id
      })
      let backgroundColor = BGC;
      if (storeInfo.data.items_cnt < localFormData.minGoodsQuantity) {
        // 不符合要求的往后面排吧
        console.log('不符合要求')
        console.log(targetAEle.parentElement?.parentElement?.parentElement)
        console.log(targetAEle.parentElement?.parentElement)

        targetAEle.closest('.product-item')?.parentElement?.appendChild(targetAEle.closest('.product-item')!)
        backgroundColor = '#e1e1e1';
      } 
      const parent = targetAEle?.parentElement?.parentElement
      if (parent && !parent.querySelector('.lutian-goods-Num')) {
        parent.style.backgroundColor = backgroundColor
        const div = document.createElement('div')
        div.classList.add('lutian-goods-Num')
        div.style.cssText = `
          background-color: #aeaeae;
          padding: 5px 10px;
          color: #000;
          font-weight: 700;
        `
        div.innerHTML = `商品数量：${storeInfo.data.items_cnt}`
        parent.appendChild(div)
      }
    }
  }
  clearInterval(window[TIMER_ID])
  window[TIMER_ID] = setInterval(init, 200)
})()
export default {}
