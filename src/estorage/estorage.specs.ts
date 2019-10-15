import assert from "assert";
import bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { join } from "path";
import sinon from "sinon";

import { ICreds } from "../encryptor";
import EncryptedStorage, { IDBAdapter, IItem } from "./";

class FunnyAdapter implements IDBAdapter {
  public async find(id: string): Promise<IItem[]> { return []; }
  public async save(value: IItem): Promise<void> { return; }
}

const creds: ICreds = {
  privateKey: readFileSync(join(__dirname, "../../sample_creds/estorage_rsa"), "utf8"),
  publicKey: readFileSync(join(__dirname, "../../sample_creds/estorage_rsa.pub"), "utf8"),
};

describe("estorage", () => {
  describe("#save()", () => {
    it("should save with valid id", async () => {
      const adapter = new FunnyAdapter();
      const estorage = new EncryptedStorage(adapter, creds);
      const spy = sinon.stub(adapter, "save");
      await estorage.save("name-ilker", "xxx", "Istanbul");
      assert.ok(spy.calledOnce);
      assert.equal(spy.getCall(0).args.length, 1);
      assert.ok(spy.getCall(0).args[0].id, "name-ilker");
      assert.ok(spy.getCall(0).args[0].data, "Istanbul");
      assert.ok(bcrypt.compare("xxx", spy.getCall(0).args[0].hash), "Istanbul");
    });
  });

  describe("#save()", () => {
    it("shouldn't save an item with invalid id schema", async () => {
      const adapter = new FunnyAdapter();
      const estorage = new EncryptedStorage(adapter, creds);
      try {
        await estorage.save("!name-ilker", "xxx", "Istanbul");
        assert.fail("must catch");
      } catch ({ message }) {
        assert.equal(message, "'id' is not valid. it can only contain alphanumeric characters, underscores and dashes");
      }
    });
  });

  describe("#find()", () => {
    it("should find with valid id pattern and key and json data", async () => {
      const adapter = new FunnyAdapter();
      const estorage = new EncryptedStorage(adapter, creds);
      const items = [{ data: "4bbf874b34806b310845bbf82fec95305a241621e5321b58fb5952f59fdad73670860c68bc544187e5a871aff204d9b25dc210a48f651c3035db1b407a17c3d353cdfe903fe733ef6f062a40fd48979ff35917ddf88b4e717f4b4778e1d266ae6d3086aee5400fb95cd1afe0159dae3c72a96da223c90d14be8c9cd25cce7ddbe8af7823772773249383d50b6a9465b8e993c70dfc6ef1d966792979d99d9c47fa737e7eb45ffde8d41f1d01f81a2a6861b19e840045d7e84a5cc3d4d143184bce8beb3bb63075e67da4414754078aebd70ea219ee0361d2023c25c553596cc6b910b50fe9e86adb5341fb78b9b12183e4df4c1730caf9b27ee93952bf483b1b",
        hash: "$2b$10$xQP6olzQNKI.4rCwWGwwie91KNGEwyWExH1ySHsvbiKdm3Z7p5KLu",
        id: "name-ilker"}];
      const stubFind = sinon.stub(adapter, "find").callsFake(() => items);
      assert.deepEqual(await estorage.find("name-ilker-*", "xxx"), [{ id: "name-ilker", value: { city: "Istanbul" } }]);
      assert.ok(stubFind.calledOnce);
      assert.equal(stubFind.getCall(0).args.length, 1);
      assert.equal(stubFind.getCall(0).args[0], "name-ilker-*");
    });
  });

  describe("#find()", () => {
    it("shouldn't allow invalid id pattern", async () => {
      const adapter = new FunnyAdapter();
      const estorage = new EncryptedStorage(adapter, creds);
      try {
        await estorage.find("!name-ilker", "xxx");
        assert.fail("must catch");
      } catch ({ message }) {
        assert.equal(message, "query is not valid. it has to be a valid 'id' with optional * operator");
      }
    });
  });

  describe("#find()", () => {
    it("should log key error and return with an empty array", async () => {
      const adapter = new FunnyAdapter();
      const estorage = new EncryptedStorage(adapter, creds);
      const items = [{ id: "name-ilker", data: "Istanbul", hash: "bad-hash" }];
      sinon.stub(adapter, "find").callsFake(() => items);
      const spyConsole = sinon.spy(console, "error");
      assert.equal((await estorage.find(items[0].id, "xxx")).length, 0);
      assert.ok(spyConsole.calledOnce);
      assert.equal(spyConsole.getCall(0).args[0], "id query 'name-ilker' is not authentiated for provided key");
      spyConsole.restore();
    });
  });

});
