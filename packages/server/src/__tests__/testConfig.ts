import type { ServerConfig } from "@shared/models";

// Config with fake tokens and secrets for testing
export const testConfig: Readonly<ServerConfig> = Object.freeze({
	botToken: "1234567890:AAF3gtwgXssGbqYZLX8Ruk3k6UQivjLuYeQ",
	jwtSecret: "7OUk0cJ/TvQf6heX8aEa0PnSm+s+9sAiR9blDXwZPEHx6X0emP4zJn8VR0rDZllwnl8JuyErJ5wNLXyf4ckig8prExZAOPnEz9Ybrys5db5pMEAb2L7tIt6BGovTX6vLtFLdNT9Cgi9PI1lHP13wD17ty0u4bnVB3+8sDTc9p/emR3BPygrM1aZMDAC5llC7nG6AMIao8UcRu7hdJ13Hg3EiAfMWoLXMztHIXO6kw5Zjs+enV5G0dSTpLUg5Eb0YlST953tRCQn0NAZfb/ybMDttV9zBzieMVf5R5mWHQ+C3Z5G5ydwcX4q/8j+4NkT+OYMycKe1uhTTQgIO93vcbA==",
	tgHookSecret: undefined,
	publicUrl: "https://example.com",
	databaseFileName: ":memory:"
});