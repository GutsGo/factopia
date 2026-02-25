<template>
  <div class="levels-container">
    <div class="background-scenery">
      <div class="cloud-group" style="top: 10%; right: 10%; transform: scale(0.6);">
        <div class="cloud cloud-main"></div>
      </div>
      <div class="hill hill-bg"></div>
    </div>

    <header class="levels-header">
      <button class="back-btn cute-btn" @click="goHome">← 返回首页</button>
      <h1 v-if="category" class="category-title">{{ category.icon }} {{ category.name }}</h1>
    </header>

    <main class="levels-area" v-if="category">
      <div class="levels-grid">
        <div 
          v-for="(lvl, index) in category.levels" 
          :key="lvl.id" 
          class="level-card cute-card-inner"
          :class="{ 'locked': !isUnlocked(index) }"
          @click="playLevel(lvl.id, index)"
        >
          <div class="level-info">
            <h3>{{ lvl.name || `第 ${index + 1} 关` }}</h3>
            <p>{{ lvl.questionIds.length }} 题</p>
          </div>
          <div class="level-status">
            <template v-if="isUnlocked(index)">
              <div v-if="getScore(lvl.id) > 0" class="score-badge">最高分: {{ getScore(lvl.id) }}</div>
              <div v-else class="play-hint">点击开始</div>
            </template>
            <template v-else>
              <div class="lock-icon">🔒 待解锁</div>
            </template>
          </div>
        </div>
      </div>
    </main>
    <div v-else-if="!isLoading" class="error-msg">未找到该分类的数据。</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCategories } from '@/data/questions'
import { useProgressStore } from '@/stores/useProgressStore'
import type { CategoryData } from '@/types/question'

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()

const categoryId = route.params.category as string
const category = ref<CategoryData | null>(null)
const isLoading = ref(true)

onMounted(async () => {
  const cats = await fetchCategories()
  category.value = cats.find(c => c.id === categoryId) || null
  isLoading.value = false
})

function goHome() {
  router.push('/')
}

function getLevelKey(levelId: string) {
  return `${categoryId}_${levelId}`
}

function isUnlocked(index: number) {
  if (index === 0) return true // 第一关总是解锁的
  const levelId = category.value?.levels?.[index]?.id
  if (!levelId) return false
  const key = getLevelKey(levelId)
  return !!progressStore.unlockedLevels[key]?.unlocked
}

function getScore(levelId: string) {
  const key = getLevelKey(levelId)
  return progressStore.unlockedLevels[key]?.score || 0
}

function playLevel(levelId: string, index: number) {
  if (isUnlocked(index)) {
    router.push(`/game/${categoryId}/${levelId}`)
  }
}
</script>

<style scoped>
.levels-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.background-scenery {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  overflow: hidden;
  background-color: #FDF5E6;
}
.cloud-group { position: absolute; filter: drop-shadow(2px 0 0 #5E4C41) drop-shadow(-2px 0 0 #5E4C41) drop-shadow(0 2px 0 #5E4C41) drop-shadow(0 -2px 0 #5E4C41); }
.cloud { background: white; border-radius: 50px; position: relative; }
.cloud::before, .cloud::after { content: ''; position: absolute; background: white; border-radius: 50%; }
.cloud-main { width: 140px; height: 50px; }
.cloud-main::before { width: 70px; height: 70px; top: -35px; left: 20px; }
.cloud-main::after { width: 50px; height: 50px; top: -20px; right: 25px; }
.hill { position: absolute; border-radius: 50%; opacity: 0.5; }
.hill-bg { bottom: -30vh; left: -10vw; width: 120vw; height: 40vh; background-color: #C5DCA0; }

.levels-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 1rem 0;
  margin-bottom: 2rem;
  gap: 1.5rem;
}

.category-title {
  font-size: 2rem;
  font-weight: 900;
  color: #5E4C41;
  margin: 0;
  text-shadow: 0 2px 0 rgba(94, 76, 65, 0.1);
}

.cute-btn {
  background: #FFFDF8;
  border: 2px solid #5E4C41;
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  color: #5E4C41;
  font-weight: 800;
  box-shadow: 0 4px 0 rgba(94, 76, 65, 0.1);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
}

.cute-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 rgba(94, 76, 65, 0.15);
}

.cute-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(94, 76, 65, 0.1);
}

.levels-area {
  flex: 1;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.cute-card-inner {
  background: white;
  border: 4px solid #A3D1E6;
  border-radius: 20px;
  padding: 1.5rem 1rem;
  text-align: center;
  box-shadow: 0 6px 0 rgba(94, 76, 65, 0.1);
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
}

.cute-card-inner:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 0 rgba(94, 76, 65, 0.15);
}

.cute-card-inner:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 rgba(94, 76, 65, 0.1);
}

.locked {
  border-color: #B8C2CC;
  background: #EAEAEA;
  cursor: not-allowed;
  opacity: 0.8;
  pointer-events: none;
}

.locked:hover {
  transform: none;
  box-shadow: 0 6px 0 rgba(94, 76, 65, 0.1);
}

.level-info h3 {
  margin: 0 0 0.5rem 0;
  color: #5E4C41;
  font-weight: 900;
  font-size: 1.3rem;
}

.level-info p {
  margin: 0;
  color: #8E705B;
  font-size: 0.95rem;
  font-weight: bold;
}

.level-status {
  margin-top: 1rem;
}

.score-badge {
  background: #FFFDF8;
  color: #E85A7F;
  border: 2px solid #5E4C41;
  border-radius: 999px;
  padding: 0.3rem 0.8rem;
  font-size: 0.9rem;
  font-weight: 800;
  display: inline-block;
}

.play-hint {
  color: #F8B182;
  font-weight: 900;
  font-size: 1.1rem;
}

.lock-icon {
  font-size: 1rem;
  color: #8E705B;
  font-weight: bold;
}

.error-msg {
  text-align: center;
  color: #5E4C41;
  font-weight: bold;
  font-size: 1.2rem;
  margin-top: 2rem;
}
</style>
