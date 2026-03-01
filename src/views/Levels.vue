<template>
  <div class="levels-container">
    <header class="levels-header">
      <button class="back-btn pixel-btn" @click="goHome">← 返回首页</button>
      <h1 v-if="category" class="category-title">{{ category.icon }} {{ category.name }}</h1>
    </header>

    <div class="mode-tabs" v-if="category">
      <button class="tab-btn" :class="{ active: activeTab === 'levels' }" @click="activeTab = 'levels'">🎮 闯关模式</button>
      <button class="tab-btn" :class="{ active: activeTab === 'gallery' }" @click="activeTab = 'gallery'">📖 图鉴模式</button>
    </div>

    <main class="levels-area" v-if="category && activeTab === 'levels'">
      <div class="levels-grid">
        <div v-for="(lvl, index) in category.levels" :key="lvl.id" 
          class="level-card" :class="{ locked: !isUnlocked(index) }"
          :style="{ borderColor: isUnlocked(index) ? getCategoryColor(categoryId) : undefined }"
          @click="playLevel(lvl.id, index)">
          <div class="level-info">
            <h3>{{ lvl.name || `第 ${index + 1} 关` }}</h3>
            <p>{{ lvl.questionIds.length }} 题</p>
          </div>
          <div class="level-status">
            <template v-if="isUnlocked(index)">
              <div v-if="getScore(lvl.id) > 0" class="score-badge">最高分: {{ getScore(lvl.id) }}</div>
              <div v-else class="play-hint">点击开始</div>
            </template>
            <template v-else><div class="lock-icon">🔒 待解锁</div></template>
          </div>
        </div>
      </div>
    </main>

    <main class="gallery-area" v-else-if="category && activeTab === 'gallery'">
      <div v-if="isLoadingGallery" class="msg">正在加载图鉴数据...</div>
      <div v-else-if="galleryData.length === 0" class="msg">暂时没有图鉴数据哦~</div>
      <div v-else class="gallery-grid">
        <div v-for="item in galleryData" :key="item.id" class="gallery-card"
          :style="{ borderColor: getCategoryColor(categoryId) }" @click="openGalleryModal(item)">
          <div v-if="item.image" class="gallery-img-wrap" :class="{ 'is-emoji': !isUrl(item.image) }">
            <template v-if="isUrl(item.image)"><img :src="resolveImageUrl(item.image)" :alt="item.name" loading="lazy" /></template>
            <template v-else><div class="f-emoji">{{ item.image }}</div></template>
          </div>
          <div class="gallery-name" :class="{ 'no-img': !item.image }">{{ item.name }}</div>
        </div>
      </div>
    </main>

    <div v-else-if="!isLoading" class="msg">未找到该分类的数据。</div>

    <!-- Gallery Modal -->
    <transition name="fade">
      <div class="modal-overlay" v-if="selectedGalleryItem" @click="closeGalleryModal">
        <div class="modal-content" @click.stop>
          <button class="close-btn" @click="closeGalleryModal">✕</button>
          <h2 class="modal-title">{{ selectedGalleryItem.name }}</h2>
          <div v-if="selectedGalleryItem.image" class="modal-img" :class="{ 'is-emoji': !isUrl(selectedGalleryItem.image) }">
            <template v-if="isUrl(selectedGalleryItem.image)"><img :src="resolveImageUrl(selectedGalleryItem.image)" :alt="selectedGalleryItem.name" /></template>
            <template v-else><div class="modal-emoji">{{ selectedGalleryItem.image }}</div></template>
          </div>
          <div class="modal-desc-box">
            <p>{{ selectedGalleryItem.description }}</p>
            <div class="fact-box" v-if="selectedGalleryItem.fact"><strong>💡 科普：</strong> {{ selectedGalleryItem.fact }}</div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCategories } from '@/data/questions'
import { fetchGallery } from '@/data/gallery'
import { resolveImageUrl, isUrl } from '@/utils/assets'
import { useProgressStore } from '@/stores/useProgressStore'
import { getCategoryColor } from '@/utils/categoryColor'
import type { CategoryData, GalleryItem } from '@/types/question'

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()
const categoryId = route.params.category as string
const category = ref<CategoryData | null>(null)
const isLoading = ref(true)
const activeTab = ref<'levels' | 'gallery'>('levels')
const galleryData = ref<GalleryItem[]>([])
const isLoadingGallery = ref(false)
const selectedGalleryItem = ref<GalleryItem | null>(null)



onMounted(async () => { const cats = await fetchCategories(); category.value = cats.find(c => c.id === categoryId) || null; isLoading.value = false })
watch(activeTab, t => { if (t === 'gallery' && !galleryData.value.length) loadGalleryData() })
async function loadGalleryData() { isLoadingGallery.value = true; galleryData.value = await fetchGallery(categoryId); isLoadingGallery.value = false }
function openGalleryModal(item: GalleryItem) { selectedGalleryItem.value = item }
function closeGalleryModal() { selectedGalleryItem.value = null }
function goHome() { if (window.history.state?.back) router.back(); else router.replace('/') }
function getLevelKey(levelId: string) { return `${categoryId}_${levelId}` }
function isUnlocked(index: number) { if (index === 0) return true; const lid = category.value?.levels?.[index]?.id; if (!lid) return false; return !!progressStore.unlockedLevels[getLevelKey(lid)]?.unlocked }
function getScore(levelId: string) { return progressStore.unlockedLevels[getLevelKey(levelId)]?.score || 0 }
function playLevel(levelId: string, index: number) { if (isUnlocked(index)) router.push(`/game/${categoryId}/${levelId}`) }
</script>

<style scoped lang="less">
.levels-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1.5rem 1rem;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  z-index: 1;

  @media (min-width: 600px) {
    max-width: 900px;
  }
}

.levels-header {
  display: flex;
  align-items: center;
  padding: 0.8rem 0;
  margin-bottom: 0.8rem;
  gap: 0.6rem;
  overflow: hidden;

  .category-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--theme-text-secondary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;

    @media (min-width: 600px) {
      font-size: 1.8rem;
    }
  }
}

.mode-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  align-self: center;
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  box-shadow: var(--theme-shadow-card);
  overflow: hidden;
}

.tab-btn {
  background: var(--theme-card-bg);
  border: none;
  border-right: var(--theme-border-width-xs) solid var(--theme-border-color);
  padding: 0.6rem 1.4rem;
  font-size: 1rem;
  font-weight: 800;
  color: var(--theme-text-light);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--theme-shadow-inner);

  &:last-child {
    border-right: none;
  }

  &.active {
    background: var(--theme-tab-active-bg);
    color: var(--theme-tab-active-text);
    box-shadow: var(--theme-shadow-card-active);
  }

  &:hover:not(.active) {
    background: var(--theme-btn-settings-bg);
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

.levels-area, .gallery-area {
  flex: 1;
}

.levels-grid, .gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
}

.gallery-grid {
  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

.level-card {
  background: var(--theme-card-inner);
  border: var(--theme-level-card-border);
  border-radius: var(--theme-radius-sm);
  padding: 0.8rem 0.4rem;
  text-align: center;
  box-shadow: var(--theme-shadow-btn);
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 85px;

  @media (min-width: 600px) {
    padding: 1.2rem 0.8rem;
    min-height: 110px;
  }

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }
  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-btn-active);
  }

  &.locked {
    border-color: #B8C2CC;
    background: var(--theme-btn-disabled-bg);
    cursor: not-allowed;
    opacity: 0.75;
    pointer-events: none;
  }

  .level-info {
    h3 {
      margin: 0 0 0.2rem;
      color: var(--theme-text-secondary);
      font-weight: 800;
      font-size: 0.9rem;
      @media (min-width: 600px) {
        font-size: 1.1rem;
      }
    }
    p {
      margin: 0;
      color: var(--theme-text-light);
      font-size: 0.8rem;
      font-weight: 700;
      @media (min-width: 600px) {
        font-size: 0.9rem;
      }
    }
  }

  .level-status {
    margin-top: 0.4rem;
  }

  .score-badge {
    background: var(--theme-card-bg);
    color: #E85A7F;
    border: var(--theme-border-width-xs) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    padding: 2px 6px;
    font-size: 0.75rem;
    font-weight: 800;
    display: inline-block;
    @media (min-width: 600px) {
      font-size: 0.85rem;
      padding: 3px 8px;
    }
  }

  .play-hint {
    color: var(--theme-accent);
    font-weight: 800;
    font-size: 0.85rem;
    @media (min-width: 600px) {
      font-size: 1rem;
    }
  }

  .lock-icon {
    font-size: 0.8rem;
    color: var(--theme-text-light);
    font-weight: 700;
  }
}

.gallery-card {
  background: var(--theme-card-inner);
  border: var(--theme-gallery-card-border);
  border-radius: var(--theme-radius-sm);
  padding: 0.5rem;
  text-align: center;
  box-shadow: var(--theme-shadow-btn);
  cursor: pointer;
  transition: transform 0.15s;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }

  .gallery-img-wrap {
    width: 100%;
    overflow: hidden;
    margin-bottom: 0.5rem;
    background: #FAFAFA;
    display: flex;
    align-items: center;
    justify-content: center;
    border: var(--theme-border-width-xs) solid var(--theme-btn-disabled-bg);
    border-radius: var(--theme-radius-sm);

    &.is-emoji {
      background: transparent;
      border: none;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .f-emoji {
      font-size: 2.5rem;
    }
  }

  .gallery-name {
    color: var(--theme-text-secondary);
    font-weight: 800;
    font-size: 0.95rem;
    line-height: 1.3;

    &.no-img {
      margin: auto 0;
      font-size: 1rem;
    }
  }
}

.msg {
  text-align: center;
  color: var(--theme-text-secondary);
  font-weight: 800;
  font-size: 1.1rem;
  margin-top: 3rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--theme-overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 420px;
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-md);
  position: relative;
  padding: 1.8rem 1.5rem;
  box-shadow: var(--theme-shadow-card);
  animation: fadeInUp 0.35s ease-out;

  .close-btn {
    position: absolute;
    top: 0.8rem;
    right: 0.8rem;
    width: 28px;
    height: 28px;
    background: var(--theme-btn-secondary-bg);
    border: var(--theme-border-width-xs) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    color: var(--theme-text-secondary);
    font-weight: 800;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      background: #F6A8C2;
      color: white;
    }
  }

  .modal-title {
    color: var(--theme-text-secondary);
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0 0 1rem;
  }

  .modal-img {
    width: 100%;
    height: 170px;
    overflow: hidden;
    margin-bottom: 1rem;
    border: var(--theme-border-width) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--theme-card-inner);
    box-shadow: var(--theme-shadow-inner);

    &.is-emoji {
      border: none;
      background: transparent;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .modal-emoji {
      font-size: 4rem;
    }
  }

  .modal-desc-box {
    background: var(--theme-card-inner);
    padding: 1rem;
    border: var(--theme-border-width-xs) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    text-align: left;

    p {
      color: var(--theme-text-muted);
      font-size: 1rem;
      line-height: 1.7;
      margin: 0;
      font-weight: 600;
    }
  }

  .fact-box {
    background: var(--theme-fact-bg);
    color: var(--theme-fact-color);
    border: 2px dashed var(--theme-info);
    border-radius: var(--theme-radius-sm);
    padding: 0.8rem;
    font-size: 0.95rem;
    line-height: 1.7;
    margin-top: 0.8rem;
  }
}

.fade {
  &-enter-active, &-leave-active { transition: opacity 0.3s; }
  &-enter-from, &-leave-to { opacity: 0; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(25px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
