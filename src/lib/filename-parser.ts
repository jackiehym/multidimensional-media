import { TAG_CATEGORY_COLORS } from './db';

export interface ParsedFilename {
  year?: number;
  resolution?: string;
  tags: string[];
}

const RESOLUTION_MAP: Record<string, string> = {
  '2160p': '4K',
  '4k': '4K',
  'uhd': '4K',
  '1080p': '1080p',
  '1080i': '1080p',
  '720p': '720p',
  '480p': '480p',
};

export function parseFilename(filename: string): ParsedFilename {
  const tags: string[] = [];
  let year: number | undefined;
  let resolution: string | undefined;

  // Extract year (1900-2099)
  const yearMatch = filename.match(/[\.\s\-\(]?((?:19|20)\d{2})[\.\s\-\)]/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
    tags.push(String(year));
  }

  // Extract resolution
  const lowerName = filename.toLowerCase();
  for (const [pattern, label] of Object.entries(RESOLUTION_MAP)) {
    if (lowerName.includes(pattern)) {
      resolution = label;
      tags.push(label);
      break;
    }
  }

  return { year, resolution, tags };
}

export function getTagCategoryForName(name: string): { category: 'year' | 'genre' | 'quality' | 'custom'; color: string } {
  if (/^(19|20)\d{2}$/.test(name)) {
    return { category: 'year', color: TAG_CATEGORY_COLORS.year };
  }
  if (['4K', '1080p', '720p', '480p'].includes(name)) {
    return { category: 'quality', color: TAG_CATEGORY_COLORS.quality };
  }
  return { category: 'custom', color: TAG_CATEGORY_COLORS.custom };
}
