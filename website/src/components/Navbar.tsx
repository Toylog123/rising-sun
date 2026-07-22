import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinks = [
  { to: "/", label: "任务看板" },
  { to: "/archive", label: "归档" },
  { to: "/new", label: "新建任务" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-[#faf9f5]/80 backdrop-blur-lg border-b border-[#e8e4db]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-lg font-serif font-bold text-[#1a1a1a] tracking-wide hover:text-[#c96442] transition-colors duration-200">
            Rising Sun
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#c96442] text-white shadow-sm"
                      : "text-[#6b6560] hover:text-[#1a1a1a] hover:bg-[#f0ece4]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <button className="md:hidden text-[#6b6560] hover:text-[#1a1a1a] transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-[#e8e4db] bg-[#faf9f5]/95 backdrop-blur-lg">
          <div className="px-4 py-2 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? "bg-[#c96442] text-white" : "text-[#6b6560] hover:text-[#1a1a1a] hover:bg-[#f0ece4]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
