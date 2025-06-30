# n8n on Docker File Monitoring System

Automated file monitoring system using Docker and n8n that detects when new documents are added to a folder or edited and triggers a script for logging differences.

## System Pipeline

- Monitors a folder for new files and content changes
- Automatically triggers scripts when files are detected
- Provides logging with timestamps, file metadata, and debugging information
- Runs in Docker for easy deployment and portability
- Uses n8n for visual automation management and automation capabilities

## 🚀 Quick Setup

### 1. Project Structure

Create the following directory structure:

```
n8n-docker/
├── monitored-folder/    # Files to monitor go here
├── scripts/             # Detection scripts
├── docker/              # Docker configuration
│   ├── docker-compose.yml
│   └── n8n-data/        # Persistent n8n data
└── README.md
```

### 2. Docker Configuration (docker/docker-compose.yml)

Create/Use `docker/docker-compose.yml`:

### 3. Detection Script (scripts/file-detection.js)

Create/Use `scripts/file-detection.js`:

### 4. Start the System through Docker or Manually

Suggested:

Search for n8n on Docker app and run, it should create a new container automatically for you

Manual:

```bash
# Navigate to docker directory
cd docker

# Start n8n container
docker-compose up -d

# Verify it's running
docker ps
```

### 5. Configure n8n Workflow

1. **Open n8n**: Navigate to http://localhost:5678
3. **Create new workflow** with these nodes:

#### Node 1: Schedule Trigger
- Trigger: Every [your choice of time detection, I used 30 seconds]

#### Node 2: Execute Command 
- Command: node /app/scripts/file-detection.js

### 6. Run and view execution logs

## References
https://docs.n8n.io/ 
https://docs.n8n.io/hosting/installation/docker/