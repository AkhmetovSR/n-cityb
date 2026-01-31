const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class NyaganJobParser {
    constructor() {
        this.baseUrl = 'https://ir-center.ru';
    }

    /**
     * Определяем кодировку страницы
     */
    detectEncoding(buffer) {
        const sample = buffer.slice(0, 1000); // Берем начало файла для анализа

        // Проверяем BOM (Byte Order Mark) для UTF-8
        if (sample[0] === 0xEF && sample[1] === 0xBB && sample[2] === 0xBF) {
            return 'utf-8';
        }

        // Проверяем BOM для UTF-16
        if ((sample[0] === 0xFE && sample[1] === 0xFF) || (sample[0] === 0xFF && sample[1] === 0xFE)) {
            return 'utf-16';
        }

        // Старые русские сайты чаще всего используют windows-1251 или cp1251
        // Проверяем по характерным байтам для кириллицы в windows-1251
        let win1251Score = 0;
        let utf8Score = 0;

        for (let i = 0; i < Math.min(sample.length, 500); i++) {
            const byte = sample[i];

            // Кириллица в windows-1251: 0xC0-0xFF (А-я)
            if (byte >= 0xC0 && byte <= 0xFF) {
                win1251Score++;
            }

            // UTF-8 кириллица: начинается с 0xD0 или 0xD1
            if (byte === 0xD0 || byte === 0xD1) {
                utf8Score++;
            }
        }

        console.log(`🔍 Счёт кодировок: windows-1251=${win1251Score}, UTF-8=${utf8Score}`);

        // Если много кириллицы в windows-1251 формате
        if (win1251Score > utf8Score * 2) {
            return 'windows-1251';
        }

        return 'utf-8'; // По умолчанию
    }

    /**
     * Пробуем декодировать разными кодировками
     */
    tryDecode(buffer) {
        const encodings = [
            'windows-1251',
            'cp1251',
            'cp866',
            'koi8-r',
            'iso-8859-5',
            'utf-8'
        ];

        for (const encoding of encodings) {
            try {
                const decoder = new TextDecoder(encoding, { fatal: false });
                const decoded = decoder.decode(buffer);

                // Проверяем, что декодирование дало читаемый русский текст
                if (decoded.includes('Осмотрщик') ||
                    decoded.includes('Электрогазосварщик') ||
                    decoded.includes('Профессия') ||
                    decoded.includes('Зарплата')) {
                    console.log(`✅ Успешно декодировано как: ${encoding}`);
                    return decoded;
                }

                // Дополнительная проверка на кириллицу
                const cyrillicMatch = decoded.match(/[А-Яа-яЁё]{5,}/);
                if (cyrillicMatch) {
                    console.log(`✅ Найдена кириллица в кодировке: ${encoding}`);
                    return decoded;
                }
            } catch (error) {
                // Пробуем следующую кодировку
                continue;
            }
        }

        // Если ничего не сработало, пробуем windows-1251 (самая распространённая)
        console.log('⚠️  Используем кодировку по умолчанию: windows-1251');
        return new TextDecoder('windows-1251', { fatal: false }).decode(buffer);
    }

    /**
     * Основная функция парсинга
     */
    async parseJobs() {
        console.log('🚀 Запуск парсера вакансий Нягани\n');

        try {
            // 1. Загружаем страницу как ArrayBuffer
            console.log('📥 Загружаем страницу...');
            const response = await fetch(this.baseUrl + '/sznregion/jobs/jobstab.asp?rn=%CD%FF%E3%E0%ED%FC&Region=86&Okato=141769', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ru-RU,ru;q=0.9',
                    'Accept-Charset': 'windows-1251,utf-8;q=0.7,*;q=0.3'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status} ${response.statusText}`);
            }

            // Получаем данные как ArrayBuffer
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            console.log(`✅ Получено данных: ${uint8Array.length} байт\n`);

            // 2. Определяем и применяем кодировку
            console.log('🔤 Определяем кодировку...');
            const html = this.tryDecode(uint8Array);

            // Проверяем результат декодирования
            if (!html || html.length < 100) {
                throw new Error('Не удалось декодировать страницу');
            }

            console.log(`✅ Декодировано: ${html.length} символов\n`);

            // 3. Парсим HTML
            console.log('🔍 Парсим HTML...');
            const $ = cheerio.load(html);
            const jobs = [];

            // Сохраняем HTML для отладки
            const debugDir = path.join(__dirname, '..', 'data');
            await fs.mkdir(debugDir, { recursive: true });
            await fs.writeFile(
                path.join(debugDir, 'debug_page.html'),
                html,
                'utf8'
            );

            // Способ 1: Ищем таблицу с вакансиями по содержимому
            $('table').each((tableIndex, table) => {
                const tableText = $(table).text();

                // Ищем таблицу с заголовками вакансий
                if (tableText.includes('Профессия') &&
                    tableText.includes('Зарплата') &&
                    tableText.includes('Организация')) {

                    console.log(`✅ Найдена таблица вакансий (#${tableIndex + 1})`);

                    $(table).find('tr').each((rowIndex, row) => {
                        const rowText = $(row).text().trim();

                        // Пропускаем заголовки и пустые строки
                        if (rowText &&
                            !rowText.includes('Профессия') &&
                            !rowText.includes('Зарплата') &&
                            !rowText.includes('Район') &&
                            !rowText.includes('Организация') &&
                            !rowText.includes('Дата актуальности') &&
                            !rowText.includes('Источник') &&
                            rowText.length > 20) {

                            const cols = $(row).find('td');

                            if (cols.length >= 4) {
                                const job = {
                                    profession: $(cols[0]).text().trim(),
                                    salary: $(cols[1]).text().trim(),
                                    district: $(cols[2]).text().trim(),
                                    organization: $(cols[3]).text().trim(),
                                    relevanceDate: cols[4] ? $(cols[4]).text().trim() : 'N/A',
                                    source: cols[5] ? $(cols[5]).text().trim() : 'интернет ресурс'
                                };

                                // Проверяем, что это реальная вакансия
                                if (job.profession &&
                                    job.profession.length > 2 &&
                                    !job.profession.includes('window.') &&
                                    !job.profession.includes('function') &&
                                    !job.profession.includes('script')) {

                                    jobs.push(job);
                                }
                            }
                        }
                    });

                    return false; // Прерываем цикл после нахождения
                }
            });

            // Способ 2: Если таблица не найдена, ищем по структуре
            if (jobs.length === 0) {
                console.log('⚠️  Таблица не найдена, ищем по альтернативному методу...');

                // Ищем все строки с датами и зарплатами
                $('tr').each((rowIndex, row) => {
                    const rowText = $(row).text().trim();

                    if (rowText.length > 30 &&
                        (/\d{2}\.\d{2}\.\d{4}/.test(rowText) || /\d{4}-\d{2}-\d{2}/.test(rowText)) &&
                        (/\d{5,}/.test(rowText) || rowText.includes('от') || rowText.includes('до'))) {

                        const cols = $(row).find('td');

                        if (cols.length >= 4) {
                            const job = {
                                profession: $(cols[0]).text().trim(),
                                salary: $(cols[1]).text().trim(),
                                district: $(cols[2]).text().trim(),
                                organization: $(cols[3]).text().trim(),
                                relevanceDate: $(cols[4] || cols[3]).text().trim(),
                                source: 'ir-center.ru'
                            };

                            if (job.profession && job.profession.length > 2) {
                                jobs.push(job);
                            }
                        }
                    }
                });
            }

            // Способ 3: Парсим весь текст страницы
            if (jobs.length === 0) {
                console.log('⚠️  Альтернативный метод не сработал, парсим весь текст...');

                const allText = $('body').text();
                const lines = allText.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 20);

                for (const line of lines) {
                    // Ищем строки с характерными для вакансий паттернами
                    if ((line.includes('от') && (line.includes('до') || /\d{5,}/.test(line))) ||
                        (/\d{2}\.\d{2}\.\d{4}/.test(line) && /\d{5,}/.test(line))) {

                        // Пробуем извлечь данные (приблизительно)
                        const parts = line.split(/\s{2,}/);

                        if (parts.length >= 4) {
                            const job = {
                                profession: parts[0],
                                salary: parts[1] || 'Не указана',
                                district: parts[2] || 'Нягань',
                                organization: parts[3] || 'Не указана',
                                relevanceDate: parts[4] || new Date().toLocaleDateString('ru-RU'),
                                source: 'ir-center.ru'
                            };

                            if (job.profession && job.profession.length > 2) {
                                jobs.push(job);
                            }
                        }
                    }
                }
            }

            // 4. Обрабатываем результаты
            console.log(`\n✅ Найдено вакансий: ${jobs.length}\n`);

            if (jobs.length === 0) {
                console.log('❌ Вакансии не найдены!');
                console.log('\n🔍 Отладочная информация:');
                console.log('Первые 2000 символов HTML:');
                console.log('='.repeat(80));
                console.log(html.substring(0, 2000));
                console.log('='.repeat(80));
                return [];
            }

            // Удаляем дубликаты
            const uniqueJobs = [];
            const seen = new Set();

            for (const job of jobs) {
                const key = `${job.profession}|${job.organization}|${job.salary}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueJobs.push(job);
                }
            }

            console.log(`📊 Уникальных вакансий: ${uniqueJobs.length}\n`);

            // Выводим примеры
            console.log('🎯 ПРИМЕРЫ ВАКАНСИЙ:');
            console.log('='.repeat(100));

            const samples = uniqueJobs.slice(0, Math.min(10, uniqueJobs.length));
            samples.forEach((job, index) => {
                console.log(`${index + 1}. ${job.profession}`);
                console.log(`   💰 ${job.salary}`);
                console.log(`   🏢 ${job.organization}`);
                console.log(`   📅 ${job.relevanceDate}`);
                console.log(`   📍 ${job.district}`);
                console.log('-'.repeat(60));
            });

            // 5. Сохраняем результаты
            await this.saveResults(uniqueJobs);

            // 6. Статистика
            this.showStatistics(uniqueJobs);

            return uniqueJobs;

        } catch (error) {
            console.error('❌ Ошибка:', error.message);
            if (error.stack) {
                console.error('Детали:', error.stack);
            }
            return [];
        }
    }

    /**
     * Сохраняет результаты в файлы
     */
    async saveResults(jobs) {
        console.log('\n💾 Сохраняем данные...');

        const dataDir = path.join(__dirname, '..', 'data');
        await fs.mkdir(dataDir, { recursive: true });

        // JSON файл
        const jsonFile = path.join(dataDir, 'nyagan_jobs.json');
        await fs.writeFile(jsonFile, JSON.stringify(jobs, null, 2), 'utf8');
        console.log(`✅ JSON сохранён: ${jsonFile}`);

        // CSV файл (для Excel)
        const csvFile = path.join(dataDir, 'nyagan_jobs.csv');
        const csvHeader = '№;Профессия;Зарплата;Район;Организация;Дата актуальности;Источник\n';
        const csvRows = jobs.map((job, index) =>
            `${index + 1};"${this.escapeCsv(job.profession)}";"${this.escapeCsv(job.salary)}";"${this.escapeCsv(job.district)}";"${this.escapeCsv(job.organization)}";"${this.escapeCsv(job.relevanceDate)}";"${this.escapeCsv(job.source)}"`
        ).join('\n');

        await fs.writeFile(csvFile, '\uFEFF' + csvHeader + csvRows, 'utf8');
        console.log(`✅ CSV сохранён: ${csvFile}`);
    }

    /**
     * Экранирование для CSV
     */
    escapeCsv(text) {
        if (!text) return '';
        return String(text).replace(/"/g, '""');
    }

    /**
     * Показывает статистику
     */
    showStatistics(jobs) {
        console.log('\n📈 СТАТИСТИКА:');
        console.log('='.repeat(40));

        const withSalary = jobs.filter(j => j.salary &&
            j.salary !== 'Не указана' &&
            !j.salary.includes('Не указана')).length;

        console.log(`   Всего вакансий: ${jobs.length}`);
        console.log(`   С указанной зарплатой: ${withSalary}`);

        // Топ организаций
        const orgCount = {};
        jobs.forEach(job => {
            orgCount[job.organization] = (orgCount[job.organization] || 0) + 1;
        });

        const topOrgs = Object.entries(orgCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (topOrgs.length > 0) {
            console.log('\n🏆 ТОП РАБОТОДАТЕЛЕЙ:');
            topOrgs.forEach(([org, count], i) => {
                console.log(`   ${i + 1}. ${org} - ${count} вакансий`);
            });
        }

        console.log('\n✅ Парсинг завершён успешно!');
    }

    /**
     * Простой тест кодировки
     */
    async testEncoding() {
        console.log('🧪 Тестируем кодировку...');

        const response = await fetch(this.baseUrl + '/sznregion/jobs/jobstab.asp?rn=%CD%FF%E3%E0%ED%FC&Region=86&Okato=141769');
        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);

        // Пробуем разные кодировки
        const testEncodings = ['windows-1251', 'cp866', 'koi8-r', 'utf-8', 'iso-8859-5'];

        for (const encoding of testEncodings) {
            try {
                const decoder = new TextDecoder(encoding, { fatal: true });
                const decoded = decoder.decode(uint8Array.slice(0, 500)); // Только начало

                // Ищем кириллицу
                const cyrillicCount = (decoded.match(/[А-Яа-яЁё]/g) || []).length;
                console.log(`   ${encoding}: ${cyrillicCount} кириллических символов`);

                if (cyrillicCount > 10) {
                    console.log(`   👍 ${encoding} выглядит правильно`);
                    console.log(`   Пример: ${decoded.substring(0, 100)}`);
                }
            } catch (e) {
                console.log(`   ${encoding}: ошибка декодирования`);
            }
        }
    }
}

// Основная функция
async function main() {
    const parser = new NyaganJobParser();

    // Опционально: сначала протестировать кодировку
    // await parser.testEncoding();

    // Запускаем парсинг
    await parser.parseJobs();
}

// Запуск
if (require.main === module) {
    // Проверяем cheerio
    try {
        require('cheerio');
    } catch (e) {
        console.error('❌ Установите cheerio: npm install cheerio');
        process.exit(1);
    }

    main().catch(console.error);
}

module.exports = NyaganJobParser;