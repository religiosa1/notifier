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

The default [compose.yml](../compose.yml) contains those two containers 
and nginx for reverse proxying the request. You still need to supply 
certificate file to it.

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

You can overrride name of those headers via BUILD_ARGS while building the image:
	- PROTOCOL_HEADER: "X-Forwarded-Proto"
	- HOST_HEADER: "X-Forwarded-Host"

If you don't use a reverse proxy or want to launch the container locally, 
you should supply the ORIGIN environmental variable to override it.

```sh
docker run --env=ORIGIN=https://your-website.com -f ./packages/admin/Dockerfile .
```

Please notice, that origin address should NOT contain the trailing slash.
Also, you will require an ssl for the backend's web hook to work, so specifying
ORIGIN usecases are limited.

docker-compose files handles all that for you.

### notifier-backend
notifier-backend __requires__ some kind of reverse proxy and SSL certificate to 
function. Besides that it also requires:
[volume](https://docs.docker.com/engine/reference/commandline/container_run/#volume) 
  for storing the settings file.

```sh
docker compose -f ./compose.nginx.yml up --build
```