<template>
  <div class="home-container">
    <!-- Background scenery -->
    <div class="background-scenery">
      <!-- Clouds -->
      <div class="cloud-group" style="top: 15%; left: 10%; transform: scale(0.8);">
        <div class="cloud cloud-main"></div>
      </div>
      <div class="cloud-group" style="top: 25%; left: 80%; transform: scale(0.6);">
        <div class="cloud cloud-main"></div>
      </div>
      
      <!-- Tiny decorative elements can go here -->

      <!-- Hills -->
      <div class="hill hill-bg"></div>
      <div class="hill hill-fg"></div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <header class="hero">
        <div class="logo-container">
          <!-- Twinkle stars -->
          <svg class="twinkle" style="top: -10px; left: -30px;" viewBox="0 0 24 24"><path d="M12 0 Q12 12 24 12 Q12 12 12 24 Q12 12 0 12 Q12 12 12 0 Z" fill="#F8B182" stroke="#5E4C41" stroke-width="2" stroke-linejoin="round"/></svg>
          <svg class="twinkle" style="top: 20px; left: -15px; transform: scale(0.5);"><path d="M12 0 Q12 12 24 12 Q12 12 12 24 Q12 12 0 12 Q12 12 12 0 Z" fill="#F6A8C2" stroke="#5E4C41" stroke-width="2" stroke-linejoin="round"/></svg>
          <svg class="twinkle" style="top: -5px; right: -40px; transform: scale(0.8);"><path d="M12 0 Q12 12 24 12 Q12 12 12 24 Q12 12 0 12 Q12 12 12 0 Z" fill="#A3D1E6" stroke="#5E4C41" stroke-width="2" stroke-linejoin="round"/></svg>
          <svg class="twinkle" style="top: 30px; right: -20px; transform: scale(0.4);"><path d="M12 0 Q12 12 24 12 Q12 12 12 24 Q12 12 0 12 Q12 12 12 0 Z" fill="#C4DE95" stroke="#5E4C41" stroke-width="2" stroke-linejoin="round"/></svg>
          
          <h1 class="logo">
            <span v-for="(char, i) in 'Factopia'" :key="i" :style="{ color: logoColors[i % logoColors.length] }">
              {{ char }}
            </span>
          </h1>
        </div>
        <p class="subtitle">探索有趣的常识，挑战你的认知！</p>
      </header>

      <div class="settings-bar">
        <button class="settings-btn" @click="settingsStore.toggleSound" :class="{ disabled: !settingsStore.soundEnabled }">
          音效: {{ settingsStore.soundEnabled ? '开启 🔊' : '关闭 🔇' }}
        </button>
        <div class="global-stats">
          总得分: <span>{{ progressStore.totalScore }}</span>
        </div>
      </div>
      
      <main class="categories" v-if="categories.length">
        <router-link 
          v-for="cat in categories" 
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchCategories } from '@/data/questions'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useProgressStore } from '@/stores/useProgressStore'
import type { CategoryData } from '@/types/question'

const categories = ref<CategoryData[]>([])
const settingsStore = useSettingsStore()
const progressStore = useProgressStore()

const logoColors = ['#F6A8C2', '#F8B182', '#A3D1E6', '#B8C2CC', '#F6A8C2', '#A3D1E6', '#F8B182', '#A3D1E6']

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
  traditional_instruments: '#EEA8B2'
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

onMounted(async () => {
  categories.value = await fetchCategories()
})
</script>

<style scoped>
.home-container {
  padding: 2rem 1rem;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
  z-index: 1;
}

/* Base resets specifically for app view to match our overall theme if globals don't */
:global(body) {
  background-color: #FDF4E5 !important;
  color: #5E4C41;
}

/* Background Scenery Elements */
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

/* Clouds with dropshadow for outline */
.cloud-group {
  position: absolute;
  filter: drop-shadow(2px 0 0 #5E4C41) 
          drop-shadow(-2px 0 0 #5E4C41) 
          drop-shadow(0 2px 0 #5E4C41) 
          drop-shadow(0 -2px 0 #5E4C41);
}
.cloud {
  background: white;
  border-radius: 50px;
  position: relative;
}
.cloud::before, .cloud::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
}
.cloud-main {
  width: 140px;
  height: 50px;
}
.cloud-main::before {
  width: 70px;
  height: 70px;
  top: -35px;
  left: 20px;
}
.cloud-main::after {
  width: 50px;
  height: 50px;
  top: -20px;
  right: 25px;
}

/* Hills */
.hill {
  position: absolute;
  border-radius: 50%;
}
.hill-bg {
  bottom: -20vh;
  left: -10vw;
  width: 120vw;
  height: 40vh;
  background-color: #C5DCA0;
}
.hill-fg {
  bottom: -25vh;
  right: -10vw;
  width: 80vw;
  height: 45vh;
  background-color: #ACD17C;
}

/* Main Layout */
.content {
  position: relative;
  z-index: 10;
}

.hero {
  text-align: center;
  margin-top: 2rem;
  margin-bottom: 2rem;
  animation: fadeInDown 0.8s ease-out;
}

.logo-container {
  position: relative;
  display: inline-block;
}

.twinkle {
  position: absolute;
  width: 24px;
  height: 24px;
}

.logo {
  font-size: 3.2rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  /* Simulating bubbly text with stroke */
  -webkit-text-stroke: 2px #5E4C41;
  letter-spacing: 2px;
  text-shadow: 0 4px 0 rgba(94, 76, 65, 0.2);
}

@media (min-width: 600px) {
  .logo {
    font-size: 4.5rem;
    -webkit-text-stroke: 3px #5E4C41;
    letter-spacing: 4px;
  }
}

.logo span {
  display: inline-block;
  transition: transform 0.3s;
}

.logo span:hover {
  transform: translateY(-8px) scale(1.1);
}

.subtitle {
  font-size: 1.1rem;
  color: #5E4C41;
  font-weight: 600;
}

.settings-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 650px;
  margin: 0 auto 2.5rem auto;
  padding: 0.6rem 1.5rem 0.6rem 0.8rem;
  background: #FFFDF8;
  border: 2px solid #5E4C41;
  border-radius: 999px;
  box-shadow: 0 4px 0 rgba(94, 76, 65, 0.1);
}

.settings-btn {
  background: #D9E3B4;
  border: 2px solid #5E4C41;
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  color: #5E4C41;
  font-weight: 800;
  font-size: 0.95rem;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.settings-btn.disabled {
  background: #EAEAEA;
}

.settings-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 0 #5E4C41;
}

.settings-btn:active {
  transform: translateY(0);
  box-shadow: none;
}

.global-stats {
  font-weight: 800;
  color: #5E4C41;
  font-size: 1.05rem;
}
.global-stats span {
  font-size: 1.2rem;
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

/* Cards setup according to the image spec */
.category-card {
  background: var(--theme-color);
  border-radius: 20px; 
  padding: 8px;
  text-decoration: none;
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.4), 
              inset 0 -3px 0 rgba(0,0,0,0.1), 
              0 6px 12px rgba(94, 76, 65, 0.08); /* 3D effect */
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
}

.category-card:hover .card-inner {
  background: #FAFAFA;
}

.icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 14px; /* squircle inner */
  background-color: var(--theme-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.8rem;
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.1); /* 3D inside circle */
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

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
