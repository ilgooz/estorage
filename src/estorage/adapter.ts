// IDBAdapter can have various implementations for any kind of db.
export interface IDBAdapter {
  // find finds matching items in db with the id pattern.
  find(pattern: string): Promise<IItem[]>;

  // save sabes item to db.
  save(value: IItem): Promise<void>;
}

export interface IItem {
  // hash of the data.
  hash: string;

  // id of the data.
  id: string;

  // encrypted data.
  data: string;
}
