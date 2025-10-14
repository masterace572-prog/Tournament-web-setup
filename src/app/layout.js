// src/app/layout.js
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../components/ThemeProvider";
import "./globals.css";

export const metadata = {
  title: "Tournament Hub",
  description: "Your Central Hub for BGMI/PUBGM Tournaments",
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning is needed because next-themes modifies the html tag
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-900 transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}