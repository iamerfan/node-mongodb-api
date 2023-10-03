const { MongoClient } = require("mongodb");
const dotenv = require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_CONNECT_URI;
let cachedClient = null;
let cachedDb = null;

async function ConnectToDatabase() {
  if (cachedClient && cachedDb) {
    console.log("Connected to database using cache");
    return {
      connect: async () => {},
      client: cachedClient,
      db: cachedDb,
      close: async () => {},
    };
  }

  const client = new MongoClient(MONGODB_URI);

  const connect = async () => {
    if (!cachedClient) {
      const startTime = new Date().getTime(); // Get the start time
      await client.connect();
      cachedClient = client;
      cachedDb = client.db("miras");
      const endTime = new Date().getTime(); // Get the end time
      const connectedTime = endTime - startTime; // Calculate the connected time
      console.log("Connected To Database");
      console.log("Connected Time:", connectedTime, "ms"); // Log the connected time
    }
  };

  const close = async () => {
    if (cachedClient) {
      await cachedClient.close();
      cachedClient = null;
      cachedDb = null;
      console.log("Disconnected From Database");
    }
  };

  await connect();

  return { connect, client, db: cachedDb, close };
}
module.exports = { ConnectToDatabase };
