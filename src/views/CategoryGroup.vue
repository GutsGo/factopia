<template>
  <div class="group-container">
    <header class="page-header">
      <button class="back-btn cute-btn" @click="goBack">← 返回</button>
      <div class="title-container">
        <span class="emoji">{{ groupInfo?.icon }}</span>
        <h1>{{ groupInfo?.name || '所有分类' }}</h1>
      </div>
      <div class="spacer"></div>
    </header>

    <main class="categories" v-if="displayItems.length">
      <router-link 
        v-for="cat in displayItems" 
        :key="cat.id" 
        :to="`/levels/${cat.id}`" 
        class="category-card"
        :style="{ '--theme-color': getCategoryColor(cat.id) }"
      >
        <div class="card-inner">
          <div class="icon-wrapper">
            <div class="icon">{{ cat.icon }}</div>
          </div>
          <h2>{{ cat.name }}</h2>
          <div class="card-footer">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${getCategoryProgress(cat)}%` }"></div>
            </div>
            <svg class="star-icon" viewBox="0 0 24 24" fill="#FFCF40"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
        </div>
      </router-link>
    </main>
    <div v-else class="loading">正在加载数据...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchCategories } from '@/data/questions'
import { useProgressStore } from '@/stores/useProgressStore'
import type { CategoryData } from '@/types/question'

const router = useRouter()
const route = useRoute()
const progressStore = useProgressStore()

const categories = ref<CategoryData[]>([])
const groupId = String(route.params.id)

const groupMap: Record<string, {name: string, icon: string}> = {
  nature: { name: '自然与生物', icon: '🌿' },
  life: { name: '生活饮食', icon: '🍔' },
  geo: { name: '人文地标', icon: '🌍' },
  science: { name: '科学探索', icon: '🚀' },
  others: { name: '其他分项', icon: '📦' }
}

const groupInfo = computed(() => groupMap[groupId] || groupMap.others)

const displayItems = computed(() => {
  return categories.value.filter(c => c.groupId === groupId || (groupId === 'others' && !c.groupId))
})

const categoryColors: Record<string, string> = {
  car_logos: '#9BC7DE',
  flags: '#B7E0AF',
  company_logos: '#C0B7E1',
  flowers: '#F0ADD1',
  crops: '#F4B5A5',
  landmarks: '#EED98A',
  chinese_cities: '#99E1D9',
  dogs: '#E8CAAC',
  cats: '#D3C6E6',
  fruits: '#FFBE98',
  solar_terms: '#C9E493',
  traditional_instruments: '#EEA8B2',
  wild_animals: '#F9C0AB',
  marine_life: '#A3DDF8',
  insects: '#E2CA76',
  dinosaurs: '#B2D8C1',
  vegetables: '#A7E49D',
  chinese_food: '#F8B691',
  space_exploration: '#D2C4ED'
}

const getCategoryColor = (id: string) => {
  return categoryColors[id] || '#9BC7DE'
}

const getCategoryProgress = (cat: CategoryData) => {
  if (!cat.levels || cat.levels.length === 0) return 0;
  let completedCount = 0;
  cat.levels.forEach((lvl) => {
    const key = `${cat.id}_${lvl.id}`;
    if (progressStore.unlockedLevels[key] && progressStore.unlockedLevels[key].score > 0) {
      completedCount++;
    }
  });
  return Math.round((completedCount / cat.levels.length) * 100);
}

const goBack = () => {
  if (window.history.state && window.history.state.back) {
    router.back()
  } else {
    router.replace('/')
  }
}

onMounted(async () => {
  categories.value = await fetchCategories()
})
</script>

<style scoped>
.group-container {
  padding: 1.5rem 1rem;
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 0 0.5rem;
}

.cute-btn {
  background: #FFFDF8;
  border: 2px solid #5E4C41;
  padding: 0.5rem 1.2rem;
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

.title-container {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.title-container .emoji {
  font-size: 1.8rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #5E4C41;
  margin: 0;
}

.spacer {
  width: 88px; /* Balance the header flex */
}

.categories {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
  max-width: 850px;
  margin: 0 auto;
}

@media (min-width: 500px) {
  .categories {
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 1.5rem;
  }
}

/* Category Card styles (same as Home.vue) */
.category-card {
  background: var(--theme-color);
  border-radius: 20px; 
  padding: 8px;
  text-decoration: none;
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.4), 
              inset 0 -3px 0 rgba(0,0,0,0.1), 
              0 6px 12px rgba(94, 76, 65, 0.08);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.5), 
              inset 0 -3px 0 rgba(0,0,0,0.1), 
              0 10px 20px rgba(94, 76, 65, 0.12);
}

.card-inner {
  background: #FFFFFF;
  border-radius: 14px; 
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 0.5rem 0.8rem 0.5rem;
  transition: background-color 0.3s;
  box-shadow: 4px 4px 4px rgba(94, 76, 65, 0.1);
}

.category-card:hover .card-inner {
  background: #FAFAFA;
}

.icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background-color: var(--theme-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.8rem;
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.1);
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.category-card:hover .icon-wrapper {
  transform: scale(1.08);
}

.icon {
  font-size: 2rem;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));
}

.category-card h2 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 0.8rem 0;
  color: #5C5552;
}

.card-footer {
  width: 80%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: #E6E6E6;
  border-radius: 3px;
  overflow: hidden;
  margin-right: 8px;
}

.progress-fill {
  background-color: var(--theme-color);
  height: 100%;
  border-radius: 3px;
  filter: brightness(0.85);
}

.star-icon {
  width: 14px;
  height: 14px;
}

@media (min-width: 500px) {
  .category-card {
    padding: 10px;
    border-radius: 24px;
  }
  .card-inner {
    padding: 1.5rem 0.8rem 1rem 0.8rem;
    border-radius: 16px;
  }
  .icon-wrapper {
    width: 68px;
    height: 68px;
    border-radius: 16px;
    margin-bottom: 1rem;
  }
  .icon {
    font-size: 2.2rem;
  }
  .category-card h2 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
  .progress-bar {
    height: 8px;
    border-radius: 4px;
  }
  .progress-fill {
    border-radius: 4px;
  }
  .star-icon {
    width: 18px;
    height: 18px;
  }
}

.loading {
  text-align: center;
  color: #8E705B;
  font-weight: bold;
}
</style>
