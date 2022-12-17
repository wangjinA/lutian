import { Button, Form, FormInstance, InputNumber, Switch } from "@arco-design/web-react";
import FormItem from "@arco-design/web-react/es/Form/form-item";
import { useEffect, useRef } from "react";
import "./App.less";
const LOCAL_KEY_FORMDATA = "configFormData"; // 配置

const placeholder = "请输入";
const formInitialValues = {
  minPrice: 100,
  maxPrice: 99999,
  minSalesQuantity: 5,
  minGoodsQuantity: 3000,
  isOpenPriceTransform: true,
};
function App() {
  const formRef = useRef<FormInstance>(null);

  useEffect(() => {
    (async () => {
      const localFormData: IFormInitialValues = (await chrome.storage.local.get([LOCAL_KEY_FORMDATA]))[LOCAL_KEY_FORMDATA];
      formRef.current?.setFieldsValue({
        ...formInitialValues,
        ...localFormData,
      });
    })();
  }, []);

  const onSubmit = async () => {
    await formRef.current?.validate();
    const formData = formRef.current?.getFieldsValue();
    console.log(formData);
    chrome.storage.local.set({
      [LOCAL_KEY_FORMDATA]: formData,
    });
  };
  return (
    <div className="App">
      <div>
        <Form autoComplete="off" ref={formRef} labelCol={{ span: 7 }} wrapperCol={{ span: 17 }} onChange={onSubmit}>
          <FormItem label="最小价格" field="minPrice" rules={[{ required: true, message: "请填充数据" }]}>
            <InputNumber precision={0} style={{ width: "100%" }} placeholder={placeholder} />
          </FormItem>
          <FormItem label="最大价格" field="maxPrice" rules={[{ required: true, message: "请填充数据" }]}>
            <InputNumber precision={0} style={{ width: "100%" }} placeholder={placeholder} />
          </FormItem>
          <FormItem label="最小销量" field="minSalesQuantity" rules={[{ required: true, message: "请填充数据" }]}>
            <InputNumber style={{ width: "100%" }} placeholder={placeholder} />
          </FormItem>
          <FormItem label="最小商品数" field="minGoodsQuantity" rules={[{ required: true, message: "请填充数据" }]}>
            <InputNumber style={{ width: "100%" }} placeholder={placeholder} />
          </FormItem>
          <FormItem label="价格转换" field="isOpenPriceTransform" rules={[{ required: true, message: "请选择" }]} triggerPropName='checked'>
            <Switch type="line" />
          </FormItem>
        </Form>
        {/* <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
          <Button type="primary" onClick={onSubmit}>
            保存
          </Button>
        </div> */}
      </div>
    </div>
  );
}

export default App;
