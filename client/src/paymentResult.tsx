import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";

const PaymentResult = () => {
  const [status, setStatus] = useState<string>("unknown");
  const [message, setMessage] = useState<string>("");
  const [id, setId] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const merchantPaymentId = params.get("merchantPaymentId");
    if (merchantPaymentId) {
      fetch("/get_payment_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantPaymentId }),
      })
        .then((res) => res.json())
        .then((data) => {
          // resultInfo がない場合は status で判定
          if (
            data.status === "completed" ||
            data.status === "canceled" ||
            data.status === "failed"
          ) {
            setStatus(data.status);
            setMessage(data.message);
            setId(data.merchantPaymentId);
          } else if (data.resultInfo?.code === "SUCCESS") {
            setStatus(data.status);
            setMessage(data.message);
            setId(merchantPaymentId);
          } else {
            setStatus("error");
            setMessage(
              data.resultInfo?.message || data.message || "不明なエラー"
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching payment status:", err);
          setStatus("error");
          setMessage("決済情報の取得に失敗しました。");
        });
    }
  }, []);

  const getStatusClass = () => {
    switch (status) {
      case "completed":
        localStorage.setItem("merchantPaymentId", id);
        return "status-success";
      case "canceled":
        return "status-warning";
      case "failed":
      case "error":
        return "status-error";
      default:
        return "status-unknown";
    }
  };

  return (
    <div className="payment-result-container">
      <h1>決済結果</h1>
      <div className={`status-box ${getStatusClass()}`}>
        <p className="status-message">{decodeURIComponent(message)}</p>
        {id && <p className="payment-id">注文番号: {id}</p>}
      </div>

      {/* -------- 追加したボタン群 -------- */}
      <div className="actions">
        <button
          className="action-button"
          onClick={() => (window.location.href = "/")}
        >
          トップに戻る
        </button>
        <button
          className="action-button secondary"
          onClick={() => (window.location.href = "/callNumberDisplay")}
        >
          呼び出し状況へ
        </button>
      </div>

      {/* -------- 埋め込みスタイル -------- */}
      <style>{`
        .payment-result-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
          font-family: sans-serif;
        }

        .status-box {
          padding: 1.5rem;
          margin: 1.5rem 0;
          border-radius: 6px;
        }

        .status-success  { background:#e7f7e7; border:1px solid #4caf50;}
        .status-warning  { background:#fff8e6; border:1px solid #ff9800;}
        .status-error    { background:#ffebee; border:1px solid #f44336;}
        .status-unknown  { background:#e8eaf6; border:1px solid #3f51b5;}

        .status-message { font-size:1.2rem; margin-bottom:1rem; }
        .payment-id     { font-family:monospace; padding:.5rem; background:rgba(0,0,0,.05); border-radius:4px;}

        /* ------ ボタン ------ */
        .actions {
          display:flex;
          justify-content:center;
          gap:.75rem;
          flex-wrap: wrap;
        }

        .action-button {
          padding:0.75rem 1.5rem;
          background:#2196f3;
          color:#fff;
          border:none;
          border-radius:4px;
          cursor:pointer;
          font-size:1rem;
          transition:background-color 0.3s;
        }
        .action-button:hover { background:#0b7dda; }

        /* 2 つ目のボタンだけ色変えたい場合 */
        .secondary { background:#4caf50; }
        .secondary:hover { background:#3c8f41; }
      `}</style>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<PaymentResult />);
export default PaymentResult;
