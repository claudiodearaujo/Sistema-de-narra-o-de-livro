# Redis Management Script for Windows (PowerShell)

param(
    [string]$Command = "help"
)

$DockerComposeFile = "docker-compose.yml"
$ContainerName = "sistema-narracao-redis"

function Show-Help {
    Write-Host "Redis Management Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\redis-manage.ps1 -Command [command]" -ForegroundColor Green
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  up           - Start Redis container"
    Write-Host "  down         - Stop Redis container"
    Write-Host "  restart      - Restart Redis container"
    Write-Host "  status       - Check Redis status"
    Write-Host "  logs         - View Redis logs"
    Write-Host "  cli          - Connect to Redis CLI"
    Write-Host "  flush        - Flush all Redis data (WARNING!)"
    Write-Host "  backup       - Backup Redis data"
    Write-Host "  info         - Show Redis info"
    Write-Host "  help         - Show this help message"
    Write-Host ""
}

function Start-Redis {
    Write-Host "Starting Redis container..." -ForegroundColor Cyan
    docker-compose -f $DockerComposeFile up -d
    Write-Host "✅ Redis started successfully" -ForegroundColor Green
    Start-Sleep -Seconds 2
    Get-Status
}

function Stop-Redis {
    Write-Host "Stopping Redis container..." -ForegroundColor Cyan
    docker-compose -f $DockerComposeFile down
    Write-Host "✅ Redis stopped" -ForegroundColor Green
}

function Restart-Redis {
    Write-Host "Restarting Redis container..." -ForegroundColor Cyan
    Stop-Redis
    Start-Sleep -Seconds 1
    Start-Redis
}

function Get-Status {
    Write-Host "Redis Status:" -ForegroundColor Cyan
    $running = docker ps --filter "name=$ContainerName" --format "table {{.Names}}" | Select-String $ContainerName
    
    if ($running) {
        Write-Host "✅ Running" -ForegroundColor Green
        docker-compose -f $DockerComposeFile ps
    } else {
        Write-Host "❌ Not running" -ForegroundColor Red
    }
}

function Get-Logs {
    Write-Host "Redis Logs:" -ForegroundColor Cyan
    docker-compose -f $DockerComposeFile logs -f
}

function Enter-CLI {
    Write-Host "Connecting to Redis CLI..." -ForegroundColor Cyan
    docker-compose -f $DockerComposeFile exec redis redis-cli
}

function Get-Info {
    Write-Host "Redis Information:" -ForegroundColor Cyan
    docker-compose -f $DockerComposeFile exec redis redis-cli info
}

function Flush-Data {
    Write-Host "⚠️  WARNING: This will delete ALL Redis data!" -ForegroundColor Yellow
    $confirm = Read-Host "Type 'yes' to continue"
    
    if ($confirm -eq "yes") {
        Write-Host "Flushing Redis..." -ForegroundColor Cyan
        docker-compose -f $DockerComposeFile exec redis redis-cli FLUSHALL
        Write-Host "✅ All data flushed" -ForegroundColor Green
    } else {
        Write-Host "Cancelled"
    }
}

function Backup-Redis {
    $BackupDir = ".\redis_backups"
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFile = "$BackupDir\redis_backup_$Timestamp.rdb"
    
    Write-Host "Creating Redis backup..." -ForegroundColor Cyan
    docker-compose -f $DockerComposeFile exec -T redis redis-cli BGSAVE
    Start-Sleep -Seconds 2
    
    try {
        docker cp "${ContainerName}:/data/dump.rdb" $BackupFile
        Write-Host "✅ Backup created: $BackupFile" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backup failed" -ForegroundColor Red
    }
}

# Main script
switch ($Command.ToLower()) {
    "up" {
        Start-Redis
    }
    "down" {
        Stop-Redis
    }
    "restart" {
        Restart-Redis
    }
    "status" {
        Get-Status
    }
    "logs" {
        Get-Logs
    }
    "cli" {
        Enter-CLI
    }
    "info" {
        Get-Info
    }
    "flush" {
        Flush-Data
    }
    "backup" {
        Backup-Redis
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help
        exit 1
    }
}
