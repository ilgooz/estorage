import aes256 from "aes256";
import quickEncrypt from "quick-encrypt";

export interface ICreds {
  publicKey: string;
  privateKey: string;
}

// DataEncryptor is a data encryptor that encrypts data two times:
// 1st: encryption is made by the user given key by using aes-256 algorithm.
// 2nd: encryption is made over the 1st one by using RSA key pairs provided to DataEncryptor.
//      this way, if user keys or db storage gets stolen, attacker still will be unable to decrypt
//      without having the master RSA private key. while this adds another level of security to storage,
//      a key service can be used to retrive RSA keys on the fly to furher increase the level of security.
export default class DataEncryptor {
  private creds: ICreds;

  constructor(creds: ICreds) {
    this.creds = creds;
  }

  // encrypt encrypts data with secret and RSA key.
  public encrypt(secret: string, data: any): string {
    return quickEncrypt.encrypt(aes256.encrypt(secret, data), this.creds.publicKey);
  }

  // decrypt decrypts data with secret and RSA key.
  public decrypt(secret: string, encyrptedData: string): any {
    return aes256.decrypt(secret, quickEncrypt.decrypt(encyrptedData, this.creds.privateKey));
  }
}
