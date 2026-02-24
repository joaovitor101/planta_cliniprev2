const mongoose = require("mongoose");

async function connectDb() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI não definida no .env");
  }

  await mongoose.connect(uri, {
    autoIndex: true,
  });
}

module.exports = { connectDb };

