import * as CryptoJS from "crypto-js";
import { environment } from "../../environments/environment";

export class EncryptionDecryption {
  constructor() {}

  encryptObjectData(data: any) {
    const dataToEncrypt = JSON.stringify(data);
    const encPassword = environment.CRYPTOSECRET;
    const encryptedData = CryptoJS.AES.encrypt(
      dataToEncrypt.trim(),
      encPassword.trim()
    ).toString();
    return encryptedData;
  }

  decryptObjectData(response: any) {
    if (!response.data) return false;
    const decPassword = environment.CRYPTOSECRET;
    const decryptedOutput = CryptoJS.AES.decrypt(
      response.data.trim(),
      decPassword.trim()
    ).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedOutput);
  }

  decryptionData(data: any) {
    if (data) {
      const decPassword = environment.CRYPTOSECRET;
      const conversionDecryptOutput = CryptoJS.AES.decrypt(
        data.trim(),
        decPassword.trim()
      ).toString(CryptoJS.enc.Utf8);
      return conversionDecryptOutput;
    }
  }
}
