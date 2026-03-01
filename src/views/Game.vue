<template>
  <div class="game-container">


    <header class="game-header">
      <button class="back-btn cute-btn" @click="goBack">← 返回</button>
      <div class="progress pill" v-if="questions.length > 0">
        进度: <span>{{ currentIndex + 1 }} / {{ questions.length }}</span>
      </div>
      <div class="score pill">得分: <span>{{ quizStore.currentScore }}</span></div>
    </header>

    <main class="game-area">
      <div v-if="isLoading" class="state-view cute-card">
        <div class="loader"></div>
        <p>正在加载题目...</p>
      </div>

      <div v-else-if="questions.length === 0" class="state-view cute-card error">
        <h2>非常抱歉</h2>
        <p>暂未找到类别「{{ category }}」的题目！</p>
        <button class="cute-btn primary-btn" @click="goBack">返回关卡</button>
      </div>

      <div v-else-if="isGameOver" class="state-view cute-card end-game">
        <h2 class="bubbly-text">🎉 游戏结束！</h2>
        <div class="final-score">
          最终得分
          <span>{{ quizStore.currentScore }}</span>
        </div>
        <p class="stats">
          总用时: {{ formatTime(timeSpent) }} | 正确率: {{ quizStore.getCurrentAccuracy() }}%
        </p>
        <p class="encouragement">
          {{ getEncouragementText() }}
        </p>
        <div class="actions">
          <button class="cute-btn secondary-btn" @click="goBack">返回关卡</button>
          <button v-if="hasNextLevel" class="cute-btn primary-btn" @click="goToNextLevel">下一关卡</button>
          <button 
            v-if="quizStore.currentMistakes.length > 0" 
            class="cute-btn secondary-btn" 
            @click="showMistakeList = !showMistakeList"
          >
            {{ showMistakeList ? '隐藏错题' : `错题解析 (${quizStore.currentMistakes.length})` }}
          </button>
        </div>

        <div v-if="showMistakeList" class="mistakes-panel">
          <h3>错题回顾</h3>
          <div v-for="qId in quizStore.currentMistakes" :key="qId" class="mistake-item cute-card-inner">
            <div class="m-title">{{ getQuestionPrompt(qId) }}</div>
            <div class="m-answer">正确答案: <span>{{ getQuestionAnswer(qId) }}</span></div>
            <div class="m-explain">{{ getQuestionExplanation(qId) }}</div>
          </div>
        </div>
      </div>

      <QuestionCard
        v-else-if="currentQuestion"
        :question="currentQuestion"
        :category-id="category"
        @answer="handleAnswer"
        @next="nextQuestion"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/useQuizStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import QuestionCard from '@/components/QuestionCard.vue'
import { fetchCategories, fetchQuestionsByLevel } from '@/data/questions'
import type { Question } from '@/types/question'

const props = defineProps<{
  category: string
  level: string
}>()

const router = useRouter()
const quizStore = useQuizStore()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()

const isLoading = ref(true)
const questions = ref<Question[]>([])
const isGameOver = ref(false)
const showMistakeList = ref(false)
const hasNextLevel = ref(false)
const nextLevelId = ref('')

// Timer
const timeSpent = ref(0)
let timerRef: number

const currentIndex = computed(() => quizStore.currentQuestionIndex)
const currentQuestion = computed(() => questions.value[currentIndex.value])

onMounted(async () => {
  quizStore.resetQuiz()
  
  try {
    const loadedQuestions = await fetchQuestionsByLevel(props.category, props.level)
    // 随机打乱
    questions.value = [...loadedQuestions].sort(() => Math.random() - 0.5)
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
    timerRef = window.setInterval(() => {
      if (!isGameOver.value && questions.value.length > 0) {
        timeSpent.value++
      }
    }, 1000)
  }
})

onUnmounted(() => {
  clearInterval(timerRef)
})

function handleAnswer(isCorrect: boolean) {
  if (!currentQuestion.value) return
  const qId = String(currentQuestion.value.id)
  quizStore.submitAnswer(isCorrect, qId)
  
  if (!isCorrect) {
    // 立即存入错题本，防止中途退出丢失
    progressStore.addMistakes(props.category, [qId])
  }
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    quizStore.nextQuestion()
  } else {
    isGameOver.value = true
    clearInterval(timerRef)
    handleGameOver()
  }
}

async function handleGameOver() {
  settingsStore.playSound('win')
  // 写入持久化记录
  progressStore.updateLevelProgress(props.category, props.level, quizStore.currentScore, quizStore.getCurrentAccuracy())
  progressStore.addMistakes(props.category, quizStore.currentMistakes)
  progressStore.addStats(quizStore.getAnsweredCount(), quizStore.getCurrentCorrectCount())
  
  // 解锁下一关
  try {
    const cats = await fetchCategories()
    const cat = cats.find(c => c.id === props.category)
    if (cat && Array.isArray(cat.levels)) {
      const idx = cat.levels.findIndex(l => l.id === props.level)
      const nextLevel = cat.levels[idx + 1]
      if (idx !== -1 && nextLevel) {
        progressStore.unlockNextLevel(props.category, nextLevel.id)
        hasNextLevel.value = true
        nextLevelId.value = nextLevel.id
      }
    }
  } catch (err) {
    console.error('Failed to unlock next level', err)
  }
}

function goToNextLevel() {
  router.replace(`/game/${props.category}/${nextLevelId.value}`)
}

function goBack() {
  if (window.history.state && window.history.state.back) {
    router.back()
  } else {
    router.replace(`/levels/${props.category}`)
  }
}

function getEncouragementText() {
  const acc = quizStore.getCurrentAccuracy()
  if (acc === 100) return '太棒了！你全部答对了！非常完美！'
  if (acc >= 70) return '表现不错，继续努力保持！'
  return '失败是成功之母，针对错题复习一下吧！'
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s}秒`
}

// Helpers for mistakes review
function getQuestionById(qId: string) {
  return questions.value.find(q => String(q.id) === String(qId))
}

function getQuestionPrompt(qId: string) {
  return getQuestionById(qId)?.prompt || '未知题目'
}

function getQuestionAnswer(qId: string) {
  const q = getQuestionById(qId)
  if (!q) return ''
  if (typeof q.answer === 'boolean') return q.answer ? '正确' : '错误'
  return q.answer
}

function getQuestionExplanation(qId: string) {
  return getQuestionById(qId)?.explanation || '暂无解析'
}
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}




.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  margin-bottom: 1rem;
}

.pill {
  background: #FFFDF8;
  border: 2px solid #5E4C41;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-weight: bold;
  color: #5E4C41;
  box-shadow: 0 4px 0 rgba(94, 76, 65, 0.1);
  line-height: 1;
}
.pill span {
  font-size: 1.1rem;
  color: #F8B182;
  font-weight: 900;
  margin-left: 0.5rem;
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

.primary-btn {
  background: #A3D1E6;
  font-size: 1.1rem;
  padding: 0.8rem 2rem;
}

.secondary-btn {
  background: #EAEAEA;
  font-size: 1.1rem;
  padding: 0.8rem 2rem;
}

.game-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0 0 2rem 0;
}

.cute-card {
  background: white;
  border: 2px solid #5E4C41;
  border-radius: 24px;
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 8px 0 rgba(94, 76, 65, 0.08);
  width: 100%;
}

.bubbly-text {
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
  color: #E85A7F;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(94, 76, 65, 0.1);
}

.end-game h2 {
  margin-bottom: 1.5rem;
}

.final-score {
  font-size: 1.5rem;
  color: #5E4C41;
  font-weight: bold;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.final-score span {
  font-weight: 900;
  font-size: 4rem;
  color: #E67E22;
  text-shadow: 0 2px 4px rgba(94, 76, 65, 0.1);
  margin-top: 0.5rem;
}

.stats {
  font-size: 1.1rem;
  color: #5E4C41;
  margin-bottom: 1rem;
  font-weight: bold;
  background: #FFFDF8;
  display: inline-block;
  padding: 0.5rem 1.5rem;
  border-radius: 999px;
  border: 2px solid #5E4C41;
}

.encouragement {
  color: #8E705B;
  font-weight: bold;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

/* 错题回顾面板 */
.mistakes-panel {
  text-align: left;
  background: #FFFDF8;
  border: 2px solid #5E4C41;
  border-radius: 20px;
  padding: 1.5rem;
  margin-top: 2rem;
}

.mistakes-panel h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #E85A7F;
  font-size: 1.5rem;
  text-align: center;
  border-bottom: 2px dashed #5E4C41;
  padding-bottom: 1rem;
}

.mistake-item {
  margin-bottom: 1.5rem;
  background: white;
  border: 2px solid #5E4C41;
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 0 4px 0 rgba(94, 76, 65, 0.05);
}

.m-title {
  font-weight: 800;
  color: #5E4C41;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.m-answer {
  color: #A3D1E6;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.m-answer span {
  background: #FFFDF8;
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  border: 1px solid #A3D1E6;
  color: #5E4C41;
}

.m-explain {
  font-size: 0.95rem;
  color: #8E705B;
  line-height: 1.5;
  background: #FDF5E6;
  padding: 0.8rem;
  border-radius: 10px;
}

/* Loader */
.loader {
  border: 4px solid rgba(94, 76, 65, 0.1);
  border-top: 4px solid #F8B182;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
