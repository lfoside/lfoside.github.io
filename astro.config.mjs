// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Убирает HTML-комментарии из собранного dist (файлы .html).
 *
 * Заметки в исходных astro-компонентах остаются — они нужны будущим
 * правкам, — но на сервер уезжает чистая разметка: приватного там ничего,
 * просто не хочется показывать посетителям внутренние рассуждения и TODO.
 * CSS и JS минификатор Astro чистит сам — этот хук только про HTML.
 * Атрибуция стоковых фото живёт в LICENSE-NOTES.md, а не в комментариях,
 * поэтому удаление ничего лицензионно значимого не трогает.
 */
function stripHtmlComments() {
  return {
    name: 'strip-html-comments',
    hooks: {
      /** @param {{ dir: URL }} opts */
      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(dir);
        /** @param {string} d */
        async function walk(d) {
          for (const e of await readdir(d, { withFileTypes: true })) {
            const p = join(d, e.name);
            if (e.isDirectory()) await walk(p);
            else if (e.name.endsWith('.html')) {
              const src = await readFile(p, 'utf8');
              const out = src.replace(/<!--[\s\S]*?-->/g, '');
              if (out !== src) await writeFile(p, out, 'utf8');
            }
          }
        }
        await walk(root);
      },
    },
  };
}

// Авто-настройка под временную витрину на GitHub Pages. В Actions GITHUB_REPOSITORY
// равен "владелец/репозиторий"; для project-страницы site — это корень аккаунта БЕЗ
// пути, а путь репозитория задаётся отдельным полем base (так требует Astro Docs).
// Локальная сборка и прод-загрузка по FTP идут мимо этой ветки и остаются на боевом
// домене, поэтому не нужно вручную менять конфиг перед деплоем на сервер.
function detectGitHubPages() {
  if (process.env.GITHUB_ACTIONS !== 'true') return null;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo || !repo.includes('/')) return null;
  const [owner, name] = repo.split('/');
  const site = `https://${owner}.github.io`;
  // Ров owner.github.io — пользовательская/организационная страница: отдаётся
  // в КОРНЕ, base не нужен. Тогда рукописные /fonts, /icons, /favicon, /privacy/
  // работают как есть, без правок (рекомендуемый вариант для бесплатной витрины).
  if (name.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
    return { site, base: undefined };
  }
  // Обычный репозиторий — project-страница в подпути /name/. base нужен для
  // canonical и ассетов Astro, НО рукописные абсолютные пути его не префиксят,
  // поэтому для подпути их отдельно дорабатывать (см. замечание в ответе).
  return { site, base: `/${name}` };
}

const ghPages = detectGitHubPages();

// https://astro.build/config
export default defineConfig({
  // Боевой домен по умолчанию (локальная сборка и прод по FTP): на него пекутся
  // canonical, og:url/og:image, twitter-меты и sitemap (см. src/pages/robots.txt.ts).
  // Без слэша на конце. Для витрины GitHub Pages подставляется корень аккаунта выше.
  site: ghPages ? ghPages.site : 'https://tokarkapro.ru',

  // base задаёт подпуть /repo/ только для project-страницы GitHub Pages; в прочих
  // сборках остаётся незаданным (Astro по умолчанию трактует как /).
  base: ghPages ? ghPages.base : undefined,

  // Строгий статический режим: на выходе чистый HTML в dist/ (деплой по FTP)
  output: 'static',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap(), stripHtmlComments()],

  image: {
    // sharp — сервис по умолчанию в Astro 7. limitInputPixels=false, чтобы
    // случайно загруженный тяжёлый оригинал не ронял сборку, а сжимался.
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },
});
