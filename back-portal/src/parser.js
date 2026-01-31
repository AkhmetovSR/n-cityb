const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class Parser {
    constructor() {
        this.results = [];
    }

    loadHTML(html) {
        return cheerio.load(html);
    }

    // Пример: парсим список статей
    parseArticles(html, selector = 'article') {
        const $ = this.loadHTML(html);
        const articles = [];

        $(selector).each((index, element) => {
            const title = $(element).find('h2, h3, .title').first().text().trim();
            const link = $(element).find('a').attr('href');
            const description = $(element).find('p, .description').first().text().trim();

            if (title) {
                articles.push({
                    id: index + 1,
                    title,
                    link: link ? new URL(link, this.baseUrl).href : null,
                    description,
                    timestamp: new Date().toISOString()
                });
            }
        });

        return articles;
    }

    // Пример: парсим таблицу
    parseTable(html, tableSelector = 'table') {
        const $ = this.loadHTML(html);
        const table = $(tableSelector);
        const results = [];

        table.find('tr').each((rowIndex, row) => {
            const rowData = {};
            $(row).find('td, th').each((colIndex, cell) => {
                rowData[`col_${colIndex}`] = $(cell).text().trim();
            });

            if (Object.keys(rowData).length > 0) {
                results.push(rowData);
            }
        });

        return results;
    }

    // Парсим по кастомным правилам
    parseCustom(html, rules) {
        const $ = this.loadHTML(html);
        const result = {};

        for (const [key, selector] of Object.entries(rules)) {
            if (typeof selector === 'string') {
                result[key] = $(selector).text().trim();
            } else if (typeof selector === 'function') {
                result[key] = selector($);
            }
        }

        return result;
    }

    // Сохраняем данные в разных форматах
    async saveData(data, filename, format = 'json') {
        const dataDir = path.join(__dirname, '..', 'data');

        // Создаем папку если нет
        await fs.mkdir(dataDir, { recursive: true });

        const filepath = path.join(dataDir, `${filename}.${format}`);

        switch (format) {
            case 'json':
                await fs.writeFile(filepath, JSON.stringify(data, null, 2));
                break;

            case 'csv':
                const csv = this.convertToCSV(data);
                await fs.writeFile(filepath, csv);
                break;

            case 'txt':
                await fs.writeFile(filepath, this.convertToText(data));
                break;
        }

        console.log(`Данные сохранены: ${filepath}`);
        return filepath;
    }

    convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const rows = data.map(row =>
            headers.map(header => {
                const value = row[header] || '';
                // Экранируем кавычки и запятые
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    }

    convertToText(data) {
        return JSON.stringify(data, null, 2);
    }
}

module.exports = Parser;