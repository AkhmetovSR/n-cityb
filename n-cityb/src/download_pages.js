const fs = require('fs').promises;
const path = require('path');
const iconv = require('iconv-lite'); // Установи: npm install iconv-lite

async function downloadAllPages() {
    const baseUrl = 'https://ir-center.ru/sznregion/dsktop/czninfo.asp';
    const params = '?rn=%E3%20%CD%FF%E3%E0%ED%FC&rg=86&Profession=&sort=';
    const pagesDir = path.join(__dirname, '..', 'pages');

    // Создаём папку
    await fs.mkdir(pagesDir, { recursive: true });

    console.log('📥 Скачиваем страницы с правильной кодировкой...\n');

    // Качаем страницы (например, 10 штук)
    for (let page = 1; page <= 10; page++) {
        const url = `${baseUrl}${params}&page=${page}`;
        const filename = `page_${page}.html`;
        const filepath = path.join(pagesDir, filename);

        console.log(`📄 Страница ${page}...`);
        console.log(`   URL: ${url}`);

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            // Получаем данные как буфер
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);

            // 1. Сохраняем в原始ном виде (как бинарные данные)
            const rawPath = path.join(pagesDir, `page_${page}_raw.html`);
            await fs.writeFile(rawPath, Buffer.from(uint8Array));
            console.log(`   ✅ Сохранён raw файл: ${filename}_raw.html`);

            // 2. Пробуем разные кодировки и сохраняем
            const encodings = ['win1251', 'utf8', 'koi8-r', 'cp866'];

            for (const encoding of encodings) {
                try {
                    // Декодируем буфер в нужную кодировку
                    const decoded = iconv.decode(uint8Array, encoding);

                    // Проверяем, есть ли русский текст
                    const hasRussian = /[А-Яа-яЁё]/.test(decoded);

                    if (hasRussian) {
                        const encodingPath = path.join(pagesDir, `page_${page}_${encoding}.html`);
                        await fs.writeFile(encodingPath, decoded, 'utf8');
                        console.log(`   ✅ Кодировка ${encoding} - есть русский текст, сохранено`);

                        // Если это win1251 - сохраняем как основной файл
                        if (encoding === 'win1251') {
                            await fs.writeFile(filepath, decoded, 'utf8');
                            console.log(`   ✅ Основной файл сохранён: ${filename} (win1251)`);
                        }
                    } else {
                        console.log(`   ⚠️ Кодировка ${encoding} - нет русского текста`);
                    }
                } catch (e) {
                    console.log(`   ❌ Ошибка с кодировкой ${encoding}: ${e.message}`);
                }
            }

            // Задержка между запросами
            await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (error) {
            console.log(`   ❌ Ошибка загрузки: ${error.message}`);
        }

        console.log('---');
    }

    console.log('\n✅ Все страницы обработаны!');
    console.log('📁 Проверь папку pages/ - там будут файлы в разных кодировках');
}

downloadAllPages();