"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import {
  ChartPie,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Upload,
  User,
} from "lucide-react";
import { useAuth } from "@/components/shared/AuthContext";

const menuItems = [
  { href: "/upload", label: "Upload Dataset", icon: Upload },
  { href: "/predict", label: "Predict", icon: ChartPie },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/report", label: "Report", icon: ChartPie },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const { user, logout } = useAuth();

  const isActive = (href) => pathname === href;

  return (
    <aside
      className={`h-screen  flex flex-col justify-between border-r border-gray-200 bg-white z-50 p-4 
        transition-all duration-300
        ${isOpen ? "w-64" : "w-20"}
      `}
    >
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className={`flex items-center gap-2 overflow-hidden ${
              !isOpen && "justify-center gap-0 bg-red-500 w-0 hidden"
            }`}
          >
            <Image
              src="/assets/logo.svg"
              alt="Dantix Logo"
              width={30}
              height={30}
              className={`shrink-0 rounded-lg ${
                isOpen ? "opacity-100" : "opacity-0 w-0 hidden"
              }`}
            />
            <span
              className={`text-lg font-semibold text-black transition-all duration-200 
              ${isOpen ? "opacity-100 ml-1" : "opacity-0 w-0"}
            `}
            >
              Dantix
            </span>
          </Link>

          <button
            className="border border-neutral-200 rounded-lg p-1 hover:bg-neutral-100 transition"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>

        <div className="flex flex-col gap-6 mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2.5 rounded-full transition-colors gap-3
                ${
                  isActive(item.href)
                    ? "bg-black text-white"
                    : "text-gray-500 hover:bg-gray-200 hover:text-black border"
                }
                ${!isOpen && "gap-0 w-10 h-10 justify-center"}
              `}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span
                className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200
                ${isOpen ? "opacity-100" : "opacity-0 w-0 hidden"}
              `}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full border
          border-neutral-200 shadow bg-gray-100 text-gray-600"
          >
            <User className="w-6 h-6" />
          </div>
          <div
            className={`flex flex-col transition-all duration-200
            ${isOpen ? "opacity-100" : "opacity-0 w-0"}
          `}
          >
            <span className="text-sm font-medium text-black">
              {user?.fullName || user?.userName || "Guest"}
            </span>
            <span className="text-xs text-gray-600">
              {user?.email || "Not signed in"}
            </span>
          </div>
        </div>

        {isOpen && (
          <button
            onClick={logout}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-200 text-gray-600 hover:bg-neutral-100 transition"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
