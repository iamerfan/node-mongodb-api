require("dotenv").config();
const { MongoClient } = require("mongodb");
const { MONGODB_CONNECT_URI: MONGODB_URI } = process.env;

async function ConnectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  return {
    client,
    connect: async () => await client.connect(),
    close: async () => await client.close(),
    db: client.db("miras"),
  };
}

module.exports = { ConnectToDatabase };
