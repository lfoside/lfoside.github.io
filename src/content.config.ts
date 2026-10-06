import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * «Фото с описанием» — основной сценарий будущего расширения:
 * кладёшь .md в src/content/photos/ (+ файл картинки в src/assets/photos/),
 * Astro сам соберёт новую карточку в галерее. Код компонентов менять не нужно.
 */
const photos = defineCollection({
  loader: glob({ base: './src/content/photos', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1).max(110),
    description: z.string().min(1).max(300),
    /** имя файла в src/assets/photos/ (см. PhotoCard.astro) */
    image: z.string().min(1),
    pubDate: z.coerce.date(),
    /** теги-чипы поверх фото: техпроцесс / материал / отделка (do 3) */
    tags: z.array(z.string().max(20)).max(3).optional(),
    /** технические строки карточки: «Партия 340 шт.», «11 рабочих дней» */
    party: z.string().max(60).optional(),
    term: z.string().max(60).optional(),
  }),
});

/** Резерв под редкие короткие заметки (пока не используется — можно удалить) */
const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1).max(110),
    pubDate: z.coerce.date(),
  }),
});

export const collections = { photos, notes };
