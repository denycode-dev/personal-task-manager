import ImageKit from "@imagekit/nodejs";

let _client: ImageKit | null = null;

export function getImageKitClient(): ImageKit {
  if (!_client) {
    _client = new ImageKit({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    });
  }
  return _client;
}