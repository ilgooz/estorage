import assert from "assert";
import chai from "chai";
import chaiHTTP from "chai-http";
import { readFileSync } from "fs";
import { join } from "path";
import sinon from "sinon";

import { ICreds } from "../encryptor";
import EncryptedStorage, { IDBAdapter, IItem } from "../estorage";
import API from "./api";

class FunnyAdapter implements IDBAdapter {
  public async find(id: string): Promise<IItem[]> { return []; }
  public async save(value: IItem): Promise<void> { return; }
}

const creds: ICreds = {
  privateKey: readFileSync(join(__dirname, "../../sample_creds/estorage_rsa"), "utf8"),
  publicKey: readFileSync(join(__dirname, "../../sample_creds/estorage_rsa.pub"), "utf8"),
};

chai.use(chaiHTTP);

const estorage = new EncryptedStorage(new FunnyAdapter(), creds);
const { server } = new API(estorage);
const requester = chai.request(server).keepOpen();

// TODO: add tests for error responses.
describe("api", () => {
  after((done) => requester.close(done));

  describe("#PUT /store", () => {
    it("should store a valid item", async () => {
      const spySave = sinon.spy(estorage, "save");
      const resp = await requester
        .put("/store")
        .send({ id: "name-ilker", encryption_key: "xxx", value: "Istanbul" });
      assert.equal(resp.status, 200);
      assert.deepEqual(resp.body, { id: "name-ilker", value: "Istanbul" });
      assert.ok(spySave.calledOnce);
      assert.equal(spySave.getCall(0).args[0], "name-ilker");
      assert.equal(spySave.getCall(0).args[1], "xxx");
      assert.equal(spySave.getCall(0).args[2], "Istanbul");
      spySave.restore();
    });
  });

  describe("#GET /retrive", () => {
    it("should find", async () => {
      const stupFind = sinon.stub(estorage, "find").callsFake(() => ({ id: "name-ilker", value: "Istanbul" }));
      const resp = await requester
        .get("/retrive")
        .send({ id: "name-ilker", dencryption_key: "xxx" });
      assert.equal(resp.status, 200);
      assert.deepEqual(resp.body, { id: "name-ilker", value: "Istanbul" });
      stupFind.restore();
    });
  });
});
