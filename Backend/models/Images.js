const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  imagePath: { type: String, required: true },
  boundaries: { type: Array, default: [] },
});

const Image = mongoose.model("Image", imageSchema);
module.exports = Image;
