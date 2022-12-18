import { Button, Form, FormInstance, InputNumber, Switch } from '@arco-design/web-react'
import FormItem from '@arco-design/web-react/es/Form/form-item'
import { useEffect, useRef, useState } from 'react'
import './App.less'
const LOCAL_KEY_FORMDATA = 'configFormData' // 配置

const placeholder = '请输入'
const formInitialValues: IFormInitialValues = {
  minPrice: 50,
  maxPrice: 99999,
  minSalesQuantity: 1,
  minGoodsQuantity: 2000,
  isOpenPriceTransform: true,
}
function App() {
  const formRef = useRef<FormInstance>(null)
  const [userName, setUserName] = useState<string>()

  useEffect(() => {
    ;(async () => {
      const localFormData: IFormInitialValues = (await chrome.storage.local.get([LOCAL_KEY_FORMDATA]))[
        LOCAL_KEY_FORMDATA
      ]
      const data = {
        ...formInitialValues,
        ...localFormData,
      }
      formRef.current?.setFieldsValue(data)
      setUserName((await chrome.storage.local.get('userName')).userName)
    })()
  }, [userName])

  const onSubmit = async () => {
    await formRef.current?.validate()
    const formData = formRef.current?.getFieldsValue()
    console.log(formData)
    chrome.storage.local.set({
      [LOCAL_KEY_FORMDATA]: formData,
    })
  }

  function AppContent() {
    const envWhiteListStr = import.meta.env.VITE_APP_WHITE_LIST
    const whiteList: string[] | null = envWhiteListStr ? JSON.parse(envWhiteListStr) : null
    let text = '暂未开通权限'
    const isPastDue = Date.now() - parseInt(import.meta.env.VITE_APP_END_TIME) > 365 * 24 * 3600 * 1000 // 是否过期

    if (isPastDue) {
      text = '软件已过期'
    }

    if ((whiteList && !whiteList.includes(userName!)) || isPastDue) {
      return (
        <div style={{ color: 'red' }}>
          <span style={{ pointerEvents: 'none' }}>{text}！请联系v：</span>
          <span style={{ userSelect: 'all' }}>tk_0316q</span>
        </div>
      )
    }
    return (
      <div>
        <Form autoComplete="off" ref={formRef} labelCol={{ span: 7 }} wrapperCol={{ span: 17 }} onChange={onSubmit}>
          <FormItem label="最小价格" field="minPrice" rules={[{ required: true, message: '请填充数据' }]}>
            <InputNumber precision={0} style={{ width: '100%' }} placeholder={placeholder} />
          </FormItem>
          <FormItem label="最大价格" field="maxPrice" rules={[{ required: true, message: '请填充数据' }]}>
            <InputNumber precision={0} style={{ width: '100%' }} placeholder={placeholder} />
          </FormItem>
          <FormItem label="最小销量" field="minSalesQuantity" rules={[{ required: true, message: '请填充数据' }]}>
            <InputNumber style={{ width: '100%' }} placeholder={placeholder} />
          </FormItem>
          <FormItem label="最小商品数" field="minGoodsQuantity" rules={[{ required: true, message: '请填充数据' }]}>
            <InputNumber style={{ width: '100%' }} placeholder={placeholder} />
          </FormItem>
          <FormItem
            label="价格转换"
            field="isOpenPriceTransform"
            rules={[{ required: true, message: '请选择' }]}
            triggerPropName="checked"
          >
            <Switch type="line" />
          </FormItem>
          <div style={{ color: '#9a9a9a', fontSize: 14, padding: '5px 0', textAlign: 'center' }}>
            <span style={{ pointerEvents: 'none' }}>v：</span>
            <span style={{ userSelect: 'all' }}>tk_0316q</span>
          </div>
        </Form>
      </div>
    )
  }
  return <div className="App">{AppContent()}</div>
}

export default App
