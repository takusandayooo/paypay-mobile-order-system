import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { createPaypayQRCode, getPaypayPaymentStatus } from './src/paypay';
import { getFoodItems,addCustomerOrderData,updateOrderCallStatus,getCustomerAllOrderData} from './src/firebase';
import { OderItemSchema } from './src/common.schema';


const app = express();
const PORT = 3000;



// JSONボディのパースを有効化
app.use(express.json());

// フロントエンドの静的ファイルを配信
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/paymentResult', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/paymentResult.html'));
});
app.get("/callNumberDisplay", (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/callNumberDisplay.html'));
});
app.get("/ownerPage", (req, res) =>
  res.sendFile(path.join(__dirname, '../client/dist/ownerPage.html'))
);

// 商品一覧を表示するエンドポイント
app.get('/foodItem', async (req: Request, res: Response) => {
  const foodItems = await getFoodItems();
  res.json({ foodItems });
});

// PayPayでの決済用QRコードを生成するエンドポイント
app.post('/cash_from_paypay', async (req: Request, res: Response) => {
  const { amount, description, orderItems } = req.body;

  // 一意の merchantPaymentId を生成
  const merchantPaymentId = `MERCHPAYID_${uuidv4()}`;

  // 決済完了後のリダイレクトURLを生成
  const redirectUrl = `${req.protocol}://${req.get('host')}/paymentResult?merchantPaymentId=${merchantPaymentId}`;
  try {
    const parsedOderItems=OderItemSchema.array().parse(orderItems);
    const response = await createPaypayQRCode(
      merchantPaymentId,
      description,
      parsedOderItems,
      amount,
      redirectUrl
    );

    if (response && response.responseData && response.responseData.data.url) {
      const addCustomerOrderDataResponse = await addCustomerOrderData(
        merchantPaymentId,
        "not_cashed",
        amount,
        parsedOderItems,
        new Date().toISOString(),
      );
      if (addCustomerOrderDataResponse.statusCode !== 200) {
        console.error(`Firebaseへのデータ追加に失敗: ${addCustomerOrderDataResponse.message}`);
        res.status(500).json({
          resultInfo: { code: 'FIREBASE_ERROR', message: addCustomerOrderDataResponse.message }
        });
      }
      res.status(200).json({
        resultInfo: { code: 'SUCCESS' },
        data: {
          url: response?.responseData?.data.url,
          merchantPaymentId           // ← 追加
        }
      });
    } else {
      const errorMessage = response?.responseData?.resultInfo?.message || 'PayPay API error';
      console.error(`PayPay API Error Response: ${JSON.stringify(response)}`);
      res.status(500).json({
        resultInfo: { code: 'PAYPAY_API_ERROR', message: errorMessage }
      });
    }
  } catch (error) {
    console.error(`Error calling PayPay API: ${error}`);
    res.status(500).json({ resultInfo: { code: 'INTERNAL_SERVER_ERROR', message: String(error) } });
  }
});

// 決済完了後のステータスを確認するエンドポイント
app.post('/get_payment_status', async (req: Request, res: Response) => {
  const { merchantPaymentId } = req.body;

  try {
    const paymentStatus = await getPaypayPaymentStatus(merchantPaymentId);
    
    // 決済ステータスを取得
    let status = 'unknown';
    let message = '決済ステータスが不明です。';
    
    if (paymentStatus.status === 'COMPLETED') {
      status = 'completed';
      message = '決済が完了しました。';
      // FirebaseにorderStatusを変更
      const orderStatus="not_called";
      const updateOrderCallStatusResponse = await updateOrderCallStatus(merchantPaymentId,orderStatus);
      console.info('オーダーステータスの変更が成功しました:', updateOrderCallStatusResponse);
    } else if (paymentStatus.status === 'CANCELED') {
      status = 'canceled';
      message = '決済がキャンセルされました。';
    } else if (paymentStatus.status === 'FAILED') {
      status = 'failed';
      message = '決済が失敗しました。';
    }
    // Firebaseに決済情報を保存

    res.json({
      status,
      message,
      merchantPaymentId
    });
  } catch (error) {
    console.error(`Error getting payment status: ${error}`);
    res.status(500).json({ status: 'error', message: '決済情報の取得に失敗しました。' });
  }
});

app.get("/get_order_data", async (req: Request, res: Response) => {
  const orderData = await getCustomerAllOrderData();
  // orderCallStatusが"not_calledとreceivedのみのデータを取得
  const filteredOrderData = orderData.filter((order) => {
    return order.customerOrderData.orderCallStatus === "not_called" || order.customerOrderData.orderCallStatus === "called";
  });
  const simplifiedOrderData = filteredOrderData.map((order) => ({
    merchantPaymentId: order.customerOrderData.merchantPaymentId,
    orderCallStatus: order.customerOrderData.orderCallStatus,
  }));
  res.json({ simplifiedOrderData });
});
  

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} でサーバー起動中`);
});