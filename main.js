
const fs = require('fs');
const http = require('http');
const { Command } = require('commander');

const program = new Command();

program
  .requiredOption('-i, --input <path>', 'шлях до файлу для читання')
  .requiredOption('-h, --host <string>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера');

program.parse(process.argv);
const options = program.opts();

// Перевірка наявності файлу
if (!fs.existsSync(options.input)) {
  console.error('Cannot find input file');
  process.exit(1);
}

// Створення сервера
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Server is running successfully!\n');
});

// Запуск сервера
server.listen(options.port, options.host, () => {
  console.log(`Server started on http://${options.host}:${options.port}`);
  console.log(`Reading file: ${options.input}`);
});
