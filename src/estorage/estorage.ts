import bcrypt from "bcrypt";

import DataEncryptor, { ICreds } from "../encryptor";
import { IDBAdapter } from "./adapter";

export interface IResult {
  id: string;
  value: any;
}

// EncryptedStorage provides an encryption enabled key-value data storage.
export default class EncryptedStorage {
  private adapter: IDBAdapter;
  private encryptor: DataEncryptor;

  private saltRounds: number = 10;
  private idPattern: RegExp = /^[\w-]*$/;
  private idSearchPattern: RegExp = /^[\w-*]*$/;

  // adapter can be any kind if db implementation,
  // creds used to encrypt data 2nd time for more security.
  constructor(adapter: IDBAdapter, creds: ICreds) {
    this.adapter = adapter;
    this.encryptor = new DataEncryptor(creds);
  }

  // save encrypts value with encryptionKey and stores in db with associated id.
  public async save(id: string, encryptionKey: string, value: any): Promise<void> {
    // check if the id is valid.
    if (!this.idPattern.test(id)) {
      throw this.createIDValidationError("'id' is not valid. it can only contain alphanumeric characters, underscores and dashes");
    }

    // calculate a hash from encryptionKey to compare ownership while using find().
    const hash = await bcrypt.hash(encryptionKey, this.saltRounds);

    // encrypt value with encryptionKey and store in db.
    const encryptedData = this.encryptor.encrypt(encryptionKey, JSON.stringify(value));
    return this.adapter.save({id, hash, data: encryptedData});
  }

  // find finds all values for matching id query and decodes them with encryptionKey.
  // all values that matched with id query must have been encrypted with the same encryptionKey,
  // in other words, the owner has to be the same. otherwise an empty array will be returned.
  public async find(query: string, encryptionKey: string): Promise<IResult[]> {
    // check if the id query is valid.
    if (!this.idSearchPattern.test(query)) {
      throw this.createIDValidationError("query is not valid. it has to be a valid 'id' with optional * operator");
    }

    // find all values that query points to.
    const data = await this.adapter.find(query);

    // check if all values are encrypted with the same key. otherwise return an empty array.
    const comparisons = await Promise.all(data.map(async ({ hash }) => {
      return await bcrypt.compare(encryptionKey, hash);
    }));
    const isNotOwner = comparisons.some((comparison) => !comparison);
    if (isNotOwner) {
      console.error(`id query '${query}' is not authentiated for provided key`);
      return [];
    }

    // decrypt values, build and return the IResult array.
    return data.map(({ data, id }) => {
      const value = JSON.parse(this.encryptor.decrypt(encryptionKey, data));
      return { id, value };
    });
  }

  private createIDValidationError(message: string): Error {
    return { message, name: "EStorageIDValidationError" };
  }
}
