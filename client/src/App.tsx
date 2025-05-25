// App.tsx
import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Container,
  Card,
  CardContent,
  CardActions,
  Stack,
  Button,
  Paper,
  Skeleton,
  Slide,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import SoldOutIcon from "@mui/icons-material/Block";
import { FoodItemSchema, OderItemSchema } from "./common.schema";

interface OrderItem {
  item: FoodItemSchema;
  quantity: number;
}

/* ─────────── テーマ設定 ─────────── */
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#007bff" },
    secondary: { main: "#28a745" },
  },
  shape: { borderRadius: 8 },
});

/* ─────────── FoodCard ─────────── */
interface FoodCardProps {
  item: FoodItemSchema;
  quantity: number;
  onChange: (q: number) => void;
}
const FoodCard: React.FC<FoodCardProps> = ({ item, quantity, onChange }) => (
  <Card
    elevation={3}
    sx={{
      width: { xs: "100%", sm: 260, md: 300 }, // ★ 幅固定でカードを並べる
      opacity: item.isSoldOut ? 0.5 : 1,
      flexShrink: 0,
    }}
  >
    <CardContent>
      <Typography variant="h6">{item.name}</Typography>
      <Typography color="text.secondary">{item.category}</Typography>
      <Typography sx={{ mt: 0.5 }} fontWeight="bold">
        ¥{item.amount?.toLocaleString()}
      </Typography>
    </CardContent>

    <CardActions sx={{ justifyContent: "space-between" }}>
      {item.isSoldOut ? (
        <Stack direction="row" alignItems="center" spacing={1}>
          <SoldOutIcon color="error" fontSize="small" />
          <Typography color="error">売切</Typography>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            onClick={() => onChange(quantity - 1)}
            disabled={quantity === 0}
          >
            <RemoveRounded />
          </IconButton>
          <Badge badgeContent={quantity} color="primary" showZero />
          <IconButton onClick={() => onChange(quantity + 1)}>
            <AddRounded />
          </IconButton>
        </Stack>
      )}
    </CardActions>
  </Card>
);

/* ─────────── メイン ─────────── */
const App: React.FC = () => {
  const [foodItems, setFoodItems] = useState<FoodItemSchema[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMerchantPaymentId, setLastMerchantPaymentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/foodItem");
        const data = await res.json();
        const formatted = data.foodItems.map(
          (x: { id: string; data: FoodItemSchema }) => ({ id: x.id, ...x.data })
        );
        setFoodItems(FoodItemSchema.array().parse(formatted));
      } catch (e) {
        console.error(e);
      }
    })();
    const stored = localStorage.getItem("merchantPaymentId");
    setLastMerchantPaymentId(stored && stored !== "null" ? stored : null);
  }, []);

  /* 数量変更などのロジック（前回と同じ） */
  const getItemQuantity = (id: string) =>
    orderItems.find((o) => o.item.id === id)?.quantity ?? 0;
  const handleQuantityChange = (item: FoodItemSchema, q: number) => {
    if (q < 0) return;
    if (item.isSoldOut && q > getItemQuantity(item.id || "")) return;
    setOrderItems((prev) => {
      const idx = prev.findIndex((o) => o.item.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        q === 0 ? copy.splice(idx, 1) : (copy[idx].quantity = q);
        return copy;
      }
      return q > 0 ? [...prev, { item, quantity: q }] : prev;
    });
  };
  const calculateTotal = () =>
    orderItems.reduce((t, o) => t + (o.item.amount ?? 0) * o.quantity, 0);

  const handlePayWithPayPay = async () => {
    if (orderItems.length === 0) return;
    setIsProcessing(true);
    try {
      /* 売切れチェック → 決済要求 … 前回と同じ */
      const res = await fetch("/cash_from_paypay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: calculateTotal(),
          description: "食品の購入",
          orderItems: OderItemSchema.array().parse(
            orderItems.map((o) => ({
              name: o.item.name || "",
              category: o.item.category || "",
              quantity: o.quantity,
              productId: o.item.productId || "",
              unitPrice: { amount: o.item.amount ?? 0, currency: "JPY" },
            }))
          ),
        }),
      });
      const data = await res.json();
      if (data.resultInfo.code === "SUCCESS" && data.data.url) {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        data.data.merchantPaymentId &&
          localStorage.setItem("merchantPaymentId", data.data.merchantPaymentId);
        window.location.href = data.data.url;
      } else {
        alert("決済処理に失敗しました。");
        setIsProcessing(false);
      }
    } catch (e) {
      console.error(e);
      alert("決済処理中にエラーが発生しました。");
      setIsProcessing(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ───── ヘッダー ───── */}
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Food Items
          </Typography>
          <IconButton
            color="inherit"
            onClick={() =>
              window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
            }
          >
            <Badge badgeContent={orderItems.length} color="secondary">
              <ShoppingCartRounded />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ───── 商品リスト ───── */}
      <Container sx={{ py: 4 }}>
        {/* ラッパーを flex + wrap に */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: { xs: "center", md: "flex-start" },
          }}
        >
          {foodItems.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={160}
                  sx={{
                    width: { xs: "100%", sm: 260, md: 300 },
                    flexShrink: 0,
                  }}
                />
              ))
            : foodItems.map((item) => (
                <Slide in timeout={400} key={item.id}>
                  <Box>
                    <FoodCard
                      item={item}
                      quantity={getItemQuantity(item.id!)}
                      onChange={(q) => handleQuantityChange(item, q)}
                    />
                  </Box>
                </Slide>
              ))}
        </Box>
      </Container>

      {/* ───── 固定ボトムバー ───── */}
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          p: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          justifyContent: "center",
          zIndex: (t) => t.zIndex.appBar + 1,
        }}
      >
        <Typography variant="h6">
          合計: ¥{calculateTotal().toLocaleString()}
        </Typography>
        <Button
          variant="contained"
          size="large"
          disabled={isProcessing || orderItems.length === 0}
          onClick={handlePayWithPayPay}
        >
          {isProcessing ? "処理中…" : "PayPayで支払う"}
        </Button>
        <Button
          variant="outlined"
          size="large"
          color="secondary"
          disabled={!lastMerchantPaymentId}
          onClick={() =>
            lastMerchantPaymentId &&
            (window.location.href = `/paymentResult?merchantPaymentId=${lastMerchantPaymentId}`)
          }
        >
          前回の決済結果
        </Button>
      </Paper>
    </ThemeProvider>
  );
};

export default App;