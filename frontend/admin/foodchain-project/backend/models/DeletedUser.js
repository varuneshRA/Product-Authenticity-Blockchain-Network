const mongoose = require("mongoose");

const deletedUserSchema = new mongoose.Schema({
  username: String,
  password: String,
  gst_number: String,
  name: String,
  latitude: Number,
  longitude: Number,
  contact_no: String,
  created_by:String,
  type: String,
  reason: String,
  deletionTime: { type: Date, default: Date.now },
});

const DeletedUser = mongoose.model("DeletedUser", deletedUserSchema);

module.exports = DeletedUser;
