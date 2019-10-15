import assert from "assert";
import { readFileSync } from "fs";
import { join } from "path";

import DataEncryptor, { ICreds } from ".";

const creds: ICreds = {
  privateKey: readFileSync(join(__dirname, "../../sample_creds/estorage_rsa"), "utf8"),
  publicKey: readFileSync(join(__dirname, "../../sample_creds/estorage_rsa.pub"), "utf8"),
};

describe("encryptor", () => {
  describe("#encrypt()", () => {
    it("should encrypt", async () => {
      const encryptor = new DataEncryptor(creds);
      assert.ok((await encryptor.encrypt("secret", "data")).length > 100);
    });
  });

  describe("#decrypt()", () => {
    it("should decrypt", async () => {
      const encryptor = new DataEncryptor(creds);
      assert.equal(await encryptor.decrypt("secret", await encryptor.encrypt("secret", "data")), "data");
    });
  });
});
