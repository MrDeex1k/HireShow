const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '..', 'logs.txt');

const log = (event, entity, id) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}-${event}-${entity}:${id}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
};

module.exports = log;