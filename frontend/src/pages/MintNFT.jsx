import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Spinner,
} from "@material-tailwind/react";
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
    return <p className="text-center mt-10">Loading contracts...</p>;
  }

  const handleMint = async () => {
    if (!account || !watchNFT) {
      alert("Missing account or contract");
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Upload image to IPFS if not hosted
      let imageUri = image;
      if (image && !image.startsWith("ipfs://") && !image.startsWith("http")) {
        const fileData = await fetch(image).then((res) => res.blob());
        const file = new File([fileData], `${brand}-${model}.png`, {
          type: fileData.type,
        });

        // TODO: implement this helper to upload file to IPFS
        const imageUpload = await uploadFileToIPFS(file);
        imageUri = `ipfs://${imageUpload.cid}`;
      }

      // 2️⃣ Build ERC721 metadata
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

      // 3️⃣ Upload metadata to IPFS
      const metadataUri = await uploadMetadataToIPFS(metadata);
      setIpfsURI(metadataUri);

      // 4️⃣ Mint NFT on-chain
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
      <Card className="shadow-lg rounded-xl">
        <CardHeader color="blue" className="flex items-center gap-4">
          <FaPlus className="w-6 h-6" />
          <h2 className="text-white font-semibold">Mint Watch NFT</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <p className="text-gray-700 text-sm">
            Connected Wallet: {account || "Not connected"}
          </p>

          <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <Input label="Model" value={model} onChange={(e) => setModel(e.target.value)} />
          <Input label="Model Number" value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} />
          <Input label="Year" value={year} onChange={(e) => setYear(e.target.value)} />
          <Input label="Image URL" value={image} onChange={(e) => setImage(e.target.value)} />

          <Button
            color="blue"
            onClick={handleMint}
            disabled={loading}
            className="mt-2"
          >
            {loading ? <Spinner className="h-4 w-4" /> : "Mint NFT"}
          </Button>

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
