#!/usr/bin/env node

/**
 * Enhanced File Detection Script
 * Detects new files, edited files, and deleted files with detailed logging
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MONITORED_FOLDER = process.env.MONITORED_FOLDER || '/app/monitored-folder';
const STATE_FILE = process.env.STATE_FILE || '/app/scripts/file-state.json';
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
 * Load previous file state from state file
 */
function loadPreviousState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const stateData = fs.readFileSync(STATE_FILE, 'utf8');
            return JSON.parse(stateData);
        }
    } catch (error) {
        log('warn', 'Failed to load previous state, starting fresh', { error: error.message });
    }
    return {};
}

/**
 * Save current file state to state file
 */
function saveCurrentState(currentState) {
    try {
        // Ensure directory exists
        const stateDir = path.dirname(STATE_FILE);
        if (!fs.existsSync(stateDir)) {
            fs.mkdirSync(stateDir, { recursive: true });
        }
        
        fs.writeFileSync(STATE_FILE, JSON.stringify(currentState, null, 2));
        log('debug', `State saved to ${STATE_FILE}`);
    } catch (error) {
        log('error', 'Failed to save current state', { error: error.message });
    }
}

/**
 * Get current state of all files in monitored folder
 */
function getCurrentState() {
    const currentState = {};
    
    try {
        if (!fs.existsSync(MONITORED_FOLDER)) {
            log('error', `Monitored folder does not exist: ${MONITORED_FOLDER}`);
            return currentState;
        }

        const files = fs.readdirSync(MONITORED_FOLDER);
        
        files.forEach(fileName => {
            const filePath = path.join(MONITORED_FOLDER, fileName);
            const fileInfo = getFileInfo(filePath);
            
            if (fileInfo && fileInfo.isFile) {
                currentState[filePath] = {
                    name: fileInfo.name,
                    size: fileInfo.size,
                    sizeFormatted: fileInfo.sizeFormatted,
                    modified: fileInfo.modified,
                    created: fileInfo.created,
                    extension: fileInfo.extension
                };
            }
        });
        
    } catch (error) {
        log('error', 'Failed to get current state', { error: error.message });
    }
    
    return currentState;
}

/**
 * Compare current state with previous state and detect changes
 */
function detectChanges() {
    log('info', `🔍 Scanning for file changes in: ${MONITORED_FOLDER}`);
    
    const previousState = loadPreviousState();
    const currentState = getCurrentState();
    
    const changes = {
        newFiles: [],
        editedFiles: [],
        deletedFiles: []
    };
    
    // Detect new and edited files
    for (const [filePath, fileInfo] of Object.entries(currentState)) {
        if (!previousState[filePath]) {
            // File didn't exist before - it's new
            changes.newFiles.push({ filePath, fileInfo });
        } else if (previousState[filePath].modified !== fileInfo.modified) {
            // File existed but modification time changed - it's edited
            changes.editedFiles.push({ 
                filePath, 
                fileInfo, 
                previousInfo: previousState[filePath] 
            });
        }
    }
    
    // Detect deleted files
    for (const [filePath, fileInfo] of Object.entries(previousState)) {
        if (!currentState[filePath]) {
            // File existed before but not now - it's deleted
            changes.deletedFiles.push({ filePath, fileInfo });
        }
    }
    
    // Report findings
    reportChanges(changes);
    
    // Save current state for next run
    saveCurrentState(currentState);
    
    return changes;
}

/**
 * Report detected changes with detailed logging
 */
function reportChanges(changes) {
    const totalChanges = changes.newFiles.length + changes.editedFiles.length + changes.deletedFiles.length;
    
    if (totalChanges === 0) {
        log('info', '📭 No file changes detected');
        return;
    }
    
    log('info', `📊 Found ${totalChanges} file changes:`);
    
    // Report new files
    changes.newFiles.forEach(({ filePath, fileInfo }) => {
        log('info', `📄 NEW FILE CREATED: ${fileInfo.name}`, {
            fullPath: filePath,
            size: fileInfo.sizeFormatted,
            extension: fileInfo.extension || 'no extension',
            created: fileInfo.created,
            modified: fileInfo.modified
        });
    });
    
    // Report edited files
    changes.editedFiles.forEach(({ filePath, fileInfo, previousInfo }) => {
        const sizeChange = fileInfo.size - previousInfo.size;
        const sizeChangeFormatted = sizeChange > 0 ? `+${formatBytes(Math.abs(sizeChange))}` : `-${formatBytes(Math.abs(sizeChange))}`;
        
        log('info', `✏️ FILE EDITED: ${fileInfo.name}`, {
            fullPath: filePath,
            currentSize: fileInfo.sizeFormatted,
            previousSize: previousInfo.sizeFormatted,
            sizeChange: sizeChangeFormatted,
            previousModified: previousInfo.modified,
            currentModified: fileInfo.modified,
            extension: fileInfo.extension || 'no extension'
        });
    });
    
    // Report deleted files
    changes.deletedFiles.forEach(({ filePath, fileInfo }) => {
        log('info', `🗑️ FILE DELETED: ${fileInfo.name}`, {
            fullPath: filePath,
            lastSize: fileInfo.sizeFormatted,
            lastModified: fileInfo.modified,
            extension: fileInfo.extension || 'no extension'
        });
    });
    
    // Summary
    log('info', `✅ Change detection complete. New: ${changes.newFiles.length}, Edited: ${changes.editedFiles.length}, Deleted: ${changes.deletedFiles.length}`);
}

/**
 * Main execution function
 */
function main() {
    const startTime = new Date();
    log('info', '🚀 Enhanced File Detection Script Started');
    log('debug', 'Environment Information', {
        nodeVersion: process.version,
        platform: process.platform,
        workingDirectory: process.cwd(),
        scriptPath: __filename,
        monitoredFolder: MONITORED_FOLDER,
        stateFile: STATE_FILE,
        logLevel: LOG_LEVEL
    });

    // Detect all types of changes (new, edited, deleted)
    const changes = detectChanges();

    const endTime = new Date();
    const duration = endTime - startTime;
    log('info', `🏁 File Detection Script Completed in ${duration}ms`);
    
    return changes;
}

// Run the script if called directly
if (require.main === module) {
    main();
}

// Export functions for use in other modules
module.exports = {
    detectChanges,
    getCurrentState,
    loadPreviousState,
    saveCurrentState,
    reportChanges,
    getFileInfo,
    log,
    formatBytes
}; 