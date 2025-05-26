import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { db } from "./firebase"; // Firebaseの初期化を行ったファイルからdbをインポート

interface OrderData {
  merchantPaymentId: string;
  orderCallStatus: "not_called" | "called" | "received" | "not_cashed";
}

const CallNumberDisplay = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);

  const notCalled = orders.filter(
    (order) => order.orderCallStatus === "not_called"
  );
  const called = orders.filter((order) => order.orderCallStatus === "called");

  useEffect(() => {
    // ordersコレクションへの参照を作成
    const ordersRef = collection(db, "orderItems");

    // リアルタイムリスナーを設定
    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        try {
          const ordersData = snapshot.docs.map(
            (doc) => doc.data() as OrderData
          );
          console.log("Realtime order data:", ordersData);
          setOrders(ordersData);
        } catch (error) {
          console.error("Error processing order data:", error);
          setOrders([]);
        }
      },
      (error) => {
        console.error("Error listening to orders:", error);
      }
    );

    // クリーンアップ関数でリスナーを解除
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* ---- 埋め込みスタイル ---- */}
      <style>{`
        .container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 1.5rem;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,.08);
          font-family: system-ui, sans-serif;
        }
        .title {
          margin: 0 0 1rem;
          font-size: 1.75rem;
          text-align: center;
        }
        .badgeRow {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .badge {
          background: #ff6868;
          color: #fff;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.875rem;
        }
        .calledBadge {
          background: #6c757d;
        }
        .section {
          margin-bottom: 1.25rem;
        }
        .summary {
          cursor: pointer;
          list-style: none;
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .list {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .item {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #e5e5e5;
        }
        .item:last-child {
          border-bottom: none;
        }
        .id {
          font-family: "SFMono-Regular", Menlo, monospace;
        }
        .empty {
          margin: 0.25rem 0 0.75rem;
          color: #6c757d;
          font-size: 0.9rem;
        }
      `}</style>

      {/* ---- 画面本体 ---- */}
      <div className="container">
        <h1 className="title">呼び出し状況</h1>

        {/* 件数バッジ */}
        <div className="badgeRow">
          <span className="badge">
            未呼び出し&nbsp;<strong>{notCalled.length}</strong>
          </span>
          <span className="badge calledBadge">
            呼び出し済み&nbsp;<strong>{called.length}</strong>
          </span>
        </div>

        {/* 未呼び出しリスト */}
        <section className="section">
          <h2>未呼び出し</h2>
          {notCalled.length === 0 ? (
            <p className="empty">未呼び出しの注文はありません。</p>
          ) : (
            <ul className="list">
              {notCalled.map((o) => (
                <li key={o.merchantPaymentId} className="item">
                  注文番号&nbsp;
                  <span className="id">{o.merchantPaymentId}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 呼び出し済みリスト（折りたたみ） */}
        <details className="section" open>
          <summary className="summary">呼び出し済み</summary>
          {called.length === 0 ? (
            <p className="empty">呼び出し済みの注文はありません。</p>
          ) : (
            <ul className="list">
              {called.map((o) => (
                <li key={o.merchantPaymentId} className="item">
                  注文番号&nbsp;
                  <span className="id">{o.merchantPaymentId}</span>
                </li>
              ))}
            </ul>
          )}
        </details>
      </div>
    </>
  );
};

createRoot(document.getElementById("root")!).render(<CallNumberDisplay />);
export default CallNumberDisplay;
