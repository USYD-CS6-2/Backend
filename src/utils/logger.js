const fs = require('node:fs');
const path = require('node:path');
const { config } = require('../config/env');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = levels[config.log.level] ?? levels.info;

function ensureLogDir() {
  const dir = path.resolve(config.log.dir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function stringifyMeta(meta) {
  if (!meta) return '';
  try {
    return JSON.stringify(meta);
  } catch {
    return '[unserializable-meta]';
  }
}

function writeToFile(line) {
  try {
    const dir = ensureLogDir();
    const filePath = path.join(dir, 'app.log');
    fs.appendFileSync(filePath, `${line}\n`, 'utf8');
  } catch (err) {
    console.error('[logger] failed to write file:', err.message);
  }
}

function log(level, message, meta) {
  if ((levels[level] ?? levels.info) > currentLevel) {
    return;
  }

  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${
    meta ? ` ${stringifyMeta(meta)}` : ''
  }`;

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }

  writeToFile(line);
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  debug: (message, meta) => log('debug', message, meta),
};