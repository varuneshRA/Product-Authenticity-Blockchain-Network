const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const User = require("./models/User");
const DeletedUser = require("./models/DeletedUser");
const ConflictProduct = require("./models/ConflictProduct");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/foodchain", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("open", () => console.log("✅ MongoDB connected"));

// Function to generate random 6-character Product ID
function generateProductID() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let productID = "";
  for (let i = 0; i < 6; i++) {
    productID += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return productID;
}

// LOGIN
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ username: user.username, token: user.token, type: user.type });
});

// CREATE PRODUCT
app.post("/api/createProduct", async (req, res) => {
  const { username, args } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !user.token) return res.status(401).json({ error: "User not found or token missing" });

    const productID = generateProductID();
    const productName = args[2];
    const manufacturerID = args[3];
    const ownerName = username;

    const fabcarArgs = [productID, productID, productName, manufacturerID, ownerName];
    const apiUrl = "http://localhost:4000/channels/mychannel/chaincodes/fabcar";

    const payload = {
      fcn: "createProduct",
      peers: ["peer0.org1.example.com", "peer0.org2.example.com"],
      chaincodeName: "fabcar",
      channelName: "mychannel",
      args: fabcarArgs,
    };

    try {
      const response = await axios.post(apiUrl, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      res.json({ success: true, productID, data: response.data });
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.warn(`⚠️ Product ID Conflict detected for ID: ${productID}`);
        const conflict = new ConflictProduct({
          productId: productID,
          gmail1: "unknown", // You might need to fetch the actual owner from the blockchain
          gmail2: username,
        });
        await conflict.save();
        return res.status(409).json({
          conflict: true,
          message: `Product ID "${productID}" might conflict with an existing ID. It has been logged for resolution.`,
          productID,
        });
      }
      throw error;
    }
  } catch (err) {
    console.error("❌ CreateProduct Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// CREATE USER
app.post("/api/createUser", async (req, res) => {
  const { username, password, gst_number, name, latitude, longitude, contact_no, type, created_by, override } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists." });
    }

    const deletedUser = await DeletedUser.findOne({ gst_number });
    if (deletedUser && !override) {
      return res.status(403).json({
        deleted: true,
        reason: deletedUser.reason,
        username: deletedUser.username,
        gst_number,
      });
    }

    const externalResponse = await axios.post("http://localhost:4000/users", {
      username,
      orgName: "Org1",
    });

    const { token } = externalResponse.data;

    const newUser = new User({
      username,
      password,
      type,
      token,
      gst_number,
      name,
      latitude,
      longitude,
      contact_no,
      created_by,
    });

    await newUser.save();

    res.json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    console.error("❌ CreateUser Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE USER
app.post("/api/deleteUser", async (req, res) => {
  const { username, reason } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.status(404).json({ error: "User not found" });

  const deletedUser = new DeletedUser({
    username: user.username,
    password: user.password,
    gst_number: user.gst_number,
    name: user.name,
    latitude: user.latitude,
    longitude: user.longitude,
    contact_no: user.contact_no,
    type: user.type,
    created_by: user.created_by,
    reason,
    deletionTime: new Date(),
  });

  await deletedUser.save();
  await User.deleteOne({ username });
  res.json({ message: "User deleted and saved to deleted_users." });
});

// CHANGE PRODUCT OWNERSHIP
app.post("/api/changeProductOwnership", async (req, res) => {
  const { productID, newOwner } = req.body;

  try {
    const user = await User.findOne({ username: newOwner });
    if (!user) {
      return res.status(404).json({ error: "New owner is not a registered user" });
    }

    // Check if the product exists in the ledger
    const fabricCheckUrl = `http://localhost:4000/channels/mychannel/chaincodes/fabcar?args=["${productID}"]&peer=peer0.org1.example.com&fcn=getHistoryForAsset`;
    try {
      const fabricCheckResponse = await axios.get(fabricCheckUrl, {
        headers: { Authorization: `Bearer ${user.token}` }, // Include the token here
      });
      if (
        !fabricCheckResponse.data ||
        (Array.isArray(fabricCheckResponse.data) && fabricCheckResponse.data.length === 0) ||
        (typeof fabricCheckResponse.data === 'object' && fabricCheckResponse.data.error)
      ) {
        return res.status(404).json({ error: "Product not found" });
      }
    } catch (checkError) {
      console.error("Error checking product existence:", checkError.message);
      return res.status(500).json({ error: "Error checking product existence in the ledger" });
    }


    const fabcarArgs = [productID, newOwner];
    const apiUrl = "http://localhost:4000/channels/mychannel/chaincodes/fabcar";

    const payload = {
      fcn: "changeProductOwner",
      peers: ["peer0.org1.example.com", "peer0.org2.example.com"],
      chaincodeName: "fabcar",
      channelName: "mychannel",
      args: fabcarArgs,
    };

    const response = await axios.post(apiUrl, payload, {
      headers: { Authorization: `Bearer ${user.token}` }, // And here
    });

    res.json({ success: true, message: "Product ownership changed successfully", data: response.data });
  } catch (err) {
    console.error("❌ ChangeProductOwnership Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// CHECK USERNAME
app.get("/api/checkUsernameTaken/:username", async (req, res) => {
  const { username } = req.params;
  const userExists = await User.findOne({ username });
  res.json({ exists: userExists ? true : false });
});

// GET CONFLICT PRODUCTS
app.get("/api/conflictProducts", async (req, res) => {
  try {
    const conflictProducts = await ConflictProduct.find({});
    res.json(conflictProducts);
  } catch (error) {
    console.error("❌ Error fetching conflict products:", error.message);
    res.status(500).json({ error: "Failed to fetch conflict products" });
  }
});

// RESOLVE CONFLICT PRODUCT
app.delete("/api/resolveConflict/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await ConflictProduct.deleteOne({ productId });
    if (result.deletedCount > 0) {
      res.json({ success: true, message: `Conflict for Product ID "${productId}" resolved.` });
    } else {
      res.status(404).json({ error: `Conflict for Product ID "${productId}" not found.` });
    }
  } catch (error) {
    console.error("❌ Error resolving conflict:", error.message);
    res.status(500).json({ error: "Failed to resolve conflict" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));
