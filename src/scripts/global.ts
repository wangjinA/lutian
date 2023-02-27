;(() => {
  const LOCAL_KEY_FORMDATA = 'configFormData' // 配置
  const NATIVE_PRICE = 'nativePrice' // 本次转换前的价格
  const TRANSFORM_PRICE = 'transformPriceOver' // 上一次转换过后的价格
  const TIMER_ID = 'lutian_price_transform_timer' // 定时器id
  const formInitialValues: IFormInitialValues = {
    minPrice: 50,
    maxPrice: 99999,
    minSalesQuantity: 1,
    minGoodsQuantity: 2000,
    isOpenPriceTransform: true,
  }

  const methods = {
    getNumber(str: string, defaultStr: string = '0') {
      return str ? parseInt(str.replace(/[^\d]/g, '') || defaultStr) : 0
    },
    priceTransform(str: string) {
      const num = methods.getNumber(str.replace(/[^\d]/g, '')) * 0.23
      return num > 0 ? num.toFixed(1) : str
    },
    myEncode(str: string) {
      return str?.split(encodeURI('kaki')).join('')
    },
  }
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === LOCAL_KEY_FORMDATA) {
        init()
      }
    }
  })
  function goodsImagesStyle() {
    const listWrapper = document.querySelector('.mybid-list')
    if (listWrapper) {
      const imgs = listWrapper.querySelectorAll<HTMLImageElement>('.rt-product-image-wrap > img')
      imgs.forEach((item) => {
        item.src = item.src.replace('_s.', '.')
        item.style.cssText = `
          max-width: initial;
          width: 100px;
        `
      })
    }
  }
  async function init() {
    goodsImagesStyle()
    const envWhiteListStr = import.meta.env.VITE_APP_WHITE_LIST
    const whiteList: string[] | null = envWhiteListStr ? JSON.parse(envWhiteListStr).map(methods.myEncode) : null
    const userName = document.querySelector<HTMLElement>('#header_user_nick')?.innerText
    if (whiteList && !whiteList.includes(userName!)) {
      return
    }

    await chrome.storage.local.set({
      userName,
    })

    const { isOpenPriceTransform }: IFormInitialValues = {
      ...formInitialValues,
      ...(await chrome.storage.local.get([LOCAL_KEY_FORMDATA]))[LOCAL_KEY_FORMDATA],
    }
    const priceEleList: HTMLElement[] = [
      ...(document.querySelectorAll<HTMLElement>('.text-price-dollar') || []), // 商品卡片的价格
      ...(document.querySelectorAll<HTMLElement>('.rt-text-price') || []), // 购物车弹窗的价格
      ...(document.querySelectorAll<HTMLElement>('.rt-text-important') || []), // 商品详情sku的价格
    ]

    priceEleList.forEach((__item) => {
      const fontEle = __item.querySelectorAll<HTMLElement>('font')?.[1]
      const item = fontEle || __item
      const textNode = item.childNodes?.[0] as Text
      let nativePrice = item.getAttribute(NATIVE_PRICE)
      let transformPriceOver = item.getAttribute(TRANSFORM_PRICE)

      if (!isOpenPriceTransform && nativePrice && nativePrice !== item.innerText) {
        console.log('价格还原')
        textNode.data = nativePrice
        item.setAttribute(NATIVE_PRICE, '')
        item.setAttribute(TRANSFORM_PRICE, '')
        return
      }
      let showPrice = item.innerText
      const ifSingle = item.children.length === 0 && item.innerText.includes('-')

      function setData() {
        if (ifSingle) {
          showPrice = item.innerText
            .split('-')
            .map((str) => methods.priceTransform(str))
            .join(' - ')
        } else {
          showPrice = methods.priceTransform(item.innerText)
        }
        item.setAttribute(NATIVE_PRICE, item.innerText)
        if (ifSingle) {
          textNode.data = showPrice
        } else {
          textNode.data = showPrice
        }
        item.setAttribute(TRANSFORM_PRICE, showPrice)
      }

      if (isOpenPriceTransform) {
        // console.log('价格转换watching')
        if (!nativePrice || (transformPriceOver && item.innerText !== transformPriceOver)) {
          setData()
        }
      }
    })
  }
  clearInterval(window[TIMER_ID])
  window[TIMER_ID] = setInterval(init, 200)
})()
export default {}
