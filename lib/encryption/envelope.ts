import { randomBytes } from "crypto";
import { encrypt, decrypt, type EncryptedPayload } from "./aes-gcm";
import { getMasterKey } from "./key";

export type EnvelopeResult = {
  contentCiphertext: string;
  contentIv: string;
  contentAuthTag: string;
  dekWrapped: string;
  dekWrapIv: string;
  dekWrapAuthTag: string;
};

export function envelopeEncrypt(plaintext: string): EnvelopeResult {
  const dek = randomBytes(32);
  const contentPayload = encrypt(plaintext, dek);
  const dekPayload = encrypt(dek.toString("base64"), getMasterKey());

  return {
    contentCiphertext: contentPayload.ciphertext,
    contentIv: contentPayload.iv,
    contentAuthTag: contentPayload.authTag,
    dekWrapped: dekPayload.ciphertext,
    dekWrapIv: dekPayload.iv,
    dekWrapAuthTag: dekPayload.authTag,
  };
}

export function envelopeDecrypt(data: EnvelopeResult): string {
  const dekBase64 = decrypt(
    {
      ciphertext: data.dekWrapped,
      iv: data.dekWrapIv,
      authTag: data.dekWrapAuthTag,
    },
    getMasterKey()
  );
  const dek = Buffer.from(dekBase64, "base64");
  return decrypt(
    {
      ciphertext: data.contentCiphertext,
      iv: data.contentIv,
      authTag: data.contentAuthTag,
    },
    dek
  );
}