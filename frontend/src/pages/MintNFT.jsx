import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Card, CardHeader, CardBody, Button, Spinner, Input } from "@material-tailwind/react";
import { FaPlus } from "react-icons/fa";
import { uploadMetadataToIPFS, mintWatchNFT } from "../lib/interactions";

export default function MintNFT() {
  const account = useSelector((state) => state.provider.account);
  const watchNFT = useSelector((state) => state.watchNft.contract);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [year, setYear] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ipfsURI, setIpfsURI] = useState("");
  const [txHash, setTxHash] = useState("");

  if (!watchNFT) {
    return (
      <p className="text-zinc-500 text-center mt-10">Loading contracts...</p>
    );
  }

  const handleMint = async () => {
    if (!account || !watchNFT) {
      alert("Missing account or contract");
      return;
    }

    setLoading(true);
    try {
      let imageUri = image;
      if (image && !image.startsWith("ipfs://") && !image.startsWith("http")) {
        const fileData = await fetch(image).then((res) => res.blob());
        const file = new File([fileData], `${brand}-${model}.png`, {
          type: fileData.type,
        });
        const imageUpload = await uploadFileToIPFS(file); // implement this helper
        imageUri = `ipfs://${imageUpload.cid}`;
      }

      const metadata = {
        name: `${brand} ${model} ${modelNumber} (${year})`,
        description: `Luxury ${brand} ${model} watch NFT, model number ${modelNumber}, minted in ${year}.`,
        image: imageUri,
        attributes: [
          { trait_type: "Brand", value: brand },
          { trait_type: "Model", value: model },
          { trait_type: "Model Number", value: modelNumber },
          { trait_type: "Year", value: year },
        ],
      };

      const metadataUri = await uploadMetadataToIPFS(metadata);
      setIpfsURI(metadataUri);

      const tx = await mintWatchNFT(watchNFT, account, metadataUri);
      setTxHash(tx.hash);

      alert("✅ NFT minted successfully!");
    } catch (err) {
      console.error("❌ Error minting NFT:", err);
      alert("Error minting NFT. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card className="card shadow-lg rounded-xl">
        <CardHeader className="flex items-center gap-4 bg-blue-600 px-4 py-3 rounded-t-xl">
          <FaPlus className="w-6 h-6 text-white" />
          <h2 className="text-white font-semibold">Mint Watch NFT</h2>
        </CardHeader>

        <CardBody className="flex flex-col gap-4">
          <p className="text-zinc-900 dark:text-white text-sm">
            Connected Wallet: {account || "Not connected"}
          </p>

          {/* === Inputs with labels above === */}
          <div className="flex flex-col">
            <label className="text-zinc-500 dark:text-white mb-1 text-sm">Brand</label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="text-zinc-900 dark:text-white"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-zinc-500 dark:text-white mb-1 text-sm">Model</label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="text-zinc-900 dark:text-white"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-zinc-500 dark:text-white mb-1 text-sm">Model Number</label>
            <Input
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              className="text-zinc-900 dark:text-white"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-zinc-500 dark:text-white mb-1 text-sm">Year</label>
            <Input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="text-zinc-900 dark:text-white"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-zinc-500 dark:text-white mb-1 text-sm">Image URL</label>
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="text-zinc-900 dark:text-white"
            />
          </div>

          {/* === Mint Button === */}
          <Button
            className="button button-primary mt-2"
            onClick={handleMint}
            disabled={loading}
          >
            {loading ? <Spinner className="h-4 w-4" /> : "Mint NFT"}
          </Button>

          {/* === Feedback === */}
          {ipfsURI && (
            <p className="text-xs text-green-600 break-all">
              ✅ IPFS URI:{" "}
              <a href={ipfsURI} target="_blank" rel="noreferrer">
                {ipfsURI}
              </a>
            </p>
          )}
          {txHash && (
            <p className="text-xs text-blue-600 break-all">
              🔗 Tx Hash: {txHash}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
