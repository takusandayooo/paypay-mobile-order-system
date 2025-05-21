import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc } from "firebase/firestore";
import { FoodItemSchema, CustomerOrderDataSchema } from './common.schema';


// Firebaseの初期化
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth };
//パスワード認証のための関数
export const emailAndPasswordSign = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { status: 'success', userCredential: userCredential };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return { status: 'error', message: 'ログインに失敗しました。' };
  }
};

// orderCallStatusを更新する関数
export const updateOrderCallStatus = async (merchantPaymentId: string, orderCallStatus: string) => {
  const orderDocRef = doc(db, "orderItems", merchantPaymentId);
  try {
    await updateDoc(orderDocRef, { orderCallStatus });
    console.log("Document updated with ID: ", merchantPaymentId);
    return { statusCode: 200, message: "オーダのステータスを変更できました。" };
  } catch (error) {
    console.error("Error updating order call status: ", error);
    return { statusCode: 500, message: "エラーが発生しました。" };
  }
}

// フードのアイテムを取得する関数
export const getFoodItems = async () => {
  const foodItemsCollection = collection(db, "food");
  const foodItemsSnapshot = await getDocs(foodItemsCollection);
  const foodItems = foodItemsSnapshot.docs.map((doc) => ({
    id: doc.id,
    data: FoodItemSchema.parse(doc.data()), // プロパティ名を追加
  }));
  return foodItems;
};
// フードアイテムを変更する関数
export const updateFoodItem = async (id: string, data: FoodItemSchema) => {
  const foodDocRef = doc(db, "food", id);
  try {
    await updateDoc(foodDocRef, data);
    console.log("Document updated with ID: ", id);
    return { statusCode: 200, message: "フードアイテムを変更できました。" };
  } catch (error) {
    console.error("Error updating food item: ", error);
    return { statusCode: 500, message: "エラーが発生しました。" };
  }
}
// フードアイテムを追加する関数
export const addFoodItem = async (data: FoodItemSchema) => {
  const foodItemsCollection = collection(db, "food");
  try {
    const foodDocRef = doc(foodItemsCollection);
    await setDoc(foodDocRef, data);
    console.log("Document added with ID: ", foodDocRef.id);
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
    console.log("Document deleted with ID: ", id);
    return { statusCode: 200, message: "フードアイテムを削除できました。" };
  } catch (error) {
    console.error("Error deleting food item: ", error);
    return { statusCode: 500, message: "エラーが発生しました。" };
  }
}
// firebaseに登録されているオーダー情報を取得する関数
export const getCustomerAllOrderData = async () => {
  const orderItemsCollection = collection(db, "orderItems");
  const orderItemsSnapshot = await getDocs(orderItemsCollection);
  const orderItems = orderItemsSnapshot.docs.map((doc) => ({
    id: doc.id,
    customerOrderData: CustomerOrderDataSchema.parse(doc.data()),
  }));
  return orderItems;
}


