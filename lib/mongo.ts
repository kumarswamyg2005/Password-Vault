import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function getDb() {
  if (!client) {
    const uri = process.env.MONGODB_URI!;
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db();
}
