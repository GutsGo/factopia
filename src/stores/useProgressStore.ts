import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';

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

  // 错题本：存储错误题目 ID 的数组
  const mistakeBook = useLocalStorage<string[]>('factopia_mistakes', []);

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
  function addMistakes(questionIds: string[]) {
    if (questionIds.length === 0) return;
    const newMistakes = new Set([...mistakeBook.value, ...questionIds]);
    mistakeBook.value = Array.from(newMistakes);
  }

  return {
    unlockedLevels,
    totalScore,
    mistakeBook,
    updateLevelProgress,
    unlockNextLevel,
    addMistakes,
  };
});
