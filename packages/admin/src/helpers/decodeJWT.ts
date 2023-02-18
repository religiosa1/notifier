import { tokenPayloadSchema, type TokenPayload } from "@shared/models/TokenPayload";

export function decodeJWT(data: string): TokenPayload {
  if (typeof data !== "string") {
    throw new TypeError();
  }
  data = data.replace(/^Bearer\s+/, "");
  const [, payload] = data.split(".", 3) || [];
  if (!payload) {
    throw new Error("incorrect JWT token format");
  }
  const stringData = atob(payload);
  const dp = JSON.parse(stringData);
  return tokenPayloadSchema.parse(dp);
}
