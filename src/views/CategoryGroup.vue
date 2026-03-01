<template>
  <div class="group-container">
    <header class="page-header">
      <button class="back-btn pixel-btn" @click="goBack">← 返回</button>
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
        :style="{ '--card-color': getCategoryColor(cat.id) }"
      >
        <div class="card-inner">
          <div class="icon-box">
            <div class="icon">{{ cat.icon }}</div>
          </div>
          <h2>{{ cat.name }}</h2>
          <div class="card-bottom">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${getCategoryProgress(cat)}%` }"></div>
            </div>
            <svg class="star-svg" viewBox="0 0 24 24" fill="#FFCF40"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
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
import { getCategoryColor } from '@/utils/categoryColor'
import type { CategoryData } from '@/types/question'

const router = useRouter()
const route = useRoute()
const progressStore = useProgressStore()

const categories = ref<CategoryData[]>([])
const groupId = String(route.params.id)

const groupMap: Record<string, {name: string, icon: string}> = {
  nature: { name: '自然生态', icon: '🌿' },
  mind_blowing: { name: '高呼牛逼', icon: '🤯' },
  adulting: { name: '成人必知', icon: '👔' },
  humanity: { name: '人类与文化', icon: '🎭' },
  others: { name: '其他分项', icon: '📦' }
}

const groupInfo = computed(() => groupMap[groupId] || groupMap.others)

const displayItems = computed(() => {
  if (groupId === 'others') {
    return categories.value.filter(c => !c.groupId || c.groupId === 'others' || !groupMap[c.groupId])
  }
  return categories.value.filter(c => c.groupId === groupId)
})



const getCategoryProgress = (cat: CategoryData) => {
  if (!cat.levels || cat.levels.length === 0) return 0;
  let n = 0;
  cat.levels.forEach(lvl => {
    const k = `${cat.id}_${lvl.id}`;
    if ((progressStore.unlockedLevels[k]?.score ?? 0) > 0) n++;
  });
  return Math.round((n / cat.levels.length) * 100);
}

const goBack = () => {
  if (window.history.state?.back) router.back()
  else router.replace('/')
}

onMounted(async () => { categories.value = await fetchCategories() })
</script>

<style scoped lang="less">
.group-container {
  padding: 1.5rem 1rem;
  max-width: 500px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  z-index: 1;

  @media (min-width: 600px) {
    max-width: 900px;
  }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;

  h1 {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--theme-text-secondary);
    margin: 0;
  }
}

.pixel-btn {
  background: var(--theme-btn-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  padding: 0.5rem 1rem;
  color: var(--theme-text-secondary);
  font-weight: 800;
  font-size: 0.95rem;
  box-shadow: var(--theme-shadow-btn);
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: pointer;

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }
  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-btn-active);
  }
}

.title-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .emoji {
    font-size: 1.5rem;
  }
}

.spacer {
  width: 80px;
}

.categories {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;

  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }
}

.category-card {
  background: var(--theme-category-card-bg, var(--card-color));
  padding: var(--theme-category-card-padding, 5px);
  text-decoration: none;
  border: var(--theme-category-card-border);
  border-radius: var(--theme-radius-md);
  box-shadow: var(--theme-shadow-card);
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-card-hover);
  }
  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-card-active);
  }

  h2 {
    font-size: 0.95rem;
    font-weight: 800;
    margin: 0 0 0.5rem;
    color: var(--theme-text-muted);
    text-align: center;

    @media (min-width: 600px) {
      font-size: 1.1rem;
    }
  }
}

.card-inner {
  background: var(--theme-card-inner);
  border: var(--theme-border-width-sm) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0.4rem 0.6rem;
  box-shadow: var(--theme-shadow-inner);

  @media (min-width: 600px) {
    padding: 1.3rem 0.6rem 0.8rem;
  }
}

.icon-box {
  width: 52px;
  height: 52px;
  background: var(--card-color);
  border: var(--theme-border-width-sm) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.6rem;
  box-shadow: var(--theme-shadow-btn);

  @media (min-width: 600px) {
    width: 64px;
    height: 64px;
  }

  .icon {
    font-size: 1.6rem;
    @media (min-width: 600px) {
      font-size: 2rem;
    }
  }
}

.card-bottom {
  width: 85%;
  display: flex;
  align-items: center;
  gap: 4px;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: var(--theme-progress-bg);
  border: var(--theme-progress-border);
  border-radius: var(--theme-radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--card-color);
  filter: brightness(0.82);
  border-radius: var(--theme-radius-sm);
}

.star-svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.loading {
  text-align: center;
  color: var(--theme-text-secondary);
  font-weight: 800;
}
</style>
