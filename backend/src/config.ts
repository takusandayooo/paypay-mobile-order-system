import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const ConfigSchema = z.object({
    PAYPAY_API_KEY: z.string(),
    PAYPAY_API_SECRET: z.string(),
    PAYPAY_MERCHANT_ID: z.string(),
    FIREBASE_API_KEY: z.string(),
    FIREBASE_AUTH_DOMAIN: z.string(),
    FIREBASE_PROJECT_ID: z.string(),
    FIREBASE_STORAGE_BUCKET: z.string(),
    FIREBASE_MESSAGING_SENDER_ID: z.string(),
    FIREBASE_APP_ID: z.string(),
});
export type ConfigSchema = z.infer<typeof ConfigSchema>;

let config: ConfigSchema;
export const getConfig = (): ConfigSchema => {
    if (!config) {
        config = ConfigSchema.parse({
            PAYPAY_API_KEY: process.env.PAYPAY_API_KEY,
            PAYPAY_API_SECRET: process.env.PAYPAY_API_SECRET,
            PAYPAY_MERCHANT_ID: process.env.PAYPAY_MERCHANT_ID,
            FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
            FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
            FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
            FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
            FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        });
    }
    return config;
};