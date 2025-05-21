import { z } from 'zod';
// オーダーするItemの型
export const OderItemSchema = z.object({
    name: z.string(),
    category: z.string(),
    quantity: z.number().int().positive(),
    productId: z.string(),
    unitPrice: z.object({
        amount: z.number().int().positive(),
        currency: z.literal('JPY')
    })
});
export type OderItemSchema = z.infer<typeof OderItemSchema>;

// PayPayのQRコードの作成レスポンスの型

//NOTE: レスポンスにはunitPriceではなくunit_priceが含まれるため変更する
const OrderItemResponseSchema = OderItemSchema
    .omit({ unitPrice: true }) // unitPrice を削除
    .extend({
        unit_price: z.object({
            amount: z.number().int().positive(),
            currency: z.literal('JPY'),
        }),
    });
type OrderItemResponseSchema = z.infer<typeof OrderItemResponseSchema>;
export const PaypayQRCodeResponseSchema = z.object({
    resultInfo: z.object({
        code: z.string(),
        message: z.string(),
        codeId: z.string(),
    }),
    data: z.object({
        codeId: z.string(),
        url: z.string(),
        expiryDate: z.number(),
        merchantPaymentId: z.string(),
        amount: z.object({
            amount: z.number().int().positive(),
            currency: z.literal('JPY'),
        }),
        orderDescription: z.string(),
        orderItems: z.array(OrderItemResponseSchema),
        codeType: z.string(),
        requestedAt: z.number(),
        redirectUrl: z.string(),
        redirectType: z.string(),
        isAuthorization: z.boolean(),
        deeplink: z.string()
    })
});
export type PaypayQRCodeResponseSchema = z.infer<typeof PaypayQRCodeResponseSchema>;

//　Firebaseに登録されている食べ物の情報の型
export const FoodItemSchema = z.object({
    name: z.string(),
    category: z.string(),
    productId: z.string(),
    amount: z.number().int().positive(),
});
export type FoodItemSchema = z.infer<typeof FoodItemSchema>;

// firebaseに客がオーダーした情報を登録する型
export const CustomerOrderDataSchema = z.object({
    merchantPaymentId: z.string(),
    orderCallStatus: z.enum(['not_called', 'called', 'received', "not_cashed"]),
    amount: z.number().int().positive(),
    orderItems: z.array(OderItemSchema),
    orderTime: z.string(),
});
export type CustomerOrderDataSchema = z.infer<typeof CustomerOrderDataSchema>;



