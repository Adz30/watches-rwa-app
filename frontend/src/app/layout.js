// src/app/layout.js
import "./globals.css";
import { Web3Provider } from "@/lib/WagmiProvider";

export const metadata = {
  title: "Local Wallet DApp",
  description: "Test DApp with RainbowKit & Wagmi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
