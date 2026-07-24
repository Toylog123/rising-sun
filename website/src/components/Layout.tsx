import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Confirm from "@/components/Confirm";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f2eb]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Confirm />
    </div>
  );
}

