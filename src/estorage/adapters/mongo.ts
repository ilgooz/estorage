import { MongoClient } from "mongodb";

import { IDBAdapter, IItem } from "../adapter";

// MongoAdapter implements IDBAdapter to store data in mongodb.
// TODO: add tests.
export default class MongoAdapter implements IDBAdapter {
  private collection;
  private client;
  private url;

  private collectionName: string = "items";

  constructor(url: string) {
    this.url = url;
  }

  // find by id pattern.
  public async find(id: string): Promise<IItem[]> {
    const pattern = `^${id.replace("*", ".*")}$`;
    return await this.collection.find({ id: { $regex: pattern } }).toArray();
  }

  // save item.
  public async save(value: IItem): Promise<void> {
    await this.collection.updateOne({ id: value.id }, { $set: value }, { upsert: true });
  }

  // start mongo client.
  public async start() {
    const client = await MongoClient.connect(this.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.client = client;
    this.collection = client.db().collection(this.collectionName);
    await this.collection.createIndex( { id: "text" } );
  }

  // stop mongo client.
  public async close() {
    await this.client.close();
  }
}
