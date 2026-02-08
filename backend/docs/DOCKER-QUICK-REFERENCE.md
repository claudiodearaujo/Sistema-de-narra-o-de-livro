# 🐳 Docker Redis - Quick Reference

## 📦 Files Created

```
docker-compose.yml              # Redis only (quick setup)
docker-compose.full.yml         # Full stack (Redis + Backend + DB)
Dockerfile.redis                # Custom Redis image
redis.conf                       # Redis configuration
.env.redis                       # Environment variables
redis-manage.ps1               # Windows management script
redis-manage.sh                # Linux/Mac management script
.dockerignore                  # Docker ignore patterns
DOCKER-SETUP.md               # Comprehensive guide
```

---

## 🚀 Commands

### Using docker-compose directly

```bash
# Start Redis
docker-compose up -d

# Stop Redis
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart
docker-compose restart

# Remove everything
docker-compose down -v  # -v removes volumes!
```

### Using Management Script (Windows)

```powershell
# Start
.\redis-manage.ps1 -Command up

# Stop
.\redis-manage.ps1 -Command down

# Restart
.\redis-manage.ps1 -Command restart

# Check status
.\redis-manage.ps1 -Command status

# View logs
.\redis-manage.ps1 -Command logs

# Connect to Redis CLI
.\redis-manage.ps1 -Command cli

# View Redis info
.\redis-manage.ps1 -Command info

# Backup data
.\redis-manage.ps1 -Command backup

# Flush all data (⚠️ WARNING!)
.\redis-manage.ps1 -Command flush

# Get help
.\redis-manage.ps1 -Command help
```

### Using Management Script (Linux/Mac)

```bash
# Make executable
chmod +x redis-manage.sh

# Then use same commands as Windows
./redis-manage.sh up
./redis-manage.sh cli
./redis-manage.sh backup
# etc...
```

---

## 🔌 Testing Connection

### From Command Line
```bash
# Ping Redis
docker-compose exec redis redis-cli ping
# Should return: PONG

# Test SET/GET
docker-compose exec redis redis-cli SET test hello
docker-compose exec redis redis-cli GET test
# Should return: hello
```

### From Application
```javascript
const IORedis = require('ioredis');
const redis = new IORedis({
  host: 'localhost',
  port: 6379
});

redis.ping((err, result) => {
  console.log(result);  // Should print: PONG
});
```

---

## 📊 Monitoring

### Check Running Containers
```bash
docker ps
docker ps -a  # All containers
```

### View Resource Usage
```bash
docker stats
docker stats sistema-narracao-redis
```

### View Logs
```bash
docker-compose logs
docker-compose logs -f              # Follow logs
docker-compose logs --tail=50       # Last 50 lines
docker-compose logs --since=1h      # Last hour
```

---

## 🔧 Configuration

### Edit Redis Config
```bash
# Edit redis.conf
# Common changes:

# Max memory
maxmemory 256mb          # Change to 512mb, 1gb, etc

# Add password
requirepass mypassword

# Change save policy
save 900 1
save 300 10
save 60 10000

# Then restart
docker-compose restart
```

### Edit Docker Compose
```bash
# Edit docker-compose.yml
# Change port:
ports:
  - "6380:6379"  # Access on 6380 instead of 6379

# Change volume path:
volumes:
  - /custom/path:/data

# Then restart
docker-compose restart
```

---

## 💾 Backup & Restore

### Backup
```bash
# Using management script
.\redis-manage.ps1 -Command backup
# Creates: redis_backups/redis_backup_YYYYMMDD_HHMMSS.rdb

# Manual backup
docker-compose exec redis redis-cli BGSAVE
docker cp sistema-narracao-redis:/data/dump.rdb ./my_backup.rdb
```

### Restore
```bash
# Copy backup to volume
docker cp my_backup.rdb sistema-narracao-redis:/data/dump.rdb

# Restart Redis
docker-compose restart

# Verify
docker-compose exec redis redis-cli DBSIZE
```

---

## 🧹 Cleanup

### Remove Container Only (keep data)
```bash
docker-compose down
```

### Remove Container & Data (⚠️ DELETES EVERYTHING!)
```bash
docker-compose down -v
```

### Remove Images
```bash
docker rmi sistema-narracao-redis:latest
docker image prune  # Remove unused images
```

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find what's using port 6379
lsof -i :6379           # Linux/Mac
netstat -ano | findstr :6379  # Windows

# Kill process or change port in docker-compose.yml
```

### Redis Not Starting
```bash
# Check logs
docker-compose logs redis

# Restart
docker-compose restart

# Full rebuild
docker-compose down -v
docker-compose up -d
```

### Connection Refused
```bash
# Verify Redis is running
docker ps | grep redis

# Check port mapping
docker port sistema-narracao-redis

# Test connection
redis-cli -h localhost -p 6379 ping
```

### Out of Memory
```bash
# Check current usage
docker stats

# Connect and check
docker-compose exec redis redis-cli INFO memory

# Increase in redis.conf
maxmemory 512mb  # Increase from 256mb
```

---

## 🔒 Security

### Add Password

1. Edit `redis.conf`:
   ```conf
   requirepass your_secure_password_123
   ```

2. Update `.env.redis`:
   ```env
   REDIS_PASSWORD=your_secure_password_123
   ```

3. Restart:
   ```bash
   docker-compose restart
   ```

### Connect with Password
```bash
# Via CLI
docker-compose exec redis redis-cli -a your_password

# Via application
const redis = new IORedis({
  host: 'localhost',
  port: 6379,
  password: 'your_password'
});
```

---

## 📈 Full Stack (All Services)

### Start Everything
```bash
docker-compose -f docker-compose.full.yml up -d
```

### Services Running
- Redis: `localhost:6379`
- PostgreSQL: `localhost:5432`
- Backend API: `localhost:3000`

### Check All Services
```bash
docker-compose -f docker-compose.full.yml ps
```

### Logs for Specific Service
```bash
docker-compose -f docker-compose.full.yml logs redis
docker-compose -f docker-compose.full.yml logs backend
docker-compose -f docker-compose.full.yml logs postgres
```

---

## 📚 More Information

- **Setup Guide**: `DOCKER-SETUP.md`
- **Redis Config**: `redis.conf`
- **Quick Start**: `REDIS-QUICKSTART.md`
- **Full Integration**: `REDIS-INTEGRATION.md`

---

## 🎯 Common Workflows

### Daily Usage
```bash
# Start Redis
.\redis-manage.ps1 -Command up

# Start backend
npm start

# When done
.\redis-manage.ps1 -Command down
```

### Backup Before Shutdown
```bash
.\redis-manage.ps1 -Command backup
.\redis-manage.ps1 -Command down
```

### Monitor During Development
```bash
# Terminal 1
docker-compose logs -f

# Terminal 2
npm start

# Terminal 3
node test-integration.js
```

### Production Deployment
```bash
# Build image
docker build -f Dockerfile.redis -t my-redis:latest .

# Run with docker-compose.full.yml
docker-compose -f docker-compose.full.yml up -d

# Verify health
docker-compose -f docker-compose.full.yml ps
```

---

**Everything is ready to deploy!** 🚀
