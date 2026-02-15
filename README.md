# Lock PC Server - Docker Local Setup

Complete Docker-based setup for running the Lock PC server locally with **$0/month cost** (no cloud services needed).

## 🎯 What This Is

This is a fully containerized version of your Lock PC server that runs entirely on your local PC:
- **PostgreSQL database** in a Docker container
- **Express server** in a Docker container  
- **No AWS, no Google Cloud** - completely free
- **Persistent data** stored in Docker volumes

## 📋 Prerequisites

1. **Docker Desktop** (Windows/Mac) or **Docker + Docker Compose** (Linux)
   - Download: https://www.docker.com/products/docker-desktop/
   - Make sure Docker is running before starting the server

2. **LocalTunnel** (optional, for remote access from Android app)
   ```bash
   npm install -g localtunnel
   ```

## 🚀 Quick Start

### Option 1: Local Only (No Remote Access)
```bash
./start.sh
```
Access at: http://localhost:3000

### Option 2: Local + Remote Access (Android App)
```bash
./start-with-tunnel.sh
```
- Local: http://localhost:3000
 - Remote: https://dashboard.lockpc.co.uk (or shown in output)

## 🛠️ Configuration

### Environment Variables
Edit [.env](.env) to customize:
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `SESSION_SECRET` - Change to a random string

### Database Schema
The database schema is automatically created from [init-db.sql](init-db.sql) when the container first starts. It includes:
- `users` - User accounts
- `pc_settings` - PC registrations
- `block_periods` - Time blocks
- `reminders` - User reminders
- `audit_logs` - Activity logs

## 📱 Android App Configuration

For the Android app to connect, update these files:

**app/src/main/java/com/yourpackage/ApiConfig.kt:**
```kotlin
object ApiConfig {
    // For local testing on same network:
    const val BASE_URL = "http://YOUR_PC_IP:3000/"
    
    // For remote access via tunnel:
    const val BASE_URL = "https://dashboard.lockpc.co.uk/"
}
```

**app/src/main/java/com/yourpackage/NetworkClient.kt:**
```kotlin
// Add this header to bypass LocalTunnel password page
reqBuilder.addHeader("bypass-tunnel-reminder", "true")
```

## 🔧 Management Commands

### View Logs
```bash
docker-compose logs -f          # All services
docker-compose logs -f server   # Server only
docker-compose logs -f postgres # Database only
```

### Stop Server
```bash
./stop.sh
# or
docker-compose down
```

### Restart Server
```bash
docker-compose restart
```

### Database Backup
```bash
docker exec lockpc-postgres pg_dump -U lockpc_user lockpc_db > backup.sql
```

### Database Restore
```bash
cat backup.sql | docker exec -i lockpc-postgres psql -U lockpc_user -d lockpc_db
```

### Complete Reset (Delete All Data)
```bash
docker-compose down -v
./start.sh
```

## 📂 File Structure

```
lock-pc-local/
├── server.js              # Main Express application
├── database.js            # Database connection pool
├── package.json           # Node.js dependencies
├── Dockerfile             # Server container configuration
├── docker-compose.yml     # Multi-container orchestration
├── init-db.sql           # Database schema
├── .env                  # Environment variables
├── start.sh              # Quick start script
├── start-with-tunnel.sh  # Start with remote access
├── stop.sh               # Stop script
├── views/                # EJS templates
│   ├── dashboard.ejs
│   ├── home.ejs
│   ├── login.ejs
│   └── register.ejs
└── public/               # Static assets
    ├── api-config.js
    ├── block_periods.js
    ├── reminders.js
    └── css/
        └── style.css
```

## 💾 Data Persistence

Database data is stored in a Docker volume named `lock-pc-local_postgres-data`. This means:
- ✅ Data persists across container restarts
- ✅ Data persists when you stop/start with `docker-compose down`
- ❌ Data is deleted if you run `docker-compose down -v`

To backup your data before deleting:
```bash
docker exec lockpc-postgres pg_dump -U lockpc_user lockpc_db > backup_$(date +%Y%m%d).sql
```

## 🌐 Remote Access Options

### Option 1: LocalTunnel (Free, but less reliable)
```bash
lt --port 3000 --subdomain lockpc
# URL: https://dashboard.lockpc.co.uk
# Requires password: Your public IP address
```

**Pros:** Free, no signup  
**Cons:** Can disconnect, password page on web browsers

### Option 2: ngrok ($8/month)
```bash
ngrok http 3000
```

**Pros:** More reliable, custom domains  
**Cons:** Costs money

### Option 3: Port Forwarding (Free, requires router access)
1. Forward port 3000 on your router to your PC's local IP
2. Access via `http://YOUR_PUBLIC_IP:3000`

**Pros:** Free, no third-party service  
**Cons:** Exposes your home IP, security risk

## 💰 Cost Comparison

| Setup | Monthly Cost |
|-------|-------------|
| **This (Docker Local)** | **$0** |
| Google Cloud (old) | $50-100 |
| AWS RDS + Lambda | $15-30 |
| ngrok Pro | $8 |

## 🔒 Security Notes

- Change `SESSION_SECRET` in [.env](.env) to a random string
- Database password is in [.env](.env) - keep this file private
- For remote access, consider using ngrok or setting up proper firewall rules
- LocalTunnel is convenient but less secure than paid alternatives

## ❓ Troubleshooting

### Server won't start
```bash
# Check if Docker is running
docker info

# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### Can't access from Android app
1. Make sure server is running: `curl http://localhost:3000`
2. Check tunnel is working (if using): `curl https://dashboard.lockpc.co.uk`
3. Verify Android app has correct URL in ApiConfig.kt
4. Check Android app has bypass header in NetworkClient.kt

### Database connection errors
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker-compose logs postgres

# Reconnect
docker-compose restart postgres
docker-compose restart server
```

### Port 3000 already in use
Edit [docker-compose.yml](docker-compose.yml) and change:
```yaml
ports:
  - "3001:3000"  # Change 3000 to another port
```

## 🎉 Success!

If everything is working:
1. You can access the dashboard at http://localhost:3000
2. Create a user account
3. Connect your Android app
4. **Shut down Google Cloud** to save $50-100/month!
5. **Shut down AWS RDS** to save $15/month!

Total savings: **$65-115/month** = **$780-1380/year**! 🎊
