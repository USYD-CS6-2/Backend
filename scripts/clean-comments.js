#!/usr/bin/env node

const { cleanAnalyzePayload } = require('../src/services/cleaningService');

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const rawInput = await readStdin();
  const payload = JSON.parse(rawInput);
  const cleaned = cleanAnalyzePayload(payload);

  process.stdout.write(`${JSON.stringify(cleaned, null, 2)}\n`);
}

main().catch((err) => {
  process.stderr.write(
    `${JSON.stringify({
      error_code: 'CLEANING_FAILED',
      message: err.message,
    })}\n`
  );
  process.exitCode = 1;
});
