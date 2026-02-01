import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  while (true) {
    try {
      await mongoose.connect(uri);
      console.log("MongoDB connected");
      break;
    } catch (err) {
      console.log("DB not ready, retrying in 5s...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }
};
