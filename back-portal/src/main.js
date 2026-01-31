const Fetcher = require('./fetcher');
const Parser = require('./parser');

async function main() {
    console.log('🚀 Запуск парсера на нативном fetch API\n');

    // Инициализируем
    const fetcher = new Fetcher({
        timeout: 15000,
        retries: 2,
        userAgent: 'MyParserBot/1.0 (+https://myparser.com)'
    });

    const parser = new Parser();

    // Пример сайта для парсинга (можно заменить на любой)
    const targetUrl = 'https://news.ycombinator.com/';

    try {
        // 1. Загружаем HTML
        console.log(`📥 Загружаем: ${targetUrl}`);
        const html = await fetcher.getHTML(targetUrl);

        if (!html) {
            console.error('Не удалось загрузить страницу');
            return;
        }

        console.log(`✅ Загружено: ${html.length} символов\n`);

        // 2. Парсим данные
        console.log('🔍 Парсим данные...');

        // Пример 1: Парсим статьи
        const articles = parser.parseArticles(html, '.athing');
        console.log(`📰 Найдено статей: ${articles.length}`);

        // Пример 2: Кастомный парсинг
        const customData = parser.parseCustom(html, {
            title: 'title',
            firstLink: 'a[href]',
            linkCount: ($) => $('a').length,
            headline: '.titleline a'
        });

        // 3. Сохраняем результаты
        await parser.saveData(articles, 'articles', 'json');
        await parser.saveData(articles, 'articles', 'csv');
        await parser.saveData(customData, 'metadata', 'json');

        // 4. Выводим статистику
        console.log('\n📊 Статистика:');
        console.log(`   Статьи: ${articles.length} записей`);
        console.log(`   Ссылки на странице: ${customData.linkCount}`);
        console.log(`   Заголовок: ${customData.title}`);

        // 5. Пример загрузки нескольких страниц
        console.log('\n🌐 Пример загрузки нескольких страниц:');
        const urls = [
            targetUrl,
            'https://news.ycombinator.com/news?p=2',
            'https://news.ycombinator.com/news?p=3'
        ];

        for (const [index, url] of urls.entries()) {
            console.log(`   [${index + 1}/${urls.length}] Загружаем: ${url}`);
            const pageHtml = await fetcher.getHTML(url);
            if (pageHtml) {
                const pageArticles = parser.parseArticles(pageHtml, '.athing');
                console.log(`      Найдено статей: ${pageArticles.length}`);

                // Сохраняем каждую страницу отдельно
                await parser.saveData(pageArticles, `page_${index + 1}`, 'json');
            }

            // Задержка между запросами
            if (index < urls.length - 1) {
                await fetcher.sleep(2000);
            }
        }

        console.log('\n✅ Парсинг завершен успешно!');

    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
        console.error(error.stack);
    }
}

// Запуск
if (require.main === module) {
    main();
}

module.exports = { main };