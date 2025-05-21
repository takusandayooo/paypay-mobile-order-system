import { z } from "zod";

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
export const CustomerOrderDataSchema = z.object({
    merchantPaymentId: z.string(),
    orderCallStatus: z.enum(['not_called', 'called', 'received', "not_cashed"]),
    amount: z.number().int().positive(),
    orderItems: z.array(OderItemSchema),
    orderTime: z.string(),
});
export type CustomerOrderDataSchema = z.infer<typeof CustomerOrderDataSchema>;
//Firebaseに登録されている食べ物の情報の型
export const FoodItemSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    category: z.string(),
    productId: z.string(),
    amount: z.number().int().positive(),
});
export type FoodItemSchema = z.infer<typeof FoodItemSchema>;

