# Lock PC – Home Server & Dashboard

The "brain" of **Lock PC**. This is the website where you log in to decide when your computers can be used, and the behind-the-scenes service that the Windows and Android apps all talk to.

It's designed to run on a computer at home, so there are no monthly cloud bills.

## What the dashboard lets you do

- **Manage your computers** – see every PC linked to your account and whether it's online.
- **Set lock times** – choose when each computer should be locked, day by day.
- **Add reminders** – they show up on the locked PC and on the reminders phone app.
- **Lock or unlock on demand.**
- **See the reminders phone on a map.**
- **Admin tools** – manage user accounts, reset passwords and sign people out.

## It also powers…

The same home server quietly runs a few other projects and makes them available online:

- **Gig Manager** – online backup for the [gig-manager](https://github.com/sysqo82/gig-manager) app
- **Album Map Maker** – [album-map-maker](https://github.com/sysqo82/album-map-maker)
- **Tier List Maker** – [tier-list-maker](https://github.com/sysqo82/tier-list-maker)

## How it's built

- **Server:** **Node.js** with **Express**. The web pages are built with **EJS** templates.
- **Live connection to the PCs:** **Socket.IO** keeps each Windows PC connected, so lock and unlock commands arrive instantly.
- **Database:** **PostgreSQL**, holding users, PCs, lock times, reminders, locations, gig backups and an activity log.
- **Logins:** passwords are scrambled with **bcrypt**. The website uses sessions, and the phone apps use tokens (**JWT**).
- **Packaging:** three **Docker** containers – the database, the server, and a **Cloudflare Tunnel** that puts it online.

### Project layout

```
server.js        the main server and all its routes
database.js      the database connection
views/           the dashboard web pages
public/          browser scripts and styles
cloudflared/     settings for the Cloudflare tunnel
reset-password.js   a helper for resetting a user's password
```

## Running it yourself

You'll need **Docker** and **Docker Compose**.

1. Create a `.env` file with:
   ```
   DB_USER=...
   DB_PASSWORD=...
   SESSION_SECRET=a-long-random-string
   ```
2. Start it: `./start.sh` (or `docker compose up -d`).
3. Open `http://localhost:3000` and create an account.

Your data is kept in a Docker volume, so it survives restarts.

**Handy commands**

| To… | Run |
|---|---|
| See what's happening | `docker compose logs -f` |
| Stop it | `./stop.sh` |
| Back up the database | `docker exec lockpc-postgres pg_dump -U lockpc_user lockpc_db > backup.sql` |
| Restore a backup | `cat backup.sql \| docker exec -i lockpc-postgres psql -U lockpc_user -d lockpc_db` |

To reach it from outside your home (for the phone apps), set up a Cloudflare tunnel – see `cloudflared/README.md`.

## The Lock PC family

| Project | What it is |
|---|---|
| [lock-pc](https://github.com/sysqo82/lock-pc) | The Windows app that does the locking |
| **lock-pc-local** | The server and web dashboard, run from home (this one) |
| [lock-pc-android](https://github.com/sysqo82/lock-pc-android) | Phone app for managing schedules on the go |
| [lock-pc-android-reminders](https://github.com/sysqo82/lock-pc-android-reminders) | Phone app that receives reminders |
| [lock-pc-server](https://github.com/sysqo82/lock-pc-server) | The earlier cloud-hosted version of the server |
