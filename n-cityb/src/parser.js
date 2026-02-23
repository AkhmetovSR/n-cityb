const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class ElegantJobParser {
    constructor(mode = 'local') {
        this.mode = mode;
        this.baseUrl = 'https://ir-center.ru';
        this.baseVacancyUrl = '/sznregion/dsktop/czninfo.asp';
        this.baseParams = '?rn=%E3%20%CD%FF%E3%E0%ED%FC&rg=86&Profession=&sort=';
        this.dataDir = path.join(__dirname, '..', 'data');
        this.pagesDir = path.join(__dirname, '..', 'pages');
        this.allJobs = [];
        this.currentPage = 1;
        this.maxPages = 50;

        // Точные заголовки столбцов
        this.expectedHeaders = [
            'Профессия',
            'Зарплата',
            'Район',
            'Организация/ источник вакансии',
            'Дата подтверждения',
            'График'
        ];

        console.log(`🚀 Режим: ${this.mode === 'local' ? '💻 LOCAL (файлы)' : '🌐 ONLINE (интернет)'}`);
    }

    async fetchPage(pageNum) {
        if (this.mode === 'local') {
            return await this.fetchLocalPage(pageNum);
        } else {
            return await this.fetchOnlinePage(pageNum);
        }
    }

    async fetchLocalPage(pageNum) {
        const possibleFiles = [
            `page_${pageNum}_raw.html`,
            `page_${pageNum}.html`,
            `page_${pageNum}_win1251.html`
        ];

        for (const filename of possibleFiles) {
            const filepath = path.join(this.pagesDir, filename);
            try {
                console.log(`🔍 Пробуем файл: ${filename}`);
                const buffer = await fs.readFile(filepath);

                const encodings = ['windows-1251', 'utf-8'];
                for (const encoding of encodings) {
                    try {
                        const decoder = new TextDecoder(encoding);
                        const decoded = decoder.decode(buffer);
                        if (/[А-Яа-яЁё]/.test(decoded)) {
                            console.log(`   ✅ Декодировано: ${encoding}`);
                            return decoded;
                        }
                    } catch (e) {}
                }
            } catch (error) {
                continue;
            }
        }
        return null;
    }

    async fetchOnlinePage(pageNum) {
        const url = `${this.baseUrl}${this.baseVacancyUrl}${this.baseParams}&page=${pageNum}`;
        console.log(`📥 Загружаем страницу ${pageNum}...`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const buffer = await response.arrayBuffer();
        return new TextDecoder('windows-1251').decode(new Uint8Array(buffer));
    }

    /**
     * Находит ТОЧНО нужную таблицу по её уникальным атрибутам
     */
    findTargetTable($) {
        console.log('\n🔍 Поиск таблицы с атрибутами:');
        console.log('   border="7", bordercolor="#96B1C4", cellpadding="5"');
        console.log('   cellspacing="2", bgcolor="#FFFFFF", class="text"');

        // Ищем таблицу с точным совпадением всех атрибутов
        const targetTable = $('table[border="7"][bordercolor="#96B1C4"][cellpadding="5"][cellspacing="2"][bgcolor="#FFFFFF"].text');

        if (targetTable.length > 0) {
            console.log('✅ Найдена таблица с точными атрибутами!');

            // Дополнительно проверяем заголовки
            const headers = [];
            targetTable.find('th').each((i, th) => {
                headers.push($(th).text().trim());
            });

            console.log(`   Заголовки: ${headers.join(' | ')}`);

            // Проверяем, что это нужная таблица
            let headersMatch = true;
            for (let i = 0; i < this.expectedHeaders.length; i++) {
                if (!headers[i] || !headers[i].includes(this.expectedHeaders[i].substring(0, 5))) {
                    headersMatch = false;
                    break;
                }
            }

            if (headersMatch) {
                console.log('✅ Заголовки совпадают!');
                return targetTable.first();
            } else {
                console.log('⚠️ Заголовки не совпадают, но берём таблицу по атрибутам');
                return targetTable.first();
            }
        }

        // Если точный поиск не сработал, пробуем найти по частям
        console.log('⚠️ Точная таблица не найдена, пробуем альтернативный поиск...');

        // Ищем по уникальному сочетанию атрибутов
        const altTable = $('table[border="7"][bordercolor="#96B1C4"].text');
        if (altTable.length > 0) {
            console.log('✅ Найдена таблица по border и bordercolor');
            return altTable.first();
        }

        // Ищем по классу и border
        const classTable = $('table.text[border="7"]');
        if (classTable.length > 0) {
            console.log('✅ Найдена таблица по классу и border');
            return classTable.first();
        }

        console.log('❌ Таблица с нужными атрибутами не найдена');
        return null;
    }

    /**
     * Парсит строки таблицы
     */
    parseJobTable($, table) {
        const jobs = [];

        console.log('\n🔍 Парсинг данных...');

        // Находим строку с заголовками (th)
        let headerRow = null;
        $(table).find('tr').each((i, row) => {
            if ($(row).find('th').length > 0) {
                headerRow = row;
                return false;
            }
        });

        if (!headerRow) {
            console.log('❌ Не найдена строка с <th>');
            return jobs;
        }

        // Парсим строки с данными (td)
        let dataRows = 0;
        $(table).find('tr').each((rowIndex, row) => {
            // Пропускаем строку с заголовками
            if (row === headerRow) return;

            const cols = $(row).find('td');
            if (cols.length < 4) return;

            // Извлекаем профессию из ссылки или текста
            const professionLink = $(cols[0]).find('a');
            const profession = professionLink.length > 0
                ? professionLink.text().trim()
                : $(cols[0]).text().trim();

            if (profession && profession.length > 2) {
                const job = {
                    profession: profession,
                    salary: $(cols[1]).text().trim(),
                    district: $(cols[2]).text().trim(),
                    organization: $(cols[3]).text().trim(),
                    date: $(cols[4]).text().trim(),
                    schedule: $(cols[5]).text().trim(),
                    page: this.currentPage
                };

                jobs.push(job);
                dataRows++;

                if (dataRows <= 3) {
                    console.log(`   ✅ ${dataRows}. ${profession.substring(0, 40)}...`);
                }
            }
        });

        console.log(`   Всего вакансий в таблице: ${dataRows}`);
        return jobs;
    }

    /**
     * Основной метод
     */
    async parseJobs() {
        console.log('\n🚀 Запуск парсера\n');

        try {
            while (this.currentPage <= this.maxPages) {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`📄 СТРАНИЦА ${this.currentPage}`);
                console.log(`${'='.repeat(60)}`);

                const html = await this.fetchPage(this.currentPage);

                if (!html) {
                    console.log(`🏁 Страница ${this.currentPage} не найдена`);
                    break;
                }

                const $ = cheerio.load(html);

                const jobTable = this.findTargetTable($);

                if (jobTable) {
                    const jobs = this.parseJobTable($, jobTable);

                    if (jobs.length > 0) {
                        this.allJobs = [...this.allJobs, ...jobs];
                        console.log(`\n✅ Добавлено ${jobs.length} вакансий. Всего: ${this.allJobs.length}`);
                    }
                } else {
                    console.log(`\n⚠️ На странице ${this.currentPage} нет нужной таблицы`);

                    // Если на первой странице нет таблицы, прекращаем
                    if (this.currentPage === 1) break;
                }

                this.currentPage++;

                if (this.mode === 'online') {
                    console.log('⏳ Задержка 1.5 секунды...');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }

            if (this.allJobs.length > 0) {
                await this.saveResults();
                this.showStats();
            }

        } catch (error) {
            console.error('❌ Ошибка:', error);
        }
    }

    /**
     * Сохраняет результаты
     */
    async saveResults() {
        await fs.mkdir(this.dataDir, { recursive: true });

        const timestamp = new Date().toISOString().slice(0,10).replace(/-/g, '');
        const mode = this.mode;

        // JSON
        const jsonPath = path.join(this.dataDir, `nyagan_jobs_${mode}_${timestamp}.json`);
        await fs.writeFile(jsonPath, JSON.stringify(this.allJobs, null, 2), 'utf8');
        console.log(`\n💾 JSON: ${jsonPath}`);

        // CSV
        const csvPath = path.join(this.dataDir, `nyagan_jobs_${mode}_${timestamp}.csv`);
        const csvHeader = 'Страница;Профессия;Зарплата;Район;Организация;Дата подтверждения;График\n';
        const csvRows = this.allJobs.map(j =>
            `"${j.page}";"${j.profession.replace(/"/g, '""')}";"${j.salary.replace(/"/g, '""')}";"${j.district.replace(/"/g, '""')}";"${j.organization.replace(/"/g, '""')}";"${j.date.replace(/"/g, '""')}";"${j.schedule.replace(/"/g, '""')}"`
        ).join('\n');

        await fs.writeFile(csvPath, '\uFEFF' + csvHeader + csvRows, 'utf8');
        console.log(`💾 CSV: ${csvPath}`);
    }

    /**
     * Статистика
     */
    showStats() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 ИТОГОВАЯ СТАТИСТИКА');
        console.log('='.repeat(60));

        console.log(`📄 Страниц: ${this.currentPage - 1}`);
        console.log(`📋 Вакансий: ${this.allJobs.length}`);

        if (this.allJobs.length === 0) return;

        const professions = new Set(this.allJobs.map(j => j.profession));
        console.log(`🎯 Уникальных профессий: ${professions.size}`);

        // Примеры
        console.log('\n📋 ПЕРВЫЕ 3 ВАКАНСИИ:');
        this.allJobs.slice(0, 3).forEach((job, i) => {
            console.log(`\n${i+1}. ${job.profession}`);
            console.log(`   💰 ${job.salary}`);
            console.log(`   🏢 ${job.organization.substring(0, 50)}...`);
            console.log(`   📅 ${job.date}`);
            console.log(`   🕒 ${job.schedule}`);
        });
    }
}

// Запуск
async function main() {
    // const parser = new ElegantJobParser('online');
    const parser = new ElegantJobParser('local');
    await parser.parseJobs();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ElegantJobParser;