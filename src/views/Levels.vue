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

    <div class="mode-tabs" v-if="category">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'levels' }"
        @click="activeTab = 'levels'"
      >
        🎮 闯关模式
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'gallery' }"
        @click="activeTab = 'gallery'"
      >
        📖 图鉴模式
      </button>
    </div>

    <main class="levels-area" v-if="category && activeTab === 'levels'">
      <div class="levels-grid">
        <div 
          v-for="(lvl, index) in category.levels" 
          :key="lvl.id" 
          class="level-card cute-card-inner"
          :class="{ 'locked': !isUnlocked(index) }"
          :style="{ borderColor: isUnlocked(index) ? getCategoryColor(categoryId) : undefined }"
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

    <main class="gallery-area" v-else-if="category && activeTab === 'gallery'">
      <div v-if="isLoadingGallery" class="loading-msg">正在加载图鉴数据...</div>
      <div v-else-if="galleryData.length === 0" class="empty-msg">暂时没有图鉴数据哦~</div>
      <div v-else class="gallery-grid">
        <div 
          v-for="item in galleryData" 
          :key="item.id" 
          class="gallery-card cute-card-inner"
          :style="{ borderColor: getCategoryColor(categoryId) }"
          @click="openGalleryModal(item)"
        >
          <div v-if="item.image" class="gallery-img-wrap" :class="{ 'is-emoji': !isUrl(item.image) }">
            <template v-if="isUrl(item.image)">
              <img :src="resolveImageUrl(item.image)" :alt="item.name" loading="lazy" />
            </template>
            <template v-else>
              <div class="f-emoji">{{ item.image }}</div>
            </template>
          </div>
          <div class="gallery-name" :class="{ 'no-img': !item.image }">{{ item.name }}</div>
        </div>
      </div>
    </main>

    <div v-else-if="!isLoading" class="error-msg">未找到该分类的数据。</div>

    <!-- Gallery Modal -->
    <transition name="fade">
      <div class="gallery-modal-overlay" v-if="selectedGalleryItem" @click="closeGalleryModal">
        <div class="gallery-modal-content fade-in-up" @click.stop>
          <button class="close-btn" @click="closeGalleryModal">✕</button>
          <h2 class="modal-title">{{ selectedGalleryItem.name }}</h2>
          <div v-if="selectedGalleryItem.image" class="modal-img-wrap" :class="{ 'is-emoji': !isUrl(selectedGalleryItem.image) }">
            <template v-if="isUrl(selectedGalleryItem.image)">
              <img :src="resolveImageUrl(selectedGalleryItem.image)" :alt="selectedGalleryItem.name" />
            </template>
            <template v-else>
              <div class="modal-emoji">{{ selectedGalleryItem.image }}</div>
            </template>
          </div>
          <div class="modal-desc-container">
            <p class="modal-desc">{{ selectedGalleryItem.description }}</p>
            <div class="fact-box mt-2" v-if="selectedGalleryItem.fact"><strong>💡 科普：</strong> {{ selectedGalleryItem.fact }}</div>
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
  space_exploration: '#D2C4ED',
  medical_guide: '#F2B8D2',
  psychology_effects: '#CBB2EB'
}

const getCategoryColor = (id: string) => {
  return categoryColors[id] || '#A3D1E6'
}

onMounted(async () => {
  const cats = await fetchCategories()
  category.value = cats.find(c => c.id === categoryId) || null
  isLoading.value = false
})

watch(activeTab, (newTab) => {
  if (newTab === 'gallery' && galleryData.value.length === 0) {
    loadGalleryData()
  }
})

async function loadGalleryData() {
  isLoadingGallery.value = true
  galleryData.value = await fetchGallery(categoryId)
  isLoadingGallery.value = false
}

function openGalleryModal(item: GalleryItem) {
  selectedGalleryItem.value = item
}

function closeGalleryModal() {
  selectedGalleryItem.value = null
}

function goHome() {
  if (window.history.state && window.history.state.back) {
    router.back()
  } else {
    router.replace('/')
  }
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
  margin-bottom: 1rem;
  gap: 1.5rem;
}

.category-title {
  font-size: 2rem;
  font-weight: 900;
  color: #5E4C41;
  margin: 0;
  text-shadow: 0 2px 0 rgba(94, 76, 65, 0.1);
}

.mode-tabs {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.5);
  padding: 0.5rem;
  border-radius: 999px;
  align-self: center;
  border: 2px solid #5E4C41;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 0.6rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 800;
  color: #8E705B;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #5E4C41;
  color: #FFFDF8;
  box-shadow: 0 2px 8px rgba(94, 76, 65, 0.3);
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

.levels-area, .gallery-area {
  flex: 1;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}

@media (min-width: 600px) {
  .levels-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.2rem;
  }
}

.cute-card-inner {
  background: white;
  border: 4px solid #A3D1E6;
  border-radius: 16px;
  padding: 0.8rem 0.4rem;
  text-align: center;
  box-shadow: 0 4px 0 rgba(94, 76, 65, 0.1);
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 90px;
}

@media (min-width: 600px) {
  .cute-card-inner {
    border-radius: 20px;
    padding: 1.5rem 1rem;
    min-height: 120px;
    box-shadow: 0 6px 0 rgba(94, 76, 65, 0.1);
  }
}

.cute-card-inner:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 0 rgba(94, 76, 65, 0.15);
}

.cute-card-inner:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 rgba(94, 76, 65, 0.1);
}

.gallery-card {
  border-color: #F8B182;
  padding: 0.6rem;
  justify-content: flex-start;
  min-height: 110px;
}

@media (min-width: 600px) {
  .gallery-card {
    padding: 1rem;
    min-height: 140px;
  }
}

.gallery-img-wrap {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.8rem;
  background: #FAFAFA;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #EAEAEA;
}

.gallery-img-wrap.is-emoji {
  background: transparent;
  border: none;
}

.gallery-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.f-emoji {
  font-size: 3rem;
  display: inline-block;
}

.gallery-name {
  color: #5E4C41;
  font-weight: 900;
  font-size: 1.1rem;
  line-height: 1.3;
}

.gallery-name.no-img {
  font-size: 1.2rem;
  margin-top: auto;
  margin-bottom: auto;
}

@media (min-width: 600px) {
  .gallery-name.no-img {
    font-size: 1.3rem;
  }
}

.locked {
  border-color: #B8C2CC;
  background: #EAEAEA;
  cursor: not-allowed;
  opacity: 0.8;
  pointer-events: none;
}

.level-info h3 {
  margin: 0 0 0.3rem 0;
  color: #5E4C41;
  font-weight: 900;
  font-size: 1rem;
}

.level-info p {
  margin: 0;
  color: #8E705B;
  font-size: 0.8rem;
  font-weight: bold;
}

@media (min-width: 600px) {
  .level-info h3 {
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
  }
  .level-info p {
    font-size: 0.95rem;
  }
}

.level-status {
  margin-top: 0.6rem;
}

@media (min-width: 600px) {
  .level-status {
    margin-top: 1rem;
  }
}

.score-badge {
  background: #FFFDF8;
  color: #E85A7F;
  border: 2px solid #5E4C41;
  border-radius: 999px;
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
  font-weight: 800;
  display: inline-block;
}

@media (min-width: 600px) {
  .score-badge {
    padding: 0.3rem 0.8rem;
    font-size: 0.9rem;
  }
}

.play-hint {
  color: #F8B182;
  font-weight: 900;
  font-size: 0.9rem;
}

@media (min-width: 600px) {
  .play-hint {
    font-size: 1.1rem;
  }
}

.lock-icon {
  font-size: 0.9rem;
  color: #8E705B;
  font-weight: bold;
}
@media (min-width: 600px) {
  .lock-icon {
    font-size: 1rem;
  }
}

.loading-msg, .empty-msg, .error-msg {
  text-align: center;
  color: #5E4C41;
  font-weight: bold;
  font-size: 1.2rem;
  margin-top: 3rem;
}

/* Modal styles */
.gallery-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(94, 76, 65, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.gallery-modal-content {
  width: 90%;
  max-width: 450px;
  background: #FFFDF8;
  border-color: #F8B182;
  position: relative;
  cursor: default;
  min-height: auto;
  padding: 2rem 1.5rem;
}

.gallery-modal-content:hover {
  transform: none;
  box-shadow: 0 6px 0 rgba(94, 76, 65, 0.1);
}

.gallery-modal-content:active {
  transform: none;
  box-shadow: 0 6px 0 rgba(94, 76, 65, 0.1);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #EAEAEA;
  border: 2px solid #5E4C41;
  color: #5E4C41;
  font-weight: bold;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #F6A8C2;
  color: white;
  transform: scale(1.1);
}

.modal-title {
  color: #5E4C41;
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 1.5rem 0;
}

.modal-img-wrap {
  width: 100%;
  height: 200px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  border: 3px solid #EAEAEA;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-img-wrap.is-emoji {
  border: none;
  background: transparent;
}

.modal-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.modal-emoji {
  font-size: 5rem;
}

.modal-desc-container {
  background: #FAFAFA;
  padding: 1.2rem;
  border-radius: 12px;
  border: 2px solid #EAEAEA;
  text-align: left;
}

.modal-desc {
  color: #5C5552;
  font-size: 1.05rem;
  line-height: 1.6;
  margin: 0;
  font-weight: 600;
}

.fact-box {
  background: #E8F4F8;
  color: #1A5276;
  border: 1px dashed #A3D1E6;
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.mt-2 {
  margin-top: 1rem;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-in-up {
  animation: fadeInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
