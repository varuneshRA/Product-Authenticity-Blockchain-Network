const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  gst_number: String,
  name: String,
  latitude: Number,
  longitude: Number,
  contact_no: String,
  created_by:String,
  type: String,
  token: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
