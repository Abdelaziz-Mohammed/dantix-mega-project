"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/shared/AuthContext";
import Image from "next/image";

const menuItems = [
  { href: "/upload", label: "Upload Dataset" },
  { href: "/predict", label: "Predict" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/report", label: "Report" },
];

export default function MobileMenu({ open, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!open) return null;

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden">
      <div className="absolute inset-y-0 left-0 w-72 max-w-full bg-white shadow-xl border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <Image
              src="/assets/logo.svg"
              alt="Dantix Logo"
              width={30}
              height={30}
            />
            <span
              className={`text-lg font-semibold text-black transition-all duration-200 
            `}
            >
              Dantix
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 p-1.5 text-gray-600 hover:bg-neutral-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col  gap-6 mt-6">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center rounded-full px-4 py-2.5 text-sm font-medium transition-colors
                  ${
                    active
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black border border-neutral-100"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex flex-col text-xs text-gray-600">
            <span className="font-medium text-black text-sm">
              {user?.fullName || user?.userName || "Guest"}
            </span>
            <span className="truncate max-w-40">
              {user?.email || "Not signed in"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-full border border-red-200 hover:border-red-500 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
