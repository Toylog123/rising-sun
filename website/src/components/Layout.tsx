import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Confirm from "@/components/Confirm";
import Toast from "@/components/Toast";
import ScrollToTop from "@/components/ScrollToTop";

export default function Layout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      <ScrollToTop />
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

