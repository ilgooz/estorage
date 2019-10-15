import args from "args";
import { readFileSync } from "fs";
import gracefulShutdown from "http-graceful-shutdown";
import { join } from "path";

import API from "./api";
import EncryptedStorage from "./estorage";
import MongoAdapter from "./estorage/adapters/mongo";

async function run() {
  args
    .option("port", "the port number to run the service at", 5090)
    .option("host", "hostname run the service at", "127.0.0.1")
    .option("mongo-addr", "mongo url to connect", "mongodb://localhost:27017/estorage")
    .option("rsa", "private rsa key", readFileSync(join(__dirname, "../sample_creds/estorage_rsa"), "utf8"))
    .option("rsa-pub", "public rsa key", readFileSync(join(__dirname, "../sample_creds/estorage_rsa.pub"), "utf8"));

  const flags = args.parse(process.argv);

  try {
    // init mongo adapter.
    const mongoAdapter = new MongoAdapter(flags.mongoAddr);
    await mongoAdapter.start();
    console.log("connected to mongo");

    // init storage with mongo adapter.
    const estorage = new EncryptedStorage(mongoAdapter, {
      privateKey: flags.rsa,
      publicKey: flags.rsaPub,
    });

    // start api with storage.
    const api = new API(estorage, { host: flags.host, port: flags.port });
    await api.listen();
    console.log(`api started at: ${api.addr.address}:${api.addr.port}`);

    // gracefully shutdown the service on quit.
    gracefulShutdown(api.server, {
      development: false,
      signals: "SIGINT SIGTERM",
      timeout: 30000,

      finally: () => {
        console.log("shutdown");
      },
      onShutdown: async () => {
        await mongoAdapter.close();
        console.log("shutting down...");
      },
    });
  } catch ({ message }) {
    process.exitCode = 1;
    console.error(message);
  }
}

run();
