import { base32, base64 } from "rfc4648";

/** Isomorphic secret key generation.
 * Works on both backend and frontend to generate secret keys for settings.
 */
export async function generateSecretKey(encoding: "base32" | "base64" = "base64", length?: number) {
	const key = await crypto.subtle.generateKey(
		{ 
			name: 'HMAC', 
			hash: { name: 'SHA-512' },
			length,
		},
		true,
		['sign', 'verify']
	);	
	const keyData = await crypto.subtle.exportKey('raw', key);
	const encoder = encoding === "base32" ? base32 : base64; 
	const secret = encoder.stringify(new Uint8Array(keyData));
	if (encoding === "base32") {
		return secret.replaceAll("=", "_");
	}
	return secret;
}
