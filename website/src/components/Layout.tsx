import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Confirm from "@/components/Confirm";
import Toast from "@/components/Toast";

export default function Layout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Confirm />
      <Toast />
    </div>
  );
}

