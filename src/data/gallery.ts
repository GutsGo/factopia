import type { GalleryItem } from '@/types/question';
import { resolveDataUrl } from '@/utils/assets';

export async function fetchGallery(categoryId: string): Promise<GalleryItem[]> {
  try {
    const response = await fetch(resolveDataUrl(`/data/gallery/${categoryId}.json`));
    if (!response.ok) {
      throw new Error(`Failed to fetch gallery for category ${categoryId}`);
    }
    const data: GalleryItem[] = await response.json();
    return data;
  } catch (error) {
    console.error(`Error loading gallery data for category ${categoryId}:`, error);
    return [];
  }
}
