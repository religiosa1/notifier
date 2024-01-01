//@ts-check
const { join } = require("path");

module.exports = {
  apps : [
		{
			name: "notifier",
			script: "./packages/server/dist/index.js",
			env_production: {
				NODE_ENV: "production",
			},
			env_development: {
				NODE_ENV: "development"
			},
		},
		{
			name: "notifier-admin",
			script: "./packages/admin/build/index.js",
			env: {
				API_URL: "http://127.0.0.1:8085/",
			},
			env_production: {
				NODE_ENV: "production",
				PROTOCOL_HEADER: "X-Forwarded-Proto",
				HOST_HEADER: "X-Forwarded-Host",
			},
			env_development: {
				NODE_ENV: "development",
				ORIGIN: "http://localhost:5173/",
			},
		},
	]
}
