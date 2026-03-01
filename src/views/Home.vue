<template>
  <div class="home-container">
    <div class="content">
      <!-- Logo 区域 -->
      <header class="hero">
        <div class="logo-container">
          <span class="deco-star s1">✦</span>
          <span class="deco-star s2">✦</span>
          <span class="deco-star s3">✦</span>
          <span class="deco-star s4">✦</span>
          <h1 class="logo">
            <span v-for="(char, i) in 'Factopia'" :key="i" :style="{ color: logoColors[i % logoColors.length] }">{{ char }}</span>
          </h1>
        </div>
        <p class="subtitle">探索有趣的常识，挑战你的认知！</p>
      </header>

      <!-- 三个操作按钮 -->
      <div class="actions-bar">
        <router-link to="/mistakes" class="action-btn">
          <span class="emoji">📖</span> 错题本
        </router-link>
        <router-link to="/favorites" class="action-btn">
          <span class="emoji">⭐</span> 收藏夹
        </router-link>
        <router-link to="/statistics" class="action-btn">
          <span class="emoji">🎯</span> 统计中心
        </router-link>
      </div>

      <!-- 设置栏 -->
      <div class="settings-bar">
        <div class="settings-left">
          <button class="settings-btn" @click="settingsStore.toggleSound" :class="{ disabled: !settingsStore.soundEnabled }">
            {{ settingsStore.soundEnabled ? '🔊 开' : '🔇 关' }}
          </button>
          <button class="settings-btn theme-btn" @click="themeStore.toggleTheme">
            {{ themeStore.currentTheme === 'pixel' ? '🎮 像素' : '✨ 现代' }}
          </button>
        </div>
        <div class="global-stats">
          总分: <span class="score-num">{{ progressStore.totalScore }}</span>
        </div>
      </div>
      
      <!-- 分类区域 -->
      <main class="category-sections" v-if="categories.length">
        <section 
          v-for="group in groups" 
          :key="group.id" 
          class="category-group-section"
          v-show="group.items.length > 0"
        >
          <div class="section-header">
            <div class="header-title">
              <span class="emoji">{{ group.icon }}</span>
              <h2>{{ group.name }}</h2>
            </div>
            <!-- 查看全部 -->
            <router-link
              v-if="group.items.length > limit"
              :to="`/group/${group.id}`"
              class="view-all-link"
            >
              查看全部 →
            </router-link>
          </div>
          <div class="categories-row">
            <router-link 
              v-for="cat in getDisplayItems(group)" 
              :key="cat.id" 
              :to="`/levels/${cat.id}`" 
              class="category-card"
              :style="{ '--card-color': getCategoryColor(cat.id) }"
            >
              <div class="card-inner">
                <div class="icon-box">
                  <div class="icon">{{ cat.icon }}</div>
                </div>
                <div class="card-name">{{ cat.name }}</div>
                <div class="card-bottom">
                  <div class="progress-track">
                    <div class="progress-fill" :style="{ width: `${getCategoryProgress(cat)}%` }"></div>
                  </div>
                  <svg class="star-svg" viewBox="0 0 24 24" fill="#FFCF40"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
              </div>
            </router-link>
          </div>
        </section>
      </main>
      <div v-else class="loading">正在加载数据...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { fetchCategories } from '@/data/questions'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { getCategoryColor } from '@/utils/categoryColor'
import type { CategoryData } from '@/types/question'

interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  items: CategoryData[];
}

const groups = ref<CategoryGroup[]>([
  { id: 'nature', name: '自然生态', icon: '🌿', items: [] },
  { id: 'mind_blowing', name: '高呼牛逼', icon: '🤯', items: [] },
  { id: 'adulting', name: '成人必知', icon: '👔', items: [] },
  { id: 'humanity', name: '人类与文化', icon: '🎭', items: [] },
  { id: 'others', name: '其他分项', icon: '📦', items: [] }
])

const categories = ref<CategoryData[]>([])
const settingsStore = useSettingsStore()
const progressStore = useProgressStore()
const themeStore = useThemeStore()

const logoColors = ['#F6A8C2', '#F8B182', '#A3D1E6', '#B8C2CC', '#F6A8C2', '#A3D1E6', '#F8B182', '#A3D1E6']

const limit = ref(3);
const isDesktop = ref(false);

const updateDevice = () => {
  isDesktop.value = window.innerWidth >= 600;
  limit.value = isDesktop.value ? 4 : 3;
};

onMounted(() => {
  updateDevice();
  window.addEventListener('resize', updateDevice);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateDevice);
});



const getCategoryProgress = (cat: CategoryData) => {
  if (!cat.levels || cat.levels.length === 0) return 0;
  let n = 0;
  cat.levels.forEach(lvl => {
    const k = `${cat.id}_${lvl.id}`;
    if ((progressStore.unlockedLevels[k]?.score ?? 0) > 0) n++;
  });
  return Math.round((n / cat.levels.length) * 100);
}

const getDisplayItems = (group: CategoryGroup) => {
  const sorted = [...group.items].sort((a, b) => getCategoryProgress(b) - getCategoryProgress(a));
  return sorted.length <= limit.value ? sorted : sorted.slice(0, limit.value);
};

onMounted(async () => {
  const cats = await fetchCategories()
  categories.value = cats
  cats.forEach(cat => {
    let group = groups.value.find(g => g.id === cat.groupId)
    if (!group) group = groups.value.find(g => g.id === 'others')
    if (group) group.items.push(cat)
  })
})
</script>

<style scoped lang="less">
/* ===========================
   首页样式 - 主题变量驱动
   =========================== */
.home-container {
  padding: 1.5rem 1rem 4rem;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
  z-index: 1;

  @media (min-width: 600px) {
    max-width: 900px;
    padding: 2rem 1.5rem 4rem;
  }
}

.content {
  position: relative;
  z-index: 10;
}

/* ---------- Logo ---------- */
.hero {
  text-align: center;
  margin-top: 1.5rem;
  margin-bottom: 1.2rem;
  animation: fadeInDown 0.8s ease-out;

  .logo-container {
    position: relative;
    display: inline-block;
  }

  .deco-star {
    position: absolute;
    animation: twinkle 2s ease-in-out infinite;
    &.s1 { top: -10px; left: -24px; font-size: 1rem; color: #F8B182; }
    &.s2 { top: 18px; left: -14px; font-size: 0.6rem; color: #F6A8C2; animation-delay: 0.5s; }
    &.s3 { top: -6px; right: -28px; font-size: 0.85rem; color: #A3D1E6; animation-delay: 1s; }
    &.s4 { top: 22px; right: -16px; font-size: 0.5rem; color: #C4DE95; animation-delay: 1.5s; }
  }

  .logo {
    font-size: 3.2rem;
    font-weight: 900;
    margin-bottom: 0.5rem;
    letter-spacing: 3px;
    -webkit-text-stroke: var(--theme-logo-stroke);
    text-shadow: var(--theme-logo-shadow);

    @media (min-width: 600px) {
      font-size: 5rem;
      letter-spacing: 8px;
    }

    span {
      display: inline-block;
      transition: transform 0.2s;
      &:hover {
        transform: translateY(-6px);
      }
    }
  }

  .subtitle {
    font-size: 1rem;
    color: var(--theme-text-secondary);
    font-weight: 700;
    @media (min-width: 600px) {
      font-size: 1.15rem;
    }
  }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.6); }
}

/* ---------- 操作按钮 ---------- */
.actions-bar {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (min-width: 600px) {
    gap: 1rem;
  }
}

.action-btn {
  flex: 1;
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  padding: 0.7rem 0.3rem;
  color: var(--theme-text-secondary);
  font-weight: 800;
  font-size: 0.9rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  box-shadow: var(--theme-shadow-btn);
  transition: transform 0.15s, box-shadow 0.15s;

  @media (min-width: 600px) {
    flex: unset;
    padding: 0.8rem 1.5rem;
    font-size: 1.1rem;
  }

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }

  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-btn-active);
  }

  .emoji {
    font-size: 1.2rem;
    @media (min-width: 600px) {
      font-size: 1.3rem;
    }
  }
}

/* ---------- 设置栏 ---------- */
.settings-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 auto 1.5rem;
  padding: 0.4rem 0.8rem 0.4rem 0.4rem;
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  box-shadow: var(--theme-shadow-panel);
  gap: 0.4rem;

  @media (min-width: 600px) {
    max-width: 650px;
    padding: 0.6rem 1.5rem 0.6rem 0.6rem;
  }
}

.settings-left {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
}

.settings-btn {
  background: var(--theme-btn-settings-bg);
  border: var(--theme-border-width-sm) solid var(--theme-btn-settings-border, var(--theme-border-color));
  border-radius: var(--theme-radius-sm);
  padding: 0.4rem 0.65rem;
  color: var(--theme-text-secondary);
  font-weight: 800;
  font-size: 0.8rem;
  white-space: nowrap;
  box-shadow: var(--theme-shadow-btn);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  @media (min-width: 600px) {
    padding: 0.5rem 1.2rem;
    font-size: 0.95rem;
  }

  &.disabled {
    background: var(--theme-btn-disabled-bg);
    opacity: 0.6;
  }

  &:hover {
    transform: var(--theme-hover-transform) scale(1.02);
    box-shadow: var(--theme-shadow-btn-hover);
    filter: brightness(1.02);
  }

  &:active {
    transform: var(--theme-active-transform) scale(0.98);
    box-shadow: var(--theme-shadow-btn-active);
  }

  &.theme-btn {
    background: var(--theme-btn-settings-accent);
    color: var(--theme-text-secondary);
    border-color: rgba(79, 172, 254, 0.2);

    [data-theme="modern"] & {
      color: #01579b;
    }
  }
}

.global-stats {
  font-weight: 800;
  color: var(--theme-text-secondary);
  font-size: 0.85rem;
  white-space: nowrap;

  @media (min-width: 600px) {
    font-size: 1.05rem;
  }
}

.score-num {
  font-size: 1rem;
  color: var(--theme-highlight);
  font-weight: 900;
  @media (min-width: 600px) {
    font-size: 1.2rem;
  }
}

/* ---------- 分类区域 ---------- */
.category-sections {
  margin: 0 auto;
}

.category-group-section {
  margin-bottom: 2rem;
}

.section-header {
  padding: 0 0.3rem 0.6rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .emoji {
      font-size: 1.5rem;
      @media (min-width: 600px) {
        font-size: 1.8rem;
      }
    }

    h2 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--theme-text-secondary);
      margin: 0;
      @media (min-width: 600px) {
        font-size: 1.3rem;
      }
    }
  }

  .view-all-link {
    text-decoration: none;
    color: var(--theme-text-secondary);
    font-weight: 800;
    font-size: 0.85rem;
    transition: transform 0.15s, color 0.15s;
    white-space: nowrap;

    &:hover {
      transform: translateX(3px);
      color: var(--theme-highlight);
    }
  }
}

/* ---------- 卡片网格 ---------- */
.categories-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  @media (min-width: 600px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
}

/* ---------- 分类卡片 ---------- */
.category-card {
  background: var(--theme-category-card-bg, var(--card-color));
  border: var(--theme-category-card-border);
  border-radius: var(--theme-radius-md);
  padding: var(--theme-category-card-padding, 5px);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  box-shadow: var(--theme-shadow-card);
  transition: transform 0.15s, box-shadow 0.15s;

  @media (min-width: 600px) {
    padding: 7px;
  }

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-card-hover);
  }

  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-card-active);
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
    padding: 0.8rem 0.3rem 0.5rem;
    min-width: 0;
    overflow: hidden;
    box-shadow: var(--theme-shadow-inner);

    @media (min-width: 600px) {
      padding: 1.2rem 0.5rem 0.7rem;
    }
  }

  .icon-box {
    width: 50px;
    height: 50px;
    background: var(--card-color);
    border: var(--theme-border-width-sm) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    box-shadow: var(--theme-shadow-btn);

    @media (min-width: 600px) {
      width: 64px;
      height: 64px;
      margin-bottom: 0.7rem;
    }

    .icon {
      font-size: 1.6rem;
      @media (min-width: 600px) {
        font-size: 2rem;
      }
    }
  }

  .card-name {
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--theme-text-muted);
    text-align: center;
    line-height: 1.3;
    margin-bottom: 0.4rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    padding: 0 2px;

    @media (min-width: 600px) {
      font-size: 1rem;
      margin-bottom: 0.6rem;
    }
  }

  .card-bottom {
    width: 90%;
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

    @media (min-width: 600px) {
      height: 8px;
    }
  }

  .progress-fill {
    height: 100%;
    background: var(--card-color);
    filter: brightness(0.82);
    border-radius: var(--theme-radius-sm);
  }

  .star-svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    @media (min-width: 600px) {
      width: 18px;
      height: 18px;
    }
  }
}

/* ---------- 加载 ---------- */
.loading {
  text-align: center;
  color: var(--theme-text-secondary);
  font-weight: 800;
  font-size: 1rem;
  padding: 3rem 0;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
