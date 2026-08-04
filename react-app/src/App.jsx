import { Route, Routes } from "react-router-dom";
import CustomerMenu from "./pages/CustomerMenu";
import TrackOrder from "./pages/TrackOrder";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import KitchenDashboard from "./pages/KitchenDashboard";
import StoreDashboard from "./pages/StoreDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CustomerMenu />} />
      <Route path="/track" element={<TrackOrder />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/kitchen" element={<KitchenDashboard />} />
      <Route path="/store" element={<StoreDashboard />} />
    </Routes>
  );
}
