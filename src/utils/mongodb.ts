import mongoose from "mongoose";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
export default function ConnectDB() {
  const uri = process.env.MONGO_DB_URI ?? "";
  try {
    mongoose.connect(uri);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
  const dbConnection = mongoose.connection;
  dbConnection.once("open", (_) => {
    console.log(`Database connected: ${uri}`);
  });

  dbConnection.on("error", (err) => {
    console.error(`connection error ${uri}: ${err}`);
  });
  return;
}
