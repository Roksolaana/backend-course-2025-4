const fs = require('fs').promises;        // модуль для асинхронних операцій з файлами
const http = require('http');             // модуль для створення HTTP-сервера
const { Command } = require('commander'); // модуль для обробки аргументів командного рядка
const { XMLBuilder } = require('fast-xml-parser'); // модуль для формування XML-документів

// Зчитування параметрів командного рядка
const program = new Command();
program
  .requiredOption('-i, --input <path>', 'шлях до JSON-файлу для читання')
  .requiredOption('-h, --host <string>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера');
program.parse(process.argv);
const options = program.opts();

// Асинхронне зчитування JSON-файлу
async function readJson(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const lines = data
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    return lines;
  } catch (error) {
    console.error('Cannot find input file');
    process.exit(1);
  }
}

// Перевірка наявності файлу одразу при запуску
(async () => {
  await readJson(options.input); // якщо файл не існує — програма завершиться

  // Створення HTTP-сервера
  const server = http.createServer(async (req, res) => {
    const flights = await readJson(options.input);

    // Отримання параметрів URL-запиту
    const url = new URL(req.url, `http://${req.headers.host}`);
    const showDate = url.searchParams.get('date') === 'true';          
    const airtimeMin = parseFloat(url.searchParams.get('airtime_min')) || 0; 

    // Фільтрація даних за умовами запиту
    const filtered = flights.filter(f => {
      const airTime = parseFloat(f.AIR_TIME) || 0;
      return airTime > airtimeMin;
    });

    // Формування об’єктів для перетворення у XML
    const result = filtered.map(f => {
      const flight = {};
      if (showDate && f.FL_DATE) flight.date = f.FL_DATE;      
      if (f.AIR_TIME !== undefined) flight.air_time = f.AIR_TIME; 
      if (f.DISTANCE !== undefined) flight.distance = f.DISTANCE; 
      return flight;
    });

    // Формування XML-документа
    const builder = new XMLBuilder({ format: true });
    const xmlData = builder.build({ flights: { flight: result } });

    // Надсилання XML-відповіді клієнту 
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xmlData);
  });

  // Запуск сервера
  server.listen(options.port, options.host, () => {
    console.log(`Server started on http://${options.host}:${options.port}`); 
    console.log(`Reading file: ${options.input}`);
  });
})();
