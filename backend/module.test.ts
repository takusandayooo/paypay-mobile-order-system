import puppeteer, { Browser, Page } from 'puppeteer';
import { OderItemSchema } from "./src/common.schema";
import { createPaypayQRCode, getPaypayPaymentStatus, } from "./src/paypay";
import { PaypayQRCodeResponseSchema, FoodItemSchema } from "./src/common.schema";

import { addCustomerOrderData, updateOrderCallStatus, getCustomerAllOrderData } from "./src/firebase";

import { getFoodItems } from "./src/firebase";
// .env.testingの設定を読み込む
import dotenv from 'dotenv';
dotenv.config({ path: '.env.testing' });
const phoneNumber = process.env.PAYPAY_SANDBOX_TEST_USER_PHONE || '';
const password = process.env.PAYPAY_SANDBOX_TEST_USER_PASSWORD || '';


// export const testPaypayPaymentStatus = async () => {
//     const testMerchantPaymentId = "test_merchant_payment_id1747579872367";
//     const testPaymentStatus = await getPaypayPaymentStatus(testMerchantPaymentId);
//     if (testPaymentStatus.status === "ERROR") {
//         console.error(`決済情報の取得に失敗しました: ${testPaymentStatus.message}`);
//         return;
//     }
//     console.log(testPaymentStatus);
// }


// export const testFirebase = async () => {
//     const foodItems = await getFoodItems();

//     // 取得したデータを検証
//     foodItems.forEach((item) => {
//         const parsedItem = FoodItemSchema.parse(item);
//         console.log(parsedItem);
//     });
// }

// export const testAddCustomerOrderData = async () => {
//     const result = await addCustomerOrderData(
//         "test_merchant_payment_id",
//         "not_called",
//         1000,
//         [
//             {
//                 name: "Test Item 1",
//                 category: "Test Category",
//                 quantity: 1,
//                 productId: "test_product_1",
//                 unitPrice: {
//                     amount: 1000,
//                     currency: "JPY" as const
//                 }
//             }
//         ],
//         "2023-10-01T00:00:00Z"
//     );
//     if (result.statusCode !== 200) {
//         console.error(`オーダー情報の追加に失敗しました: ${result.message}`);
//         return;
//     }
//     console.log(result);
// }
// // const a=testPaypayPayment();
// console.log(a);

// テストを実行 NOTE: このようにすると、テストが終わった後にプロセスが終了する
// testFirebase().finally(() => {
//   process.exit(0);
// });
jest.setTimeout(30000);

const paypayUIInput = async (phoneNumber: string, password: string, paypayUrl: string) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // 対象のページにアクセス
    await page.goto(paypayUrl, {
        waitUntil: 'networkidle0',
    });

    // iframe を取得
    const iframeElement = await page.waitForSelector('iframe');
    const frame = await iframeElement?.contentFrame();
    if (!frame) {
        console.error('iframe が見つかりませんでした。');
        await browser.close();
        return;
    }
    // 電話番号を入力
    const phoneSelector = 'input[type="tel"][placeholder="登録済みの携帯電話番号"]';
    await frame.waitForSelector(phoneSelector, { visible: true });
    await frame.type(phoneSelector, phoneNumber);

    // パスワードを入力
    const passwordSelector = 'input[type="password"][placeholder="パスワード"]';
    await frame.waitForSelector(passwordSelector, { visible: true });
    await frame.type(passwordSelector, password);

    // 「同意してログイン」ボタンをクリック
    const loginButtonSelector = 'button[class*="submit-button"]';
    await frame.waitForSelector(loginButtonSelector, { visible: true });
    await frame.click(loginButtonSelector);
    await new Promise(resolve => setTimeout(resolve, 5000));

    //TODO: 決済を完了させるための処理を追
    await frame.waitForSelector('input.input[autocomplete="one-time-code"][tabindex="0"]', { visible: true });
    const otpInputs = await frame.$$(`input.input[type="tel"]`);

    const otp = '1234';
    for (let i = 0; i < otp.length; i++) {
        const input = otpInputs[i];
        await input.focus();
        await input.type(otp[i]);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));

    await page.screenshot({ path: 'after_login_click.png' });

    await browser.close();
}

const testMerchantPaymentId: string = `test_merchant_payment_id${Date.now()}`;
const testMerchantPaymentId2: string = `test_merchant_payment_id2${Date.now()}`
describe("PaypayPayment", () => {
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
    const testOrderDescription = "Test Order Description";
    const testAmount = 5000;
    const testRedirectUrl = "https://example.com/redirect";
    it("成功する場合のテスト", async () => {
        const response = await createPaypayQRCode(testMerchantPaymentId, testOrderDescription, testOrderItems, testAmount, testRedirectUrl);
        expect(response.statusCode).toBe(201);
        const parsedResponse = PaypayQRCodeResponseSchema.parse(response.responseData);
        expect(parsedResponse.data.merchantPaymentId).toBe(testMerchantPaymentId);
    });
    it("再度成功する場合のテスト", async () => {
        console.log(testMerchantPaymentId2);
        const response = await createPaypayQRCode(testMerchantPaymentId2, testOrderDescription, testOrderItems, testAmount, testRedirectUrl);
        expect(response.statusCode).toBe(201);
        const parsedResponse = PaypayQRCodeResponseSchema.parse(response.responseData);
        expect(parsedResponse.data.merchantPaymentId).toBe(testMerchantPaymentId2);
        console.log("QRコードのURL:", parsedResponse.data.url);
        await paypayUIInput(phoneNumber, password, parsedResponse.data.url).then(() => {
            console.log("Paypay UIに入力しました。");
        }
        ).catch((error) => {
            console.error("Paypay UIへの入力に失敗しました:", error);
        }
        );

    });
});
describe("PaypayPaymentStatus", () => {
    it("ステータスがAUTHORIZEDの場合", async () => {
        const response = await getPaypayPaymentStatus(testMerchantPaymentId);
        expect(response.status).toBe("CREATED");
        expect(response.message).toBe("決済が作成されましたが、まだ完了していません。");
    });
    it("ステータスがCOMPLETEDの場合", async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(testMerchantPaymentId2);
        const response = await getPaypayPaymentStatus(testMerchantPaymentId2);
        expect(response.status).toBe("COMPLETED");
        expect(response.message).toBe("決済が完了しました。");
    });
    it("存在しないmerchantPaymentIdの場合", async () => {
        const response = await getPaypayPaymentStatus("non_existent_merchant_payment_id");
        expect(response.status).toBe("ERROR");
        expect(response.message).toBe("決済情報の取得に失敗しました。");
    });
});


