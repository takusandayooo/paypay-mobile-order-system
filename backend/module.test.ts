import puppeteer from 'puppeteer';
import { OderItemSchema } from "./src/common.schema";
import { createPaypayQRCode, getPaypayPaymentStatus, } from "./src/paypay";
import { PaypayQRCodeResponseSchema, FoodItemSchema } from "./src/common.schema";

import { db, addCustomerOrderData, updateOrderCallStatus, getCustomerAllOrderData } from "./src/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

import { getFoodItems } from "./src/firebase";
// .env.testingの設定を読み込む
import dotenv from 'dotenv';
dotenv.config({ path: '.env.testing' });
const phoneNumber = process.env.PAYPAY_SANDBOX_TEST_USER_PHONE || '';
const password = process.env.PAYPAY_SANDBOX_TEST_USER_PASSWORD || '';
jest.setTimeout(30000);

// テストに必要な関数
const paypayUIInput = async (phoneNumber: string, password: string, paypayUrl: string) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    try {
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
    } catch (error) {
        console.error("Paypay UIへの入力中にエラーが発生しました:", error);
    } finally {
        await browser.close();
    }
}
// beforeAllやafterAllで必要な関数を作成する
// フードアイテムを追加する関数
export const addFoodItem = async (data: FoodItemSchema) => {
    const foodItemsCollection = collection(db, "food");
    try {
        const foodDocRef = doc(foodItemsCollection);
        await setDoc(foodDocRef, data);
        return { statusCode: 200, message: "フードアイテムを追加できました。" };
    } catch (error) {
        console.error("Error adding food item: ", error);
        return { statusCode: 500, message: "エラーが発生しました。" };
    }
}
// フードアイテムを削除する関数
export const deleteFoodItem = async (id: string) => {
    const foodDocRef = doc(db, "food", id);
    try {
        await setDoc(foodDocRef, {});
        return { statusCode: 200, message: "フードアイテムを削除できました。" };
    } catch (error) {
        console.error("Error deleting food item: ", error);
        return { statusCode: 500, message: "エラーが発生しました。" };
    }
}

const testMerchantPaymentId: string = `test_merchant_payment_id${Date.now()}`;
const testMerchantPaymentId2: string = `test_merchant_payment_id2${Date.now()}`
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
describe("PaypayPayment", () => {
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
        const response = await createPaypayQRCode(testMerchantPaymentId2, testOrderDescription, testOrderItems, testAmount, testRedirectUrl);
        expect(response.statusCode).toBe(201);
        const parsedResponse = PaypayQRCodeResponseSchema.parse(response.responseData);
        expect(parsedResponse.data.merchantPaymentId).toBe(testMerchantPaymentId2);
        await paypayUIInput(phoneNumber, password, parsedResponse.data.url);
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

describe("getFoodItems", () => {
    const foodItem = {
        name: "Test Food Item 1",
        category: "Test Category",
        productId: "test_product_1",
        amount: 1000,
        isSoldOut: false
    }
    const productId = "test_product_1";
    beforeAll(async () => {
        addFoodItem(foodItem)
    });
    it("Firebaseから食べ物のアイテムを取得できる", async () => {
        const foodItems = await getFoodItems();
        expect(foodItems).toBeDefined();
        expect(Array.isArray(foodItems)).toBe(true);
        foodItems.filter((item) => item.data.productId === productId).forEach((item) => {
            expect(item.data.name).toBe(foodItem.name);
            expect(item.data.category).toBe(foodItem.category);
            expect(item.data.productId).toBe(foodItem.productId);
            expect(item.data.amount).toBe(foodItem.amount);
            expect(item.data.isSoldOut).toBe(foodItem.isSoldOut);
        }
        );
    });
    afterAll(async () => {
        // 必要な後処理があればここに記述
        await deleteFoodItem(productId);
    });
});
describe("getCustomerAllOrderDataとaddCustomerOrderData & updateOrderCallStatus", () => {
    it("オーダー情報をFirebaseに追加できる", async () => {
        const result = await addCustomerOrderData(
            testMerchantPaymentId,
            "not_called",
            1000,
            testOrderItems,
            new Date().toISOString()
        );
        expect(result.statusCode).toBe(200);
        expect(result.message).toBe("オーダデータを作成することができました。");
    });
    it("Firebaseからオーダー情報を取得できる", async () => {
        const orderItems = await getCustomerAllOrderData();
        expect(orderItems).toBeDefined();
        expect(Array.isArray(orderItems)).toBe(true);
        const orderItem = orderItems.find(item => item.customerOrderData.merchantPaymentId === testMerchantPaymentId);
        expect(orderItem).toBeDefined();
    });
    it("同じmerchantPaymentIdでオーダー情報を追加しようとするとエラーになる", async () => {
        const result = await addCustomerOrderData(
            testMerchantPaymentId,
            "not_called",
            1000,
            testOrderItems,
            new Date().toISOString()
        );
        expect(result.statusCode).toBe(409);
        expect(result.message).toBe("オーダIDは既に存在しています。");
    });
    it("オーダー情報のステータスを更新できる", async () => {
        const result = await updateOrderCallStatus(testMerchantPaymentId, "called");
        expect(result.statusCode).toBe(200);
        expect(result.message).toBe("オーダのステータスを変更できました。");
        const OderItems = await getCustomerAllOrderData();
        const orderItem = OderItems.find(item => item.customerOrderData.merchantPaymentId === testMerchantPaymentId);
        expect(orderItem).toBeDefined();
        expect(orderItem?.customerOrderData.orderCallStatus).toBe("called");
    });

    afterAll(async () => {
        // テスト用のオーダー情報を削除
        const orderDocRef = doc(db, "orderItems", testMerchantPaymentId);
        await setDoc(orderDocRef, {});
        const orderDocRef2 = doc(db, "orderItems", testMerchantPaymentId2);
        await setDoc(orderDocRef2, {});
    })
});
