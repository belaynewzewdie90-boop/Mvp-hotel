import { Route, Routes } from "react-router-dom";
import { useDb } from "./context/DbContext";
import CustomerMenu from "./pages/CustomerMenu";
import TrackOrder from "./pages/TrackOrder";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import KitchenDashboard from "./pages/KitchenDashboard";
import StoreDashboard from "./pages/StoreDashboard";

function SyncBanner() {
  const { online } = useDb();
  if (online) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        padding: "6px 12px",
        textAlign: "center",
        fontSize: 13,
        background: "#b45309",
        color: "#fff",
      }}
    >
      Offline — data is only stored in this browser. Open the shared store to
      sync orders across devices.
    </div>
  );
}

export default function App() {
  return (
    <>
      <SyncBanner />
      <Routes>
        <Route path="/" element={<CustomerMenu />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/kitchen" element={<KitchenDashboard />} />
        <Route path="/store" element={<StoreDashboard />} />
      </Routes>
    </>
  );
}
