import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { signOut } from "firebase/auth";
import { auth, emailAndPasswordSign } from "./firebase";
import firebase from "firebase/compat/app";
import AdminPage from "./loginPage";

const AuthComponent = () => {
  const [user, setUser] = useState<firebase.User | null>(null); // ログイン状態
  const [email, setEmail] = useState<string>(""); // メールアドレス
  const [password, setPassword] = useState<string>(""); // パスワード

  // ログイン状態の監視
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser !== null) {
        // ログインしている場合
        setUser(authUser as firebase.User | null);
      } else {
        // ログアウトしている場合
        setUser(null);
      }
    });

    // アンマウント時に監視解除
    return () => {
      unsubscribe();
    };
  }, []);

  // ログイン
  const handleSignIn = async (email: string, password: string) => {
    const { status, userCredential } = await emailAndPasswordSign(
      email,
      password
    );
    if (status === "success" && userCredential?.user) {
      // ログイン成功
      console.log("ログイン成功:", userCredential.user);
    } else {
      // ログイン失敗
      console.error("ログイン失敗");
      alert("ログインに失敗しました。");
    }
  };

  // ログアウト
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  return (
    <div>
      {user ? (
        <div>
          <h1>管理ページ</h1>
          <AdminPage />
          <p>ログインユーザー: {user.displayName}</p>
          <button onClick={handleSignOut}>ログアウト</button>
        </div>
      ) : (
        <div>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={() => handleSignIn(email, password)}>
            ログイン
          </button>
        </div>
      )}
    </div>
  );
};
createRoot(document.getElementById("root")!).render(<AuthComponent />);
export default AuthComponent;
