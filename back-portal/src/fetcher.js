class Fetcher {
    constructor(options = {}) {
        this.defaultOptions = {
            timeout: 10000, // 10 секунд
            retries: 3,
            delayBetweenRetries: 1000,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...options
        };
    }

    async fetchWithTimeout(url, options = {}, timeout = this.defaultOptions.timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'User-Agent': this.defaultOptions.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Таймаут запроса: ${url}`);
            }
            throw error;
        }
    }

    async fetchWithRetry(url, options = {}, maxRetries = this.defaultOptions.retries) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Попытка ${attempt}/${maxRetries}: ${url}`);
                return await this.fetchWithTimeout(url, options);
            } catch (error) {
                lastError = error;

                if (attempt < maxRetries) {
                    const delay = this.defaultOptions.delayBetweenRetries * attempt;
                    console.log(`Ошибка: ${error.message}. Повтор через ${delay}мс...`);
                    await this.sleep(delay);
                }
            }
        }

        throw new Error(`Не удалось загрузить ${url} после ${maxRetries} попыток: ${lastError.message}`);
    }

    async getHTML(url, options = {}) {
        try {
            const response = await this.fetchWithRetry(url, options);

            // Определяем кодировку (важно для русских сайтов!)
            const contentType = response.headers.get('content-type') || '';
            const charset = this.extractCharset(contentType);

            let html;
            if (charset && charset.toLowerCase() !== 'utf-8') {
                // Конвертируем в UTF-8 если нужно
                const buffer = await response.arrayBuffer();
                html = this.convertEncoding(buffer, charset);
            } else {
                html = await response.text();
            }

            return html;
        } catch (error) {
            console.error(`Ошибка при загрузке ${url}:`, error.message);
            return null;
        }
    }

    async getJSON(url, options = {}) {
        const response = await this.fetchWithRetry(url, {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...options.headers
            }
        });
        return await response.json();
    }

    extractCharset(contentType) {
        const match = contentType.match(/charset=([^;]+)/i);
        return match ? match[1].toLowerCase() : 'utf-8';
    }

    convertEncoding(buffer, fromCharset) {
        // Для простоты - используем iconv-lite если нужны сложные кодировки
        // Пока возвращаем как есть
        const decoder = new TextDecoder(fromCharset);
        return decoder.decode(buffer);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = Fetcher;