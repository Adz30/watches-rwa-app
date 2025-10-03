import { useNavigate } from "react-router-dom";

export default function TradingHub() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold mb-6">Trading Hub</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* AMM Flow */}
        <div
          onClick={() => navigate("/amm")}
          className="cursor-pointer p-6 rounded-2xl shadow-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:scale-105 transition"
        >
          <h2 className="text-xl font-semibold">AMM Pool Trading</h2>
          <p className="mt-2 text-sm opacity-80">
            Swap fractions and tokens through the Automated Market Maker.
          </p>
        </div>

        {/* Fractionalizer Flow */}
        <div
          onClick={() => navigate("/fractionalizer")}
          className="cursor-pointer p-6 rounded-2xl shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:scale-105 transition"
        >
          <h2 className="text-xl font-semibold">NFT Fractionalizer</h2>
          <p className="mt-2 text-sm opacity-80">
            Fractionalize your NFT and create liquidity pools.
          </p>
        </div>
      </div>
    </div>
  );
}
