const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();
const User = require("./models/User");
const ProductOwner = require("./models/ProductOwner");
const ConflictProduct = require("./models/ConflictProduct");

const app = express();
const port = 5001; // Use environment variable for port

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect("mongodb://localhost:27017/foodchain", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 10000, // Add connection timeout
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Nodemailer Setup (Initialize lazily only if needed)
let transporter;
const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }
    return transporter;
};

// Helper function to send conflict emails
const sendConflictEmail = async (recipientEmail, productId) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_ID,
            to: recipientEmail,
            subject: 'Potential Duplicate Product Detected - Action Required',
            html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Potential Duplicate Product Detected</title><style>body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; } .container { max-width: 600px; margin: 20px auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); border: 1px solid #ddd; } h1 { color: #d9534f; text-align: center; margin-bottom: 20px; } p { margin-bottom: 15px; } .product-info { background-color: #f9f9f9; padding: 15px; border: 1px solid #eee; border-radius: 4px; margin-bottom: 20px; } .product-info strong { font-weight: bold; } .important-note { color: #5bc0de; font-style: italic; } .manufacturer-contact { margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #777; } .footer { text-align: center; margin-top: 20px; color: #777; font-size: 0.8em; }</style></head><body><div class="container"><h1>Potential Duplicate Product Detected</h1><p>Dear User,</p><p>We have detected a potential ownership conflict for the following product:</p><div class="product-info"><p><strong>Product ID:</strong> ${productId}</p></div><p class="important-note">It's important to verify the authenticity of your product to ensure its quality and origin. Please contact the manufacturer as soon as possible to resolve this.</p><div class="manufacturer-contact"><p>For verification, please reach out to the manufacturer through their official channels.</p></div><p>Thank you for your attention to this matter.</p><div class="footer"><p>This is an automated message from our system.</p></div></div></body></html>`,
        };
        await getTransporter().sendMail(mailOptions);
        console.log(`Conflict email sent to ${recipientEmail} for product ${productId}`);
    } catch (error) {
        console.error(`Error sending conflict email to ${recipientEmail}:`, error);
        // Consider more robust error handling here (e.g., logging to a file)
    }
};

// Route Handlers
app.get("/getProductDetails", async (req, res) => {
    const { productId } = req.query;
    if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
    }
    try {
        const token = process.env.BEARER_TOKEN;
        const fabricResponse = await axios.get(`http://localhost:4000/channels/mychannel/chaincodes/fabcar?args=["${productId}"]&peer=peer0.org1.example.com&fcn=getHistoryForAsset`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Check if Fabric response contains data or an error indicating product not found
        if (!fabricResponse.data || (Array.isArray(fabricResponse.data) && fabricResponse.data.length === 0) || (typeof fabricResponse.data === 'object' && fabricResponse.data.error)) {
            return res.status(404).json({ error: "Product not found" });
        }

        const productHistory = fabricResponse.data;
        const owners = productHistory.map(item => item.Value.owner);

        const userDetails = await Promise.all(owners.map(async (owner) => {
            try {
                const user = await User.findOne({ username: owner }).exec();
                return user ? {
                    username: user.username,
                    name: user.name,
                    contact_no: user.contact_no,
                    gst_number: user.gst_number,
                    latitude: user.latitude,
                    longitude: user.longitude,
                    type: user.type
                } : null;
            } catch (error) {
                console.error(`Error fetching user details for ${owner}:`, error);
                return null; // Handle individual user fetch errors gracefully
            }
        }));

        const validUserDetails = userDetails.filter(user => user !== null);
        res.json({ productHistory, userDetails: validUserDetails });

    } catch (error) {
        console.error("Error fetching product details from Fabric:", error);
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.status(500).json({ error: "Failed to fetch product details" });
    }
});

app.post("/checkProduct", async (req, res) => {
    const { productId, gmail, name } = req.body;
    if (!productId || !gmail) {
        return res.status(400).json({ error: "Product ID and Gmail are required" });
    }
    try {
        const existingProduct = await ProductOwner.findOne({ productId }).exec();

        if (!existingProduct) {
            const newProductOwner = new ProductOwner({ productId, gmail, name });
            await newProductOwner.save();
            return res.json({ message: "Product owner set to your Gmail.", owner: gmail });
        }

        if (existingProduct.gmail === gmail) {
            return res.json({ message: "You are the owner of this product.", owner: gmail });
        }

        // Different owner - check if conflict already exists
        const existingConflict = await ConflictProduct.findOne({
            productId: productId,
            $or: [
                { gmail1: gmail, gmail2: existingProduct.gmail },
                { gmail1: existingProduct.gmail, gmail2: gmail },
            ],
        }).exec();

        if (!existingConflict) {
            const newConflict = new ConflictProduct({ productId, gmail1: gmail, gmail2: existingProduct.gmail });
            await newConflict.save();
            await sendConflictEmail(gmail, productId);
            await sendConflictEmail(existingProduct.gmail, productId);
        } else {
            console.log(`Conflict already recorded for product ${productId} and users ${gmail}, ${existingProduct.gmail}. Emails not sent.`);
        }

        return res.json({
            message: `Product already owned by ${existingProduct.name} , email id :${existingProduct.gmail}. Please verify with manufacturer.`,
            owner: existingProduct.gmail,
            conflict: true,
            existingOwnerGmail: existingProduct.gmail,
            existingOwnerName: existingProduct.name,
        });

    } catch (error) {
        console.error("Error checking product ownership:", error);
        res.status(500).json({ error: "Failed to check product ownership" });
    }
});

app.post("/addConflictProduct", async (req, res) => {
    const { productId, gmail1, gmail2 } = req.body;
    if (!productId || !gmail1 || !gmail2) {
        return res.status(400).json({ error: "Product ID, existing Gmail, and current Gmail are required" });
    }
    try {
        const existingConflict = await ConflictProduct.findOne({
            productId: productId,
            $or: [
                { gmail1: gmail1, gmail2: gmail2 },
                { gmail1: gmail2, gmail2: gmail1 },
            ],
        }).exec();

        if (existingConflict) {
            return res.json({ message: "Conflict product details already saved." });
        }

        const newConflict = new ConflictProduct({ productId, gmail1, gmail2 });
        await newConflict.save();
        return res.json({ message: "Conflict product details saved." });

    } catch (error) {
        console.error("Error saving conflict product:", error);
        res.status(500).json({ error: "Failed to save conflict product details" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});