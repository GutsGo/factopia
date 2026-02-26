import type { CategoryData, Question } from '@/types/question';
import { resolveDataUrl } from '@/utils/assets';

// 缓存数据以避免重复加载
let categoriesCache: CategoryData[] | null = null;
const categoryQuestionsCache = new Map<string, Question[]>();

export async function fetchCategories(): Promise<CategoryData[]> {
  if (categoriesCache) return categoriesCache;

  try {
    const response = await fetch(resolveDataUrl('/data/categories.json'));
    if (!response.ok) throw new Error('Failed to fetch categories.');

    categoriesCache = await response.json();
    return categoriesCache!;
  } catch (err) {
    console.error('Error loading categories:', err);
    return [];
  }
}

export async function fetchQuestionsByLevel(categoryId: string, levelId: string): Promise<Question[]> {
  const categories = await fetchCategories();
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return [];

  const level = category.levels.find((l) => l.id === levelId);
  if (!level) return [];

  let questions = categoryQuestionsCache.get(categoryId);

  if (!questions) {
    try {
      const response = await fetch(resolveDataUrl(`/data/questions/${categoryId}.json`));
      if (!response.ok) throw new Error(`Failed to fetch questions for category ${categoryId}.`);

      questions = await response.json();
      categoryQuestionsCache.set(categoryId, questions!);
    } catch (err) {
      console.error(`Error loading questions for ${categoryId}:`, err);
      return [];
    }
  }

  const questionMap = new Map(questions!.map((q) => [q.id, q]));

  // 映射 level 中的 IDs 为实际的 Question 对象
  return level.questionIds.map((id) => questionMap.get(id)).filter((q): q is Question => q !== undefined);
}
