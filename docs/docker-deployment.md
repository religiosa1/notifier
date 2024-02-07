# Deployment via docker

Docker is probably the easiest way to deploy the application, as it handles
almost all of the configuration.

## Prerequisites

- hosting with [docker](https://www.docker.com/) installed or cloud provider
- domain name and SSL certificate to organize HTTPS connection for the bot
- telegram bot created bia BotFather as described 
	[here](https://core.telegram.org/bots/tutorial#getting-ready).

## Available containers and compose files

The application provides consists of two separate containers:

- [notifier-backend](../packages/server/Dockerfile) bot webhook and REST API 
- [notifier-admin](../packages/admin/Dockerfile) admin interface

There are also two separate docker-compose files for easier deployment.

The default [compose.yml](../compose.yml) contains those two containers and an
instance of [PostgreSQL](https://hub.docker.com/_/postgres) required for the 
backend, but it leaves for you the setup of reverse-proxy and SSL certificates.

[compose.nginx.yml](../compose.nginx.yml) also handles the reverse-proxy via
nginx, in case you need to setup a single HTTP connection, but you still need 
to supply the certificate file to it.

## Containers args and details
Please notice that all of the containers should be built out of the root of the
monorepo (git clone path), as they require [shared](../packages/shared/README.md)
package to be available in the build context. The exact command to build each
of them is provided in their respective Dockerfiles.

### notifier-admin
In normal operation -- that is behind the reverse proxy -- notifier-admin
assumes that you supply actual public domain name and protocol in the forwarded 
request headers. This is ususally handled by nginx, please refer to the provided
[nginx.conf](../nginx.conf) section of self-hosted deployment guide for the 
reference.

You can overrride name of those headers via BUILD_ARGS:
	- PROTOCOL_HEADER: "X-Forwarded-Proto"
	- HOST_HEADER: "X-Forwarded-Host"

If you don't use a reverse proxy or want to launch the container locally, 
you should supply the ORIGIN build arg manually.

```sh
docker build -t notifier-admin -f ./packages/admin/Dockerfile . --build-arg=ORIGIN=https://your-website.com
```

Please notice, that origin address should NOT contain the trailing slash.
Also, you will require an ssl for the backend's web hook to work, so specifying
ORIGIN usecases are limited.

In any case you also need to specify the backend URL location in the build args.

```sh
docker build ... --build-arg=API_URL=http://your-backend-address:8085/
```
docker-compose files handles all that for you.

### notifier-backend
notifier-backend __requires__ some kind of reverse proxy and SSL certificate to 
function. Besides that it also requires:
1. [volume](https://docs.docker.com/engine/reference/commandline/container_run/#volume) 
  for storing the settings file.
2. PosgresSQL connection. Connection parameters can be specified after the first 
launch in the settings wizards.

## compose files

### Regular compose file

Provides definitions for admin, backend and PosgtreSQL instance.
You must provide SSL certificate for backend and admin.

### Built-in Nginx version

Wraps the initial compose setup with a nginx instance, so it exposes only one 
http connection.

```sh
docker compose -f .\compose.nginx.yml up --build
```