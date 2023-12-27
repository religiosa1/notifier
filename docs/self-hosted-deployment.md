# Manual deployment on an Ubuntu server

Here's a description of how you can deploy this application as a self-hosted service.
Deployment on `Ubuntu Server 22.04 Jammy` used as an example, but any Linux or 
Windows machine will do, you just need to modify the installation procedure 
so it works with the package manager available on your system.

This is the most complicated way of deploy, but the one that gives you the most
authority and flexibility.

## Prerequisites

First of all you need a server/hosting where you want to deploy the app.
As mentioned above, almost anything should work, but you can make sure that all 
of 3d party services are supported on your hosting.

You also will need a domain name, because we need to tie a SSL certificate, to 
use application's and telegram's APIs safely. It's DNS record should be configured to 
point to your hosting.

Then you need to create a telegram bot, that will be sending the notifications.
This only takes a couple of minutes and is free. You can read more about it 
[here](https://core.telegram.org/bots/tutorial#getting-ready).

You also need the source code of this application available on your server,
either cloned via git or downloaded directly.

```sh
sudo apt install git #if you don't have it allready
cd /var/www
git clone git@github.com:religiosa1/notifier.git
```

## 3d party software requirements

The application requires [node js](https://nodejs.org/en) (version 20 or above) 
and [postgresql](https://www.postgresql.org/) to operate.

Besides that, it will be both easier and more effective for us to use 
[nginx](https://www.nginx.com/) as a reverse proxy, [certbot](https://certbot.eff.org/) 
to get and renew SSL certificates and a process manager for node such as 
[pm2](https://pm2.keymetrics.io/), so the service will automatically restart, if
the server went for a reboot (among other good things it provides).

In this document, this kind of setup is described.

### Installing node and postgres

Follow node's [official instruction](https://nodejs.org/en/download/package-manager) to 
install node version 20 on your server. 

After the installation check that both `npm --version` and `node --version` commands run
successfully, and node's version is 20.x.x or higher.

Postgresql can be installed through the package manager directly. 
```sh
sudo apt install postgresql
```

After the installation you need to create a user and database for the service.

```sh
sudo -u postgres psql # this will open postgres console
```

```sql
CREATE USER notifier;
CREATE DATABASE notifierdb; 
ALTER USER notifier with encrypted password 'qwerty';
GRANT all privileges on DATABASE notifierdb to testuser;
```

After running each of those lines you should see the success message from the 
psql console, after which you can type exit.

You can check, that db was created successfully by trying to log into it:

```sh
psql -d postgres://notifier:qwerty@127.0.0.1:5432/notifierdb
```

### Installing nginx and certbot

`nginx` can be installed directly from the package manager.

```sh
sudo apt install nginx 
```

After the installation we need to create a config for the site in the
file `/etc/nginx/sites-available/name-of-your-site`.

This file should contain the following settings (SSL part will be added in the next steps):

```
server {
	server_name fqd-of-your-service.example.com;

	# assuming you ran `git clone` in /var/www
	root /var/www/notifier/packages/admin/build/client/;

	location / {
		proxy_set_header X-Forwarded-Proto $scheme;
		proxy_set_header X-Forwarded-Host $host;
		proxy_pass http://127.0.0.1:3000/;
	}
	# Bot's service doesn't need to be exposed to the outside world, if it will be only
	# communicated with through the admin. But we still need to expose bot's webhook:
	location /bot {
		proxy_pass http://127.0.0.1:8085/bot;
	}
	# ... and notification API:
	location /notify {
		proxy_pass http://127.0.0.1:8085/notify;
	}
}
```

After the config was created you need to enable it by running:

```sh
ln -s /etc/nginx/sites-available/name-of-your-site /etc/nginx/sites-enabled
```

Installation of certbot is described on [their website](https://certbot.eff.org/) 
just pick "I'm using nginx on Ubuntu 22.04" in the dropdown bellow and follow 
the instructions.

After certbot is installed just run `sudo certbot` in the console and select
the website created at the prevous step. Certbot should automatically obtain
an SSL certificate and install it into your website, updating the config.

### Installing pm2 

## Building and launching the service

After all of the required software is installed, building and laucnhing the service 
itself should be pretty straightforward.

In the root directory of the app (the dir where you cloned the app to) run:
```sh
npm install
npm run build
```

There's a prepared pm2 ecosystem file, to run both backend and admin, so to start the 
application you can run 

```sh
pm2 start ecosystem.config.js --env production
```
Please, notice the usage of environment vatiables:
```
PROTOCOL_HEADER=X-Forwarded-Proto
HOST_HEADER=X-Forwarded-Host
```

They specify the public admin address being forwarded from nginx, so we can setup 
the CORS correctly.