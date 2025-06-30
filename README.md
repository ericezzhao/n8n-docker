# n8n on Docker File Monitoring System

Automated file monitoring system using Docker and n8n that detects when new documents are added to a folder or edited and triggers a script for logging differences.

## System Pipeline

- Monitors a folder for new files and content changes every minute
- Automatically triggers scripts when files are detected
- Provides logging with timestamps, file metadata, and debugging information
- Runs in Docker for easy deployment and portability
- Uses n8n for visual automation management and for automation capabilities

## Quick Setup

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
- **Trigger**: Every [your choice of time detection, I used 30 seconds]

#### Node 2: Execute Command (File Detection)
- **Command**: `find /app/monitored-folder -type f -mmin -1`

#### Node 3: IF Node
- **Condition**: `{{ $json.stdout.trim().length > 0 }}`

#### Node 4: Execute Command (Script Execution)
Connect to the TRUE branch of the IF node:
- **Command**: `sh -c 'FILES=$(echo "{{ $json.stdout }}"); if [ ! -z "$FILES" ]; then node /app/scripts/file-detection.js $FILES; fi'`

### 6. Test

```bash
# Create a test file
echo "Test document $(date)" > monitored-folder/test-file.txt

# Watch n8n execution logs for detection
```

Example output in n8n logs:
```
[2025-06-30T19:00:35.787Z] [INFO] 📄 NEW DOCUMENT DETECTED: test-file.txt
[2025-06-30T19:00:35.787Z] [INFO] Additional Data: {
  "fullPath": "/app/monitored-folder/test-file.txt",
  "size": "25 Bytes",
  "extension": ".txt",
  "modified": "2025-06-30T19:00:35.123Z"
}
```

## References
https://docs.n8n.io/ 

https://docs.n8n.io/hosting/installation/docker/
