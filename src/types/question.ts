export type QuestionType = 'single_image_to_text' | 'true_false_image' | 'single_text_to_image';

export interface GalleryItem {
  id: string;
  name: string;
  image?: string;
  description: string;
}

export interface Question {
  id: string | number;
  type: QuestionType;
  prompt: string; // 题干/问题描述
  image?: string; // 对应之前的 emojiPlaceholder 或具体的图片 URL
  options?: string[]; // 选择题选项，如果是 text_to_image，选项其实也是 image/emoji string
  answer: string | boolean; // 答案
  explanation?: string; // 解析
  difficulty?: number; // 难度系数
}

export interface Level {
  id: string;
  name: string;
  questionIds: (string | number)[];
}

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  groupId?: string;
  levels: Level[];
}

export interface QuizDatabase {
  categories: CategoryData[];
  questions: Question[];
}

export interface MistakeRecord {
  categoryId: string;
  questionId: string;
  timestamp: number;
}
