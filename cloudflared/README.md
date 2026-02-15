Cloudflared (Cloudflare Tunnel) setup

This folder holds the `cloudflared` tunnel configuration and the credentials file that `cloudflared` uses to authenticate with Cloudflare's edge.

One-time steps (on your machine):

1. Install `cloudflared` locally (https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation)

2. Login and create the tunnel (run these in your terminal and follow the browser prompts):

```bash
cloudflared login
cloudflared tunnel create lockpc
```

After `tunnel create` you will get a tunnel UUID and a credentials file like `<TUNNEL-UUID>.json`.

3. Map the tunnel to your DNS name (replace with your real domain):

```bash
cloudflared tunnel route dns lockpc lockpc.yourdomain.tld
```

4. Copy the credentials JSON into this repo folder `./cloudflared/` so the container can mount it. Rename the file to match the `credentials-file` value in `config.yml` or update `config.yml` accordingly.

5. Start the tunnel container:

```bash
docker compose up -d cloudflared
```

Notes
- The `config.yml` in this folder is an example. Update `tunnel`, `credentials-file`, and `hostname` fields after creating the tunnel.
- The `cloudflared` container runs on the same Docker network as the `server` service, and `service: http://server:3000` forwards traffic to the server container.
- If you prefer to run `cloudflared` outside Docker, the same `config.yml` and credentials file will work.
