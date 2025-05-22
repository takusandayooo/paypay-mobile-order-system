/* AdminPage.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import type { CustomerOrderDataSchema, FoodItemSchema } from "./common.schema";
import {
  addFoodItem,
  deleteFoodItem,
  getCustomerAllOrderData,
  getFoodItems,
  updateFoodItem,
  updateOrderCallStatus,
} from "./firebase";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  Button,
  Checkbox,
  Dialog,
  Fab,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Toolbar,
} from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
} from "@mui/x-data-grid";

/* ------------------------------------------------- */
/*                定数・型                            */
/* ------------------------------------------------- */
const orderStatusOptions: CustomerOrderDataSchema["orderCallStatus"][] = [
  "not_called",
  "called",
  "received",
  "not_cashed",
];

/* ------------------------------------------------- */
/*                画面本体                            */
/* ------------------------------------------------- */
export default function AdminPage() {
  /* ---------------- state ---------------- */
  const [tab, setTab] = useState<0 | 1>(0);

  const [food, setFood] = useState<FoodItemSchema[]>([]);
  const [orders, setOrders] = useState<
    { id: string; data: CustomerOrderDataSchema }[]
  >([]);

  const [editing, setEditing] = useState<FoodItemSchema | null>(null); // null なら新規
  const [openDlg, setOpenDlg] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* ---------------- load ---------------- */
  useEffect(() => {
    Promise.all([loadFood(), loadOrders()]);
  }, []);

  const loadFood = async () => {
    const res = await getFoodItems();
    setFood(res.map((f) => ({ ...f.data, id: f.id })));
  };
  const loadOrders = async () => {
    const res = await getCustomerAllOrderData();
    setOrders(
      res.map(({ id, customerOrderData }) => ({ id, data: customerOrderData }))
    );
  };

  /* ---------------- CRUD ---------------- */
  const handleSaveFood = async (
    item: Omit<FoodItemSchema, "id"> & { id?: string }
  ) => {
    if (item.id) await updateFoodItem(item.id, item);
    else await addFoodItem(item);
    setToast("保存しました");
    setOpenDlg(false);
    loadFood();
  };

  const handleDeleteFood = async (id: string) => {
    await deleteFoodItem(id);
    setToast("削除しました");
    loadFood();
  };

  const handleOrderStatus = async (
    id: string,
    v: CustomerOrderDataSchema["orderCallStatus"]
  ) => {
    await updateOrderCallStatus(id, v);
    setToast("ステータス更新");
    loadOrders();
  };

  /* ---------------- columns ---------------- */
  const foodColumns: GridColDef<FoodItemSchema>[] = [
    { field: "name", headerName: "名前", flex: 1 },
    { field: "category", headerName: "カテゴリ", flex: 1 },
    { field: "productId", headerName: "商品ID", flex: 1 },
    { field: "amount", headerName: "価格", type: "number", flex: 0.6 },
    { field: "isSoldOut", headerName: "売り切れ", type: "boolean", flex: 0.6 },
    {
      field: "actions",
      type: "actions",
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="edit"
          onClick={() => {
            setEditing(params.row);
            setOpenDlg(true);
          }}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="delete"
          onClick={() => {
            if (params.row.id) {
              handleDeleteFood(params.row.id);
            }
          }}
        />,
      ],
    },
  ];

  const orderColumns: GridColDef[] = [
    { field: "id", headerName: "OrderID", minWidth: 200, flex: 1 },
    { field: "amount", headerName: "金額", width: 120 },
    {
      field: "time",
      headerName: "注文時間",
      width: 180,
    },
    {
      field: "items",
      headerName: "内容",
      flex: 2,
      renderCell: (params) => (
        <Box sx={{ whiteSpace: "pre-wrap" }}>{params.value as string}</Box>
      ),
    },
    {
      field: "status",
      headerName: "ステータス",
      flex: 1,
      renderCell: (params: any) => (
        <select
          defaultValue={params.row.status}
          onChange={(e) =>
            handleOrderStatus(params.row.id, e.target.value as any)
          }
        >
          {orderStatusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ];

  /* ---------------- render ---------------- */
  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <Box component="h1" sx={{ flexGrow: 1, fontSize: 20 }}>
            管理ページ
          </Box>
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="フード" />
        <Tab label="オーダー" />
      </Tabs>

      {/* Tab Panels */}
      <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
        {tab === 0 && (
          <DataGrid
            rows={food}
            columns={foodColumns}
            autoHeight
            disableRowSelectionOnClick
            sx={{ m: 2 }}
          />
        )}
        {tab === 1 && (
          <DataGrid
            rows={orders.map((o) => ({
              id: o.id,
              amount: o.data.amount,
              status: o.data.orderCallStatus,
              time: new Date(o.data.orderTime).toLocaleString("ja-JP", {
                hour12: false,
              }),
              items: o.data.orderItems
                .map((it) => `${it.name} ×${it.quantity}`)
                .join("\n"),
            }))}
            columns={orderColumns}
            autoHeight
            hideFooter
            disableRowSelectionOnClick
            initialState={{
              sorting: { sortModel: [{ field: "time", sort: "desc" }] },
            }}
            sx={{ m: 2 }}
          />
        )}
      </Box>

      {/* 右下 FAB */}
      {tab === 0 && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => {
            setEditing(null);
            setOpenDlg(true);
          }}
          sx={{ position: "fixed", bottom: 32, right: 32 }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* ダイアログ（Food 追加/編集） */}
      <FoodDialog
        open={openDlg}
        initial={editing}
        onClose={() => setOpenDlg(false)}
        onSave={handleSaveFood}
      />

      {/* スナックバー */}
      <Snackbar
        open={!!toast}
        autoHideDuration={2000}
        message={toast}
        onClose={() => setToast(null)}
      />
    </Box>
  );
}

/* ------------------------------------------------- */
/*    Food 追加・編集ダイアログ                       */
/* ------------------------------------------------- */
function FoodDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: FoodItemSchema | null;
  onClose: () => void;
  onSave: (item: Omit<FoodItemSchema, "id"> & { id?: string }) => void;
}) {
  const [value, setValue] = useState<Omit<FoodItemSchema, "id">>({
    name: "",
    category: "",
    productId: "",
    amount: 0,
    isSoldOut: false,
  });

  /* 初期値をダイアログ開閉ごとに同期 */
  useEffect(() => {
    if (initial)
      setValue({
        name: initial.name,
        category: initial.category,
        productId: initial.productId,
        amount: initial.amount,
        isSoldOut: initial.isSoldOut,
      });
    else
      setValue({
        name: "",
        category: "",
        productId: "",
        amount: 0,
        isSoldOut: false,
      });
  }, [initial, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3, display: "flex", gap: 2, flexDirection: "column" }}>
        <TextField
          label="名前"
          value={value.name}
          onChange={(e) => setValue({ ...value, name: e.target.value })}
          fullWidth
        />
        <TextField
          label="カテゴリ"
          value={value.category}
          onChange={(e) => setValue({ ...value, category: e.target.value })}
          fullWidth
        />
        <TextField
          label="商品ID"
          value={value.productId}
          onChange={(e) => setValue({ ...value, productId: e.target.value })}
          fullWidth
        />
        <TextField
          label="価格"
          type="number"
          value={value.amount}
          onChange={(e) =>
            setValue({ ...value, amount: Number(e.target.value) })
          }
          fullWidth
        />

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Checkbox
            id="isSoldOut"
            checked={value.isSoldOut}
            onChange={(e) =>
              setValue({ ...value, isSoldOut: e.target.checked })
            }
          />
          <label htmlFor="isSoldOut" style={{ marginLeft: 8 }}>
            売り切れ
          </label>
        </Box>

        <Box sx={{ mt: 2, textAlign: "right" }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              onSave(initial ? { ...value, id: initial.id } : value)
            }
          >
            保存
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}