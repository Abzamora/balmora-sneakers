const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using the URI in the environment.
 * Fails fast (process.exit) if the connection cannot be established,
 * since the API is useless without a database.
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
