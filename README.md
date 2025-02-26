# Description

This repository contains a `docker-compose.yml` file that sets up a [Kasm-based](https://kasmweb.com/) environment with an Ubuntu Focal desktop and an Nginx server. The configuration allows connection via VNC and HTTPS.

![Example](example.png?raw=true "Example")

## Prerequisites

Before running `docker-compose.yml`, make sure you meet the following requirements:

- Docker and Docker Compose must be installed on your system.
- Access to an external network called `custom_network`.

## Services

### 1. kasmweb-ubuntu-focal-desktop

This service provides a remote desktop based on Ubuntu Focal using the `kasmweb-ubuntu-focal-desktop:root` image.

- Runs in privileged mode.
- Exposes the following ports:
  - `4901` (Audio)
  - `5901` (VNC)
  - `6901` (Web Interface)
- Mounts volumes for uploads and downloads:
  - `./ubuntu/uploads/ -> /home/kasm-user/Uploads/`
  - `./ubuntu/downloads/ -> /home/kasm-user/Downloads/`
- Uses the `proxynet` network.
- Configures the `VNC_PW` environment variable for VNC authentication.

### 2. kasmweb-nginx

This service provides an Nginx server to manage connections.

- Uses the official `nginx` image.
- Exposes port `443` (HTTPS).
- Mounts volumes:
  - `./nginx/nginx.conf -> /etc/nginx/nginx.conf` (Nginx configuration)
  - `./nginx/ssl/ -> /etc/nginx/ssl/` (SSL certificates)
  - `./nginx/users/ -> /etc/nginx/users/` (Users and passwords)
- Uses the `proxynet` network.

## Network Configuration

The `docker-compose.yml` file assumes the existence of an external network called `custom_network`. If it does not exist, create it with:

```sh
sudo docker network create custom_network
```

## Installation and Execution

1. Build the images (if needed):
   ```sh
   sudo docker-compose build
   ```
2. Start the services in detached mode:
   ```sh
   sudo docker-compose up -d
   ```
3. Check running containers:
   ```sh
   sudo docker ps
   ```

## Stop and Remove Containers

To stop the services:

```sh
sudo docker-compose down
```

This will remove the containers but keep the volumes and network.

## Remote Desktop Access

- **VNC**: Connect to `vnc://localhost:5901` using the password set in `VNC_PW`.
- **Web Interface** (local): Open `http://localhost:6901/` in a browser.
- **Web Interface** (from the Internet): Access via Nginx at `https://<domain_or_IP>` using port `443`.

## Adding Users to htpasswd

To add users for basic authentication in Nginx using `htpasswd`, follow these steps:

1. Install `apache2-utils` if not already installed:
   ```sh
   sudo apt-get install apache2-utils
   ```
2. Create or update the user file in `./nginx/users/htpasswd`:
   ```sh
   htpasswd -c ./nginx/users/htpasswd new_user
   ```
   *Note:* Use `-c` only the first time to create the file. To add more users, omit `-c`.
3. Enter the password when prompted.
4. Restart Nginx to apply changes:
   ```sh
   sudo docker-compose restart kasmweb-nginx
   ```

## Notes

- Modify the volume paths according to your needs.
- Ensure you have SSL certificates in `./nginx/ssl/` if you want to enable HTTPS.
- To change the VNC password, edit the `VNC_PW` value in `docker-compose.yml`.

## Author

This project was configured to facilitate the execution of a remote desktop in Docker containers with secure access via Nginx.

