# 🐳 Docker Setup Guide - Redis, Backend & Database

## 📋 What's Included

This directory contains everything needed to run the Sistema de Narração de Livros with Docker:

- ✅ **docker-compose.yml** - Redis only (quick setup)
- ✅ **docker-compose.full.yml** - Complete stack (Redis + Backend + Database)
- ✅ **Dockerfile.redis** - Custom Redis image with configuration
- ✅ **redis.conf** - Redis configuration file
- ✅ **redis-manage.sh** - Management script (Linux/Mac)
- ✅ **redis-manage.ps1** - Management script (Windows PowerShell)

---

## 🚀 Quick Start

### Option 1: Redis Only (Current Docker Setup)

```bash
# Start Redis
docker-compose up -d

# Verify it's running
docker ps | grep redis

# Check logs
docker-compose logs -f
```

### Option 2: Full Stack (Production)

```bash
# Copy env template
cp .env.redis .env

# Edit .env with your settings
# Start everything
docker-compose -f docker-compose.full.yml up -d

# Verify all services
docker-compose -f docker-compose.full.yml ps
```

---

## 📁 Files Explained

### docker-compose.yml
Simple single-service compose file for Redis only.

**Services**:
- Redis 7.0 Alpine (lightweight)

**Features**:
- Health check
- Volume persistence
- Named network
- Restart policy
- Logging configuration

**Usage**:
```bash
docker-compose up -d
docker-compose down
docker-compose logs -f
```

### docker-compose.full.yml
Complete stack with all services.

**Services**:
- PostgreSQL 15 (database)
- Redis 7 (queue/cache)
- Backend API (if Dockerfile exists)

**Features**:
- Service dependencies
- Health checks
- Networking
- Environment configuration

**Usage**:
```bash
docker-compose -f docker-compose.full.yml up -d
docker-compose -f docker-compose.full.yml down
```

### redis.conf
Redis configuration file with:

**Persistence**:
- RDB snapshots (save points)
- AOF (Append Only File) for durability
- Both enabled by default

**Performance**:
- 256MB max memory
- LRU eviction policy
- Optimized settings

**Security**:
- protected-mode enabled
- Optional password support

**Edit** for custom settings:
```bash
# Increase max memory
maxmemory 512mb

# Enable password
requirepass your_strong_password_here
```

### Dockerfile.redis
Custom Redis image with configuration.

**Based on**: `redis:7-alpine` (lightweight)
**Features**:
- Custom config file
- Health check
- Optimized for production

**Build**:
```bash
docker build -f Dockerfile.redis -t sistema-redis:latest .
```

### Management Scripts

#### Windows (PowerShell)
```bash
# Make executable
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Run commands
.\redis-manage.ps1 -Command up
.\redis-manage.ps1 -Command status
.\redis-manage.ps1 -Command cli
.\redis-manage.ps1 -Command backup
```

#### Linux/Mac (Bash)
```bash
# Make executable
chmod +x redis-manage.sh

# Run commands
./redis-manage.sh up
./redis-manage.sh status
./redis-manage.sh cli
./redis-manage.sh backup
```

**Available Commands**:
- `up` - Start Redis
- `down` - Stop Redis
- `restart` - Restart Redis
- `status` - Check status
- `logs` - View logs
- `cli` - Connect to Redis CLI
- `info` - Show Redis info
- `flush` - Delete all data (⚠️ WARNING!)
- `backup` - Backup Redis data

---

## 🔧 Configuration

### .env.redis
Example environment configuration file.

Copy and customize:
```bash
cp .env.redis .env
```

Variables:
```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

For Docker Compose:
```env
REDIS_PASSWORD=your_password_here
```

---

## 🔌 Docker Networks

### narracao_network
Bridge network created automatically for service communication.

Services connect to it:
- Redis: `redis:6379`
- PostgreSQL: `postgres:5432`
- Backend: `backend:3000`

### Connection Examples

**From Backend** (docker-compose.full.yml):
```typescript
// Connect to Redis
const redis = new IORedis({
  host: 'redis',  // Service name (DNS resolution)
  port: 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

// Connect to Database
const db = 'postgresql://postgres:password@postgres:5432/db';
```

**From Host (localhost)**:
```bash
redis-cli -h localhost -p 6379
psql -h localhost -U postgres -d database
curl http://localhost:3000
```

---

## 📊 Volumes & Persistence

### redis_data Volume
Persistent storage for Redis data.

**Location**: `/data` inside container

**On Host**: Docker's managed storage (usually `/var/lib/docker/volumes/`)

**Backup**:
```bash
docker-compose exec redis redis-cli BGSAVE
docker cp sistema-narracao-redis:/data/dump.rdb ./backup/dump.rdb
```

### postgres_data Volume (full stack)
Persistent PostgreSQL data.

---

## 🏥 Health Checks

Services have health checks enabled:

```bash
# Check health
docker-compose ps

# In HEALTH column:
# - (healthy) = OK
# - (unhealthy) = Problem
# - (starting) = Starting up
```

**Health check logs**:
```bash
docker-compose logs redis | grep healthcheck
```

---

## 📈 Scaling

### Add More Redis Instances (Advanced)

Edit `docker-compose.full.yml`:
```yaml
redis-1:
  image: redis:7-alpine
  ports: ["6379:6379"]

redis-2:
  image: redis:7-alpine
  ports: ["6380:6379"]

redis-3:
  image: redis:7-alpine
  ports: ["6381:6379"]
```

Use Redis Cluster for automatic failover.

### Add Backend Workers

```bash
# Scale to 3 instances
docker-compose -f docker-compose.full.yml up -d --scale backend=3
```

---

## 🔒 Security

### Production Checklist

- [ ] Set `REDIS_PASSWORD` in .env
- [ ] Use `requirepass` in redis.conf
- [ ] Set `protected-mode yes` (default)
- [ ] Use only on trusted networks
- [ ] Enable SSL/TLS (use nginx/haproxy)
- [ ] Backup data regularly
- [ ] Monitor memory usage
- [ ] Set up alerting

### Enable Password

1. Edit `redis.conf`:
   ```conf
   requirepass your_strong_password_123
   ```

2. Update `.env`:
   ```env
   REDIS_PASSWORD=your_strong_password_123
   ```

3. Restart:
   ```bash
   docker-compose restart
   ```

---

## 📊 Monitoring

### View Logs
```bash
docker-compose logs -f redis
docker-compose logs -f --tail=100 redis
```

### Check Stats
```bash
docker stats sistema-narracao-redis
```

### Connect to CLI
```bash
# Using management script
.\redis-manage.ps1 -Command cli
# or
./redis-manage.sh cli

# Or directly
docker-compose exec redis redis-cli
```

### Redis CLI Commands
```redis
# Server info
INFO

# Database info
DBSIZE
KEYS *

# Memory usage
INFO memory
MEMORY STATS

# Monitoring
MONITOR

# Slowlog
SLOWLOG GET 10
```

---

## 🆘 Troubleshooting

### Redis not starting
```bash
# Check logs
docker-compose logs redis

# Common issues:
# 1. Port already in use
lsof -i :6379

# 2. Permission issues
sudo chown $USER docker-compose.yml

# 3. Volume issues
docker volume ls
docker volume rm redis_data
```

### Connection refused
```bash
# Verify Redis is running
docker ps | grep redis

# Test connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Check network
docker network inspect narracao_network
```

### High memory usage
```redis
MEMORY STATS
CONFIG GET maxmemory
CONFIG SET maxmemory 512mb
```

### Data loss
```bash
# Check if persistence is enabled
docker-compose exec redis redis-cli CONFIG GET save
docker-compose exec redis redis-cli CONFIG GET appendonly

# Both should show enabled settings
```

---

## 📚 Documentation

For more information:
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Redis Docker Image](https://hub.docker.com/_/redis/)
- [Redis Configuration](https://redis.io/topics/config)

---

## 🎯 Next Steps

1. **Test Redis**:
   ```bash
   docker-compose up -d
   docker-compose exec redis redis-cli ping
   ```

2. **Backup Data**:
   ```bash
   .\redis-manage.ps1 -Command backup
   ```

3. **Monitor Performance**:
   ```bash
   docker stats
   ```

4. **Deploy Full Stack**:
   ```bash
   docker-compose -f docker-compose.full.yml up -d
   ```

---

**Everything is ready for deployment!** 🚀
