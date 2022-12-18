/// <reference types="vite/client" />

interface IFormInitialValues {
  minPrice: number
  maxPrice: number
  minSalesQuantity: number
  minGoodsQuantity: number
  isOpenPriceTransform: boolean
}

interface IStoreInfo {
  store_name: string
  board_intro: string
  store_bg_img: string
  board_img: string
  board_is_new: boolean
  board_is_active: boolean
  credit_rate: string
  star_cnt: number
  im_response_time_hours: number
  /** 商家产品数量 */
  items_cnt: number
  credit_cnt: string
  foreign_credit: number
  deliver_days: string
  phone_certify: boolean
  user_status: number
  email_certify: boolean
  pp_certify: boolean
  pp_crd_certify: boolean
  pi_level: string
  corp_status: boolean
  oversea_user: boolean
  safepc: boolean
  user_img: string
  store_suspend_info: null
  platform: string
  last_activity_time: number
  user_id: string
  store_penalty_limit: boolean
  is_brand_seller: boolean
}

interface IStoreResponse {
  status: stirng | 'success'
  data: IStoreInfo
}

interface IGoodsInfo {
  id: string
  class: string
  name: string
  num: number
  images: {
    filename: string
    url: string[]
    m_url: string[]
  }
  currency: string
  goods_price: number
  goods_ori_price: number
  goods_price_range: {
    min: number
    max: number
    ori_min: number
    ori_max: number
  }
  watch_num: number
  /** 销量 */
  sold_num: number
  buyer_limit_num: number
  stock_status: number
  pre_order_ship_date: null
  fast_ship: number
  free_shipping: number
  youtube_link: string
  video_link: string
  ncc_check_code: string
  goods_no: string
  available: true
  post_time: string
  spec_type: string
  deliver_way: {
    SEVEN_COD: number
    SEVEN: number
    FAMI_COD: number
    FAMI: number
    POST: number
    HOUSE: number
    ISLAND: number
    COD: number
  }
  mode: string
  ship: string
  platform: string
  ctrl_rowid: string
  user: string
  user_credit: number
  pay_way: string[]
  title_style: string
  selling_g_now_price: number
  item_remaining_time: number
  translation_type: null
  translated_name: null
  min_estimated_delivery_date: null
  max_estimated_delivery_date: null
  update_time: string
  is_brand_seller: boolean
  is_goods_from_oversea: boolean
}

interface IGoodsResponse {
  status: stirng | 'success'
  data: IGoodsInfo[]
}

interface IGoodsIdsCallbackInfo {
  LimitedTotalRows: number
  Rows: {
    Id: string
    SellerEventType: null
    Discount: number
    RPoint: null
    More: null
    FreeShipping: number
    ShippingDiscount: number
    StockStatus: number
    FastShip: number
    BrandStore: number
    SellerDiscount: number
  }[]
  TotalRows: number
}

interface Window {
  lutian_price_transform_timer: number
  lutian_store_goods_links_copy_timer: number
  lutian_mybid_timer: number
  lutian_store_goods_ids_cache: string[]
  lutian_find_goods_ids_cache: string[]
}

interface ImportMetaEnv {
  readonly VITE_APP_WHITE_LIST: string
  readonly VITE_APP_END_TIME: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
