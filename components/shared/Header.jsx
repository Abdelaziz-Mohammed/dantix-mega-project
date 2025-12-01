"use client";

import { useAuth } from "@/components/shared/AuthContext";
import { Menu } from "lucide-react";
import { useState } from "react";
import MobileMenu from "@/components/shared/MobileMenu";

export default function Header({ pageName, sectionName }) {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="border-b border-gray-200 bg-white px-7 py-4">
      <div className="flex items-center gap-10">
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">{pageName}</span>
          <span className="text-black">/</span>
          <span className="text-black text-[10px] tracking-wide">
            {sectionName}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-red-600 hover:text-red-700 font-medium px-5 py-2 rounded-full hover:bg-red-50
          border border-red-200 hover:border-red-500 transition ml-auto"
        >
          Logout
        </button>
      </div>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
}
