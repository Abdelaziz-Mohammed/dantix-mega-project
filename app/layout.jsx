import { Roboto } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/shared/Sidebar";
import { AuthProvider } from "@/components/shared/AuthContext";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Dantix - ML Model Platform",
  description: "Upload and monitor your machine learning models",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${roboto.className} antialiased bg-gray-50`}>
        <AuthProvider>
          <div className="flex">
            <div className="max-md:hidden">
              <Sidebar />
            </div>
            <div className="flex-1 min-h-screen max-h-screen overflow-y-auto">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
