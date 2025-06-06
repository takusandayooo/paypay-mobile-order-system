// Firebaseを用いてデータを編集したり取得したりするための関数を定義する
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { getConfig } from "./config";
import { CustomerOrderDataSchema, OderItemSchema, FoodItemSchema } from "./common.schema";



const config = getConfig();
// Firebaseの初期化
const firebaseConfig = {
  apiKey: config.FIREBASE_API_KEY,
  authDomain: config.FIREBASE_AUTH_DOMAIN,
  projectId: config.FIREBASE_PROJECT_ID,
  storageBucket: config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
  appId: config.FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);//NOTE: module.test.tsでdbを使用するためにexportする

export const getFoodItems = async () => {
  const foodItemsCollection = collection(db, "food");
  const foodItemsSnapshot = await getDocs(foodItemsCollection);

  const foodItems = foodItemsSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      if (Object.keys(data).length === 0) {
        return null;
      }
      try {
        return {
          id: doc.id,
          data: FoodItemSchema.parse(data)
        };
      } catch (error) {
        console.error(`ドキュメント ${doc.id} の検証エラー:`, error);
        return null;
      }
    })
    .filter(item => item !== null);
  return foodItems;
};
//オーダーしたアイテムをFirebaseに登録する関数
export const addCustomerOrderData = async (
  merchantPaymentId: string,
  orderCallStatus: string,
  amount: number,
  orderItems: OderItemSchema[],
  orderTime: string
) => {
  const orderItemsCollection = collection(db, "orderItems");
  const orderData = {
    merchantPaymentId,
    orderCallStatus,
    amount,
    orderItems,
    orderTime
  };
  const parsedOrderData = CustomerOrderDataSchema.parse(orderData);
  try {
    const orderDocRef = doc(orderItemsCollection, merchantPaymentId);
    const existingDoc = await getDoc(orderDocRef);
    if (existingDoc.exists()) {
      return { statusCode: 409, message: "オーダIDは既に存在しています。" };
    }
    await setDoc(orderDocRef, parsedOrderData);
    return { statusCode: 200, message: "オーダデータを作成することができました。" };
  } catch (error) {
    console.error("Error adding order data: ", error);
    return { statusCode: 500, message: "エラーが発生しました。" };
  }
};
// orderCallStatusを更新する関数
export const updateOrderCallStatus = async (merchantPaymentId: string, orderCallStatus: string) => {
  const orderDocRef = doc(db, "orderItems", merchantPaymentId);
  try {
    await updateDoc(orderDocRef, { orderCallStatus });
    return { statusCode: 200, message: "オーダのステータスを変更できました。" };
  } catch (error) {
    console.error("Error updating order call status: ", error);
    return { statusCode: 500, message: "エラーが発生しました。" };
  }
}

// firebaseに登録されているオーダー情報を取得する関数
export const getCustomerAllOrderData = async () => {
  const orderItemsCollection = collection(db, "orderItems");
  const orderItemsSnapshot = await getDocs(orderItemsCollection);

  const orderItems = orderItemsSnapshot.docs.map((doc) => {
    const rawData = doc.data();
    if (Object.keys(rawData).length === 0) {
      return null;
    }
    try {
      return {
        id: doc.id,
        customerOrderData: CustomerOrderDataSchema.parse(rawData),
      };
    } catch (error) {
      console.error(`ドキュメント ${doc.id} の検証エラー:`, error);
      return null;
    }
  }).filter(item => item !== null);

  return orderItems;
};

