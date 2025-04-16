import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";

import User from "./models/User.js";
import Image from "./models/Images.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// authentication of JWT token
const authenticate = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send("Access Denied");
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
};

// Api Login
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: "User registered" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

// File Uploading
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// IApi Image
app.post(
  "/api/upload",
  authenticate,
  upload.single("image"),
  async (req, res) => {
    console.log("File uploaded:", req.file);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Saving on Dababse
    const image = new Image({
      userId: req.user._id,
      imagePath: req.file.path,
      boundaries: [], 
    });

    try {
      
      const savedImage = await image.save();
      console.log("Image saved to DB:", savedImage);
      res.json({ image: savedImage });
    } catch (error) {
      console.error("Error saving image to DB:", error);
      res.status(500).json({ message: "Error saving image to database" });
    }
  }
);

// Save boundary
app.post("/api/save-boundaries/:imageId", authenticate, async (req, res) => {
  try {
    const image = await Image.findById(req.params.imageId);
    if (!image || image.userId.toString() !== req.user._id)
      return res.status(404).json({ message: "Image not found" });

    if (!req.body.boundaries) {
      return res.status(400).json({ message: "No boundaries provided" });
    }

    
    image.boundaries = req.body.boundaries;
    await image.save();

    res.json({ message: "Boundaries saved successfully", image });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving boundaries" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
