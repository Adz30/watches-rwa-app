import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PinataSDK } from "pinata";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Make sure your JWT is set in .env as PINATA_JWT
console.log("PINATA_JWT:", process.env.PINATA_JWT);

// Initialize Pinata SDK v5
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "gateway.pinata.cloud" // default public gateway
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Server is running"));

// Upload metadata
app.post("/api/upload", async (req, res) => {
  try {
    const metadata = req.body;

    // v5 SDK uses pinJSONToIPFS
    const result = await pinata.upload.public.json(metadata);

    console.log("Upload result:", result);
    res.json({ ipfsHash: result.cid });
  } catch (err) {
    console.error("❌ Error uploading metadata:", err);
    res.status(500).json({ error: "Failed to upload metadata" });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
