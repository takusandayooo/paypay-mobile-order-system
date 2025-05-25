import PAYPAY, {
    GetCodePaymentDetails,
    QRCodeCreate,
    PaymentCancel
} from '@paypayopa/paypayopa-sdk-node';

import { OderItemSchema, PaypayQRCodeResponseSchema } from './common.schema';
import { getConfig } from './config';
const config = getConfig();

PAYPAY.Configure({
    clientId: config.PAYPAY_API_KEY!,
    clientSecret: config.PAYPAY_API_SECRET!,
    merchantId: config.PAYPAY_MERCHANT_ID!,
    env: 'STAGING',          // ← sandbox。実運用は 'PROD'
});

// PaypayのQRコードを作成して、QRコードのURLを取得する関数
//型ガートでpapyaのレスポンスを確認する、型ガードをしないとHttpsClientSuccess | HttpsClientErrorでBODYがundefinedになる
function isQRCodeCreateSuccess(response: any): response is { STATUS: number; BODY: any } {
    return response && typeof response.STATUS === 'number' && response.BODY !== undefined && response.BODY.data !== undefined;
}
export const createPaypayQRCode = async (merchantPaymentId: string, orderDescription: string, orderItems: OderItemSchema[], amount: number, redirectUrl: string) => {
    const payload = {
        merchantPaymentId,
        amount: { amount, currency: 'JPY' },
        codeType: 'ORDER_QR',
        orderDescription,
        isAuthorization: false,
        redirectUrl,
        redirectType: 'WEB_LINK',
        orderItems,
        requestedAt: Math.floor(Date.now() / 1000),
    };

    const response = await QRCodeCreate(payload);
    if (!isQRCodeCreateSuccess(response) || response.STATUS !== 201) {
        return { statusCode: 500, data: 'QRコードの作成に失敗しました。' }
    }
    const parsedResponse = PaypayQRCodeResponseSchema.parse(response.BODY);
    return { statusCode: response.STATUS, responseData: parsedResponse };
};

// merchantPaymentIdから決済のステータスを取得する関数
// 型ガートでpapyaのレスポンスを確認する、型ガードをしないとHttpsClientSuccess | HttpsClientErrorでBODYがundefinedになる
function isHttpsClientSuccess(response: any): response is { STATUS: number; BODY: { data: { status: string } } } {
    return response && typeof response.STATUS === 'number' && response.BODY !== undefined && response.BODY.data !== undefined;
}
export const getPaypayPaymentStatus = async (merchantPaymentId: string): Promise<{ status: string, message: string }> => {
    try {
        const response = await GetCodePaymentDetails([merchantPaymentId]);
        console.log(response);
        if (!isHttpsClientSuccess(response) || response.STATUS !== 200) {
            throw new Error(`決済情報の取得に失敗: ${response}`);
        }
        if (response.BODY && response.BODY.data && response.BODY.data.status) {
            const status = response.BODY?.data?.status ?? 'UNKNOWN';
            if (status === "COMPLETED") {
                return { "status": "COMPLETED", "message": "決済が完了しました。" };
            } else if (status === "AUTHORIZED") {
                return { "status": "AUTHORIZED", "message": "決済が承認されましたが、まだ完了していません。" };
            } else if (status === "CANCELED") {
                return { "status": "CANCELED", "message": "決済がキャンセルされました。" };
            } else if (status === "FAILED") {
                return { "status": "FAILED", "message": "決済が失敗しました。" };
            }else if (status === "CREATED") {
                return { "status": "CREATED", "message": "決済が作成されましたが、まだ完了していません。" };
            } else {
                return { "status": status, "message": `決済のステータス: ${status}` };
            }
        }
        return { "status": "UNKNOWN", "message": "決済ステータスを取得できませんでした。" };
    } catch (error) {
        return { "status": "ERROR", "message": "決済情報の取得に失敗しました。" };
    }
}
