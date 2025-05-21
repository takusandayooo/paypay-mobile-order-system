import React, { useEffect, useState } from "react";
import { FoodItemSchema, OderItemSchema } from "./common.schema";

interface OrderItem {
  item: FoodItemSchema;
  quantity: number;
}

const App: React.FC = () => {
  const [foodItems, setFoodItems] = useState<FoodItemSchema[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- 追加: 前回決済の merchantPaymentId ---
  const [lastMerchantPaymentId, setLastMerchantPaymentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        const res = await fetch("/foodItem");
        const data = await res.json();
        setFoodItems(data.foodItems);
      } catch (err) {
        console.error("Error fetching food items:", err);
      }
    };
    fetchFoodItems();

    // ローカルストレージから前回IDを取得
    const storedId = localStorage.getItem("merchantPaymentId");
    setLastMerchantPaymentId(storedId && storedId !== "null" ? storedId : null);
  }, []);

  // 数量変更
  const handleQuantityChange = (item: FoodItemSchema, quantity: number) => {
    if (quantity < 0) return;
    // 品切れ商品で、数量を増やす操作の場合は処理をスキップ
    if (item.isSoldOut && quantity > (getItemQuantity(item.id || ""))) return;
    
    const idx = orderItems.findIndex((o) => o.item.id === item.id);
    if (idx >= 0) {
      const updated = [...orderItems];
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      quantity === 0
        ? updated.splice(idx, 1)
        : (updated[idx].quantity = quantity);
      setOrderItems(updated);
    } else if (quantity > 0) {
      setOrderItems([...orderItems, { item, quantity }]);
    }
  };

  // 合計金額
  const calculateTotal = () =>
    orderItems.reduce((t, o) => t + o.item.amount * o.quantity, 0);

  // PayPay決済
  const handlePayWithPayPay = async () => {
    if (orderItems.length === 0) return;
    setIsProcessing(true);
    
    try {
      // 最新の商品情報を取得
      const response = await fetch("/foodItem");
      const foodItemData = await response.json();
      const latestFoodItems =FoodItemSchema.array().parse( foodItemData.foodItems);
      
      // 売り切れチェック
      const soldOutItems = orderItems.filter(orderItem => {
        const latestItem = latestFoodItems.find(item => item.id === orderItem.item.id);
        return latestItem && latestItem.isSoldOut;
      });
      
      // 売り切れアイテムがある場合、処理を中断
      if (soldOutItems.length > 0) {
        const soldOutNames = soldOutItems.map(item => item.item.name).join(", ");
        alert(`申し訳ございません。以下の商品は売り切れとなりました: ${soldOutNames}`);
        setIsProcessing(false);
        return;
      }
      
      const parsedOrderItems = OderItemSchema.array().parse(
        orderItems.map((o) => ({
          name: o.item.name,
          category: o.item.category,
          quantity: o.quantity,
          productId: o.item.productId,
          unitPrice: { amount: o.item.amount, currency: "JPY" },
        }))
      );

      const body = {
        amount: calculateTotal(),
        description: "食品の購入",
        orderItems: parsedOrderItems,
      };

      const res = await fetch("/cash_from_paypay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.resultInfo.code === "SUCCESS" && data.data.url) {
        // --- 追加: 決済IDを保存しておく ---
        if (data.data.merchantPaymentId) {
          localStorage.setItem(
            "merchantPaymentId",
            data.data.merchantPaymentId
          );
        }
        window.location.href = data.data.url; // PayPay QR
      } else {
        alert("決済処理に失敗しました。");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      alert("決済処理中にエラーが発生しました。");
      setIsProcessing(false);
    }
  };

  // 前回決済結果へ遷移
  const handleViewLastPaymentResult = () => {
    if (!lastMerchantPaymentId) return;
    window.location.href = `/paymentResult?merchantPaymentId=${lastMerchantPaymentId}`;
  };

  const getItemQuantity = (itemId: string) =>
    orderItems.find((o) => o.item.id === itemId)?.quantity ?? 0;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1>Food Items</h1>

      {foodItems.length === 0 ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* 商品リスト */}
          <ul style={{ listStyle: "none", padding: 0 }}>
            {foodItems.map((item) => {
              const q = item.id ? getItemQuantity(item.id) : 0;
              return (
                <li
                  key={item.id}
                  style={{
                    border: "1px solid #ddd",
                    padding: 10,
                    margin: "10px 0",
                    borderRadius: 5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <div>{item.category}</div>
                    <div>¥{item.amount}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => handleQuantityChange(item, q - 1)}
                      disabled={q === 0}
                      style={{ width: 30, height: 30 }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        margin: "0 10px",
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      {q}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item, q + 1)}
                      disabled={item.isSoldOut}
                      style={{ width: 30, height: 30 }}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* 合計 + アクションボタン */}
          <div
            style={{
              borderTop: "1px solid #ddd",
              marginTop: 20,
              paddingTop: 20,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0 }}>合計金額: ¥{calculateTotal()}</h2>

            {/* PayPay 決済ボタン */}
            <button
              onClick={handlePayWithPayPay}
              disabled={isProcessing || orderItems.length === 0}
              style={{
                padding: "10px 20px",
                backgroundColor: orderItems.length === 0 ? "#ccc" : "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                fontSize: 16,
                cursor: orderItems.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {isProcessing ? "処理中..." : "PayPayで支払う"}
            </button>

            {/* 追加: 前回決済結果ボタン */}
            <button
              onClick={handleViewLastPaymentResult}
              disabled={!lastMerchantPaymentId}
              style={{
                padding: "10px 20px",
                backgroundColor: !lastMerchantPaymentId ? "#ccc" : "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                fontSize: 16,
                cursor: !lastMerchantPaymentId ? "not-allowed" : "pointer",
              }}
            >
              前回の決済結果を見る
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
