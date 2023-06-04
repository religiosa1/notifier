module.exports = {
  apps : [
		{
			name   : "notifier",
			script : "./packages/server/dist/index.js",
			env_production: {
				NODE_ENV: "production"
			},
			env_development: {
				NODE_ENV: "development"
			}
		},
		{
			name   : "notifier-admin",
			script : "./packages/admin/build/index.js"
		},
	]
}
