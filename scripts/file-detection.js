#!/usr/bin/env node

/**
 * File Detection Script
 * Detects new files in the monitored folder and logs detailed information
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MONITORED_FOLDER = process.env.MONITORED_FOLDER || '/app/monitored-folder';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/**
 * Logs a message with timestamp and level
 */
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...(data && { data })
    };
    
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    
    if (data) {
        console.log(`[${timestamp}] [${level.toUpperCase()}] Additional Data:`, JSON.stringify(data, null, 2));
    }
}

/**
 * Gets file information including size, modification time, and type
 */
function getFileInfo(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return {
            path: filePath,
            name: path.basename(filePath),
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            modified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString(),
            extension: path.extname(filePath),
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
        };
    } catch (error) {
        log('error', `Failed to get file info for ${filePath}`, { error: error.message });
        return null;
    }
}

/**
 * Formats bytes in human readable format
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Detects and processes new files
 */
function detectFiles(detectedFiles = []) {
    log('info', `🔍 Scanning for new documents in: ${MONITORED_FOLDER}`);
    
    try {
        // Check if monitored folder exists
        if (!fs.existsSync(MONITORED_FOLDER)) {
            log('error', `Monitored folder does not exist: ${MONITORED_FOLDER}`);
            return;
        }

        const files = fs.readdirSync(MONITORED_FOLDER);
        log('debug', `Found ${files.length} items in monitored folder`);

        if (files.length === 0) {
            log('info', '📭 No files found in monitored folder');
            return;
        }

        let processedCount = 0;

        files.forEach(fileName => {
            const filePath = path.join(MONITORED_FOLDER, fileName);
            const fileInfo = getFileInfo(filePath);
            
            if (fileInfo && fileInfo.isFile) {
                processedCount++;
                
                // Check if this is a "new" file (for this demonstration, we'll treat files passed in as new)
                const isNewFile = detectedFiles.length === 0 || detectedFiles.includes(filePath);
                
                if (isNewFile || detectedFiles.length === 0) {
                    log('info', `📄 NEW DOCUMENT DETECTED: ${fileInfo.name}`, {
                        fullPath: fileInfo.path,
                        size: fileInfo.sizeFormatted,
                        extension: fileInfo.extension || 'no extension',
                        modified: fileInfo.modified,
                        created: fileInfo.created
                    });
                    
                    // Additional debugging info
                    log('debug', `File processing details`, {
                        absolutePath: path.resolve(filePath),
                        relativeToScript: path.relative(__dirname, filePath),
                        stats: {
                            readable: fs.constants.R_OK,
                            writable: fs.constants.W_OK
                        }
                    });
                }
            }
        });

        log('info', `✅ Scan complete. Processed ${processedCount} files`);
        
    } catch (error) {
        log('error', 'Failed to scan monitored folder', { 
            error: error.message,
            stack: error.stack,
            folder: MONITORED_FOLDER 
        });
    }
}

/**
 * Main execution function
 */
function main() {
    const startTime = new Date();
    log('info', '🚀 File Detection Script Started');
    log('debug', 'Environment Information', {
        nodeVersion: process.version,
        platform: process.platform,
        workingDirectory: process.cwd(),
        scriptPath: __filename,
        monitoredFolder: MONITORED_FOLDER,
        logLevel: LOG_LEVEL
    });

    // If files are passed as arguments, treat them as newly detected files
    const detectedFiles = process.argv.slice(2);
    
    if (detectedFiles.length > 0) {
        log('info', `Processing ${detectedFiles.length} files passed as arguments`);
        detectFiles(detectedFiles);
    } else {
        // Scan the entire folder
        detectFiles();
    }

    const endTime = new Date();
    const duration = endTime - startTime;
    log('info', `🏁 File Detection Script Completed in ${duration}ms`);
}

// Run the script if called directly
if (require.main === module) {
    main();
}

// Export functions for use in other modules
module.exports = {
    detectFiles,
    getFileInfo,
    log,
    formatBytes
}; 