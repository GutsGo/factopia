import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import type { MistakeRecord } from '@/types/question';

export interface LevelProgress {
  score: number;
  accuracy: number;
  unlocked: boolean;
}

export const useProgressStore = defineStore('progress', () => {
  // 按照 categoryId_levelId 作为 key 保存各关卡的最佳成绩和解锁进度
  const unlockedLevels = useLocalStorage<Record<string, LevelProgress>>('factopia_levels', {});
  // 游戏全周期总分储备
  const totalScore = useLocalStorage('factopia_total_score', 0);
  // 统计数据
  const totalAnswered = useLocalStorage('factopia_total_answered', 0);
  const totalCorrect = useLocalStorage('factopia_total_correct', 0);

  // 错题本：存储错误题目的记录
  const mistakeBook = useLocalStorage<MistakeRecord[]>('factopia_mistakes_v2', []);

  // 收藏夹
  const favorites = useLocalStorage<MistakeRecord[]>('factopia_favorites', []);

  /**
   * 更新关卡进展。如果是新记录或者得分更高，则覆盖此关卡的数据
   */
  function updateLevelProgress(categoryId: string, levelId: string, score: number, accuracy: number) {
    const key = `${categoryId}_${levelId}`;
    const current = unlockedLevels.value[key];

    if (!current || score > current.score) {
      unlockedLevels.value[key] = { score, accuracy, unlocked: true };
    }

    // 累加本次有效得分
    totalScore.value += score;
  }

  /**
   * 解锁下一关
   */
  function unlockNextLevel(categoryId: string, nextLevelId: string) {
    const key = `${categoryId}_${nextLevelId}`;
    if (!unlockedLevels.value[key]) {
      unlockedLevels.value[key] = { score: 0, accuracy: 0, unlocked: true };
    }
  }

  /**
   * 将本次测验的错题并入持久化错题本
   */
  function addMistakes(categoryId: string, questionIds: string[]) {
    if (questionIds.length === 0) return;

    // 过滤掉已存在的相同题目，补充新的时间戳记录
    const existing = mistakeBook.value.filter((m) => !(m.categoryId === categoryId && questionIds.includes(m.questionId)));

    const newRecords: MistakeRecord[] = questionIds.map((qId) => ({
      categoryId,
      questionId: qId,
      timestamp: Date.now(),
    }));

    mistakeBook.value = [...newRecords, ...existing];
  }

  /**
   * 移除错题（已掌握）
   */
  function removeMistake(categoryId: string, questionId: string) {
    mistakeBook.value = mistakeBook.value.filter((m) => !(m.categoryId === categoryId && m.questionId === questionId));
  }

  /**
   * 切换收藏状态
   */
  function toggleFavorite(categoryId: string, questionId: string) {
    const index = favorites.value.findIndex((f) => f.categoryId === categoryId && f.questionId === questionId);
    if (index >= 0) {
      favorites.value.splice(index, 1);
    } else {
      favorites.value.unshift({ categoryId, questionId, timestamp: Date.now() });
    }
  }

  /**
   * 判断是否已收藏
   */
  function isFavorite(categoryId: string, questionId: string) {
    return favorites.value.some((f) => f.categoryId === categoryId && f.questionId === questionId);
  }

  /**
   * 累加全局统计数据
   */
  function addStats(answered: number, correct: number) {
    totalAnswered.value += answered;
    totalCorrect.value += correct;
  }

  return {
    unlockedLevels,
    totalScore,
    totalAnswered,
    totalCorrect,
    mistakeBook,
    favorites,
    updateLevelProgress,
    unlockNextLevel,
    addMistakes,
    removeMistake,
    toggleFavorite,
    isFavorite,
    addStats,
  };
});
