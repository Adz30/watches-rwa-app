import "./globals.css";

export const metadata = {
  title: "WatchDeFi - NFT Lending & AMM",
  description: "Luxury watch NFT lending and fractionalized trading platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
