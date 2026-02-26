<template>
  <div class="statistics-container">
    <header class="page-header">
      <button class="back-btn cute-btn" @click="goBack">← 返回首页</button>
      <h2>🎯 统计中心</h2>
    </header>

    <main class="stats-content">
      <div class="stat-card total-score">
        <div class="icon-bg">🏆</div>
        <h3>生涯总得分</h3>
        <div class="score-value">{{ progressStore.totalScore }}</div>
      </div>

      <div class="stat-card accuracy-card">
        <h3>答题正确率</h3>
        <div class="circle-progress">
          <svg viewBox="0 0 100 100">
            <circle class="bg" cx="50" cy="50" r="40" />
            <circle class="fill" cx="50" cy="50" r="40" 
              :style="{ strokeDasharray: `${accuracy * 2.51} 251` }" />
          </svg>
          <div class="circle-text">
            <span class="pct">{{ accuracy }}%</span>
          </div>
        </div>
        <div class="stat-details">
          <div class="detail-item">
            <span class="label">答对</span>
            <span class="val text-success">{{ progressStore.totalCorrect }}</span>
          </div>
          <div class="detail-item">
            <span class="label">答错</span>
            <span class="val text-error">{{ progressStore.totalAnswered - progressStore.totalCorrect }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card achievement">
        <h3>你的阶段评价</h3>
        <div class="eval-box">
          <div class="eval-title">{{ getEvaluation().title }}</div>
          <p class="eval-desc">{{ getEvaluation().desc }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/useProgressStore'

const router = useRouter()
const progressStore = useProgressStore()

function goBack() {
  router.push('/')
}

const accuracy = computed(() => {
  const total = progressStore.totalAnswered
  const correct = progressStore.totalCorrect
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
})

function getEvaluation() {
  const total = progressStore.totalAnswered
  const acc = accuracy.value
  
  if (total === 0) return { title: '启航者 ⛵', desc: '你还没有答过题呢，快去挑战吧！' }
  if (total < 50) return { title: '好奇宝宝 👶', desc: '才刚开始探索 Factopia，前方还有很多有趣的知识！' }
  if (acc >= 90) return { title: '百科宗师 👑', desc: '你的常识储备惊人！简直行走的百科全书！' }
  if (acc >= 70) return { title: '百事通 🤓', desc: '很厉害嘛，大部分问题都难不倒你！' }
  return { title: '探索家 🔭', desc: '答错不要紧，这是积累知识的最佳途径！' }
}
</script>

<style scoped>
.statistics-container {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-header h2 {
  color: #5E4C41;
  font-size: 2rem;
  margin: 0;
  text-shadow: 0 2px 0 rgba(94, 76, 65, 0.1);
}

.cute-btn {
  background: #FFFDF8;
  border: 2px solid #5E4C41;
  padding: 0.5rem 1.2rem;
  border-radius: 999px;
  color: #5E4C41;
  font-weight: 800;
  box-shadow: 0 4px 0 rgba(94, 76, 65, 0.1);
  transition: all 0.2s;
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

.stats-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 600px) {
  .stats-content {
    grid-template-columns: 1fr 1fr;
  }
  .accuracy-card {
    grid-row: span 2;
  }
}

.stat-card {
  background: white;
  border: 2px solid #5E4C41;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 0 rgba(94, 76, 65, 0.08);
  position: relative;
  overflow: hidden;
  text-align: center;
}

.stat-card h3 {
  margin-top: 0;
  color: #5E4C41;
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
}

.total-score {
  background: #FFF7DF;
}

.total-score .icon-bg {
  position: absolute;
  font-size: 8rem;
  right: -20px;
  bottom: -20px;
  opacity: 0.2;
}

.score-value {
  font-size: 4rem;
  font-weight: 900;
  color: #E67E22;
  text-shadow: 0 2px 0 rgba(0,0,0,0.1);
}

.accuracy-card {
  background: #F4F9F1;
}

.circle-progress {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto 2rem;
}

.circle-progress svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.circle-progress circle {
  fill: none;
  stroke-width: 12;
  stroke-linecap: round;
}

.circle-progress .bg {
  stroke: #D9E3B4;
}

.circle-progress .fill {
  stroke: #84AC50;
  transition: stroke-dasharray 1s ease-out;
}

.circle-text {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-text .pct {
  font-size: 2.2rem;
  font-weight: 900;
  color: #5E4C41;
}

.stat-details {
  display: flex;
  justify-content: space-around;
  border-top: 2px dashed #D9E3B4;
  padding-top: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  color: #8E705B;
  font-weight: bold;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.detail-item .val {
  font-size: 1.8rem;
  font-weight: 900;
}

.text-success { color: #84AC50; }
.text-error { color: #E74C3C; }

.achievement {
  background: #FDF5E6;
}

.eval-box {
  background: white;
  border: 2px solid #5E4C41;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 0 rgba(94, 76, 65, 0.05);
}

.eval-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #A3D1E6;
  margin-bottom: 0.5rem;
}

.eval-desc {
  color: #5E4C41;
  font-weight: bold;
  line-height: 1.5;
  margin: 0;
}
</style>
