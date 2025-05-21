import { OderItemSchema } from "./src/common.schema";
import { createPaypayQRCode, getPaypayPaymentStatus ,} from "./src/paypay";
import { PaypayQRCodeResponseSchema, FoodItemSchema } from "./src/common.schema";

import{addCustomerOrderData,updateOrderCallStatus,getCustomerAllOrderData} from "./src/firebase";

import { getFoodItems } from "./src/firebase";

// テスト用の決済を行う関数
export const testPaypayPayment = async () => {
    // テスト用の購入品の情報を作成
    const testOrderItems: OderItemSchema[] = [
        {
            name: "Test Item 1",
            category: "Test Category",
            quantity: 1,
            productId: "test_product_1",
            unitPrice: {
                amount: 1000,
                currency: "JPY" as const
            }
        },
        {
            name: "Test Item 2",
            category: "Test Category",
            quantity: 2,
            productId: "test_product_2",
            unitPrice: {
                amount: 2000,
                currency: "JPY" as const
            }
        }
    ];
    // テスト用の決済を行う
    const testMerchantPaymentId = `test_merchant_payment_id${Date.now()}`;
    const testOrderDescription = "Test Order Description";
    const testAmount = 5000;
    const testRedirectUrl = "https://example.com/redirect";
    const testQrCodeResponse=await createPaypayQRCode(testMerchantPaymentId, testOrderDescription, testOrderItems, testAmount, testRedirectUrl);
    if (testQrCodeResponse.statusCode !== 201 || !testQrCodeResponse.data) {
        console.error(`QRコードの作成に失敗しました: ${testQrCodeResponse.data}`);
        return;
    }
    const parsedQrCodeResponse = PaypayQRCodeResponseSchema.parse(testQrCodeResponse.data);
    console.log(parsedQrCodeResponse);
    //決済を終わらせる
    // const testPaymentStatusCompleted = await getPaypayPaymentStatus("");// ここに決済済みのmerchantPaymentIdを入れる
    // console.log(testPaymentStatusCompleted);// { status: 'COMPLETED', message: '決済が完了しました。' }
}

export const testPaypayPaymentStatus = async () => {
    const testMerchantPaymentId = "test_merchant_payment_id1747579872367";
    const testPaymentStatus = await getPaypayPaymentStatus(testMerchantPaymentId);
    if (testPaymentStatus.status === "ERROR") {
        console.error(`決済情報の取得に失敗しました: ${testPaymentStatus.message}`);
        return;
    }
    console.log(testPaymentStatus);
}


export const testFirebase = async () => {
    const foodItems = await getFoodItems();

    // 取得したデータを検証
    foodItems.forEach((item) => {
        const parsedItem = FoodItemSchema.parse(item);
        console.log(parsedItem);
    });
}

export const testAddCustomerOrderData= async () => {
    const result = await addCustomerOrderData(
        "test_merchant_payment_id",
        "not_called",
        1000,
        [
            {
                name: "Test Item 1",
                category: "Test Category",
                quantity: 1,
                productId: "test_product_1",
                unitPrice: {
                    amount: 1000,
                    currency: "JPY" as const
                }
            }
        ],
        "2023-10-01T00:00:00Z"
    );
    if (result.statusCode !== 200) {
        console.error(`オーダー情報の追加に失敗しました: ${result.message}`);
        return;
    }
    console.log(result);
}

getCustomerAllOrderData().finally(() => {
    process.exit(0);
});
// const a=testPaypayPayment();
// console.log(a);

// テストを実行 NOTE: このようにすると、テストが終わった後にプロセスが終了する
// testFirebase().finally(() => {
//   process.exit(0);
// });


