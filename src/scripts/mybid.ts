;(() => {
  const LOCAL_KEY_FORMDATA = 'configFormData' // 配置
  const NATIVE_PRICE = 'nativePrice' // 本次转换前的价格
  const TRANSFORM_PRICE = 'transformPriceOver' // 上一次转换过后的价格
  const TIMER_ID = 'lutian_mybid_timer' // 定时器id
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
      const num = methods.getNumber(str.replace(/[^\d]/g, '')) * 0.23
      return num > 0 ? num.toFixed(1) : str;
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
    if(listWrapper){
      const imgs = listWrapper.querySelectorAll<HTMLImageElement>('.rt-product-image-wrap > img')
      imgs.forEach(item => {
        item.src = item.src.replace('_s.', '.');
        item.style.cssText = `
          max-width: initial;
          width: 200px;
        `
      })
    }
  }
  async function init() {
    console.log(1);
    
    goodsImagesStyle()
  }
  clearInterval(window[TIMER_ID])
  window[TIMER_ID] = setInterval(init, 200)
})()
export default {}