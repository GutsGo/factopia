<template>
  <div class="question-card" :class="{ 'shake': animState === 'wrong', 'pop': animState === 'right' }">
    <div class="card-inner">
      <div class="card-actions">
        <button class="favorite-btn" :class="{ active: isFavorite }" @click="toggleFav" title="收藏/取消收藏">
          <span class="fav-icon">{{ isFavorite ? '⭐' : '☆' }}</span>
          <span class="fav-text">{{ isFavorite ? '已收藏' : '收藏' }}</span>
        </button>
      </div>

      <div class="question-header">
        <!-- 纯文本情景题 -->
        <div v-if="question.type === 'text'" class="text-scenario-wrapper cute-shadow">
          <p class="scenario-text">{{ question.text || question.prompt }}</p>
        </div>

        <!-- 兼容 URL 或者 emoji -->
        <div v-else-if="question.image || !imageLoaded" class="image-wrapper cute-shadow">
          <!-- 加载转圈动画 -->
          <div v-if="!imageLoaded" class="loader-container">
            <div class="loader"></div>
          </div>
          
          <template v-if="question.image">
            <template v-if="isUrl(question.image)">
              <img 
                v-show="imageLoaded"
                :src="resolveImageUrl(question.image)" 
                :key="question.id"
                :alt="question.prompt" 
                class="question-image" 
                @load="onImageLoad"
                @error="onImageLoad"
              />
            </template>
            <template v-else>
              <div v-if="imageLoaded" class="emoji-wrapper">{{ question.image }}</div>
            </template>
          </template>
        </div>
        <h2 class="question-title" v-if="question.type !== 'text'">{{ question.prompt }}</h2>
      </div>

      <div class="options-container">
        <template v-if="question.type === 'single_image_to_text' || question.type === 'single_text_to_image' || question.type === 'text'">
          <button
            v-for="(option, index) in question.options"
            :key="index"
            class="option-btn cute-btn has-letter"
            :class="[
              `dopamine-bg-${index % 4}`,
              { 
                'selected': selectedOption === option,
                'correct': hasAnswered && option === question.answer,
                'wrong': hasAnswered && selectedOption === option && option !== question.answer
              }
            ]"
            :data-letter="String.fromCharCode(65 + index)"
            :disabled="hasAnswered"
            @click="selectOption(option)"
          >
            <!-- 如果是选图模式，可能 option 就是 emoji 或者 URL -->
            <template v-if="isUrl(option)">
              <img :src="resolveImageUrl(option)" class="option-image" />
            </template>
            <template v-else>
              {{ option }}
            </template>
          </button>
        </template>

        <template v-else-if="question.type === 'true_false_image'">
          <button
            class="option-btn cute-btn"
            :class="{
              'selected': selectedOption === true,
              'correct': hasAnswered && question.answer === true,
              'wrong': hasAnswered && selectedOption === true && question.answer !== true
            }"
            :disabled="hasAnswered"
            @click="selectOption(true)"
          >
            正确
          </button>
          <button
            class="option-btn cute-btn"
            :class="{
              'selected': selectedOption === false,
              'correct': hasAnswered && question.answer === false,
              'wrong': hasAnswered && selectedOption === false && question.answer !== false
            }"
            :disabled="hasAnswered"
            @click="selectOption(false)"
          >
            错误
          </button>
        </template>
      </div>

      <transition name="feedback">
        <div v-if="hasAnswered" class="feedback-section">
          <div class="result-text" :class="isCorrect ? 'text-success' : 'text-error'">
            <span>{{ isCorrect ? '🎉 回答正确 (+10分)' : '❌ 回答错误 (-3分)' }}</span>
            <span v-if="isCorrect && quizStore.comboCount >= 3" class="combo-bonus">🔥连击 +5</span>
          </div>
          <div v-if="question.explanation" class="explanation cute-box">
            <strong>💡 解析：</strong> {{ question.explanation }}
          </div>
          <div v-if="question.fact" class="explanation cute-box fact-box">
            <strong>💡 科普：</strong> {{ question.fact }}
          </div>
          <button class="next-btn cute-btn" @click="emitNext">下一题 ➔</button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useQuizStore } from '@/stores/useQuizStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { resolveImageUrl, isUrl } from '@/utils/assets'
import type { Question } from '@/types/question'

const props = defineProps<{
  question: Question
  categoryId: string
}>()

const emit = defineEmits<{
  (e: 'answer', isCorrect: boolean): void
  (e: 'next'): void
}>()

const quizStore = useQuizStore()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()

const hasAnswered = ref(false)
const selectedOption = ref<any>(null)
const isCorrect = ref(false)
const animState = ref<'idle' | 'right' | 'wrong'>('idle')
const imageLoaded = ref(false)

const isFavorite = computed(() => progressStore.isFavorite(props.categoryId, String(props.question.id)))



function onImageLoad() {
  imageLoaded.value = true
}

function toggleFav() {
  progressStore.toggleFavorite(props.categoryId, String(props.question.id))
}

// Reset state when next question arrives
watch(() => props.question.id, () => {
  hasAnswered.value = false
  selectedOption.value = null
  isCorrect.value = false
  animState.value = 'idle'
  
  if (props.question.image && isUrl(props.question.image)) {
    imageLoaded.value = false
  } else {
    imageLoaded.value = true
  }
}, { immediate: true })

// 音频播放已经移至 settingsStore
function playSound(type: 'right' | 'wrong') {
  settingsStore.playSound(type)
}

function selectOption(option: any) {
  if (hasAnswered.value) return
  
  selectedOption.value = option
  hasAnswered.value = true
  isCorrect.value = option === props.question.answer

  if (isCorrect.value) {
    animState.value = 'right'
    playSound('right')
  } else {
    animState.value = 'wrong'
    playSound('wrong')
  }
  
  // Remove animation class after it plays to allow re-trigger
  setTimeout(() => {
    animState.value = 'idle'
  }, 500)

  emit('answer', isCorrect.value)
  
  // 滚动到下一题按钮
  setTimeout(() => {
    const nextBtn = document.querySelector('.next-btn')
    if (nextBtn) {
      nextBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, 100)
}

function emitNext() {
  imageLoaded.value = false // 立即清理上一题的显示状态
  emit('next')
  window.scrollTo({ top: 0, behavior: 'instant' })
}
</script>

<style scoped>
.question-card {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 26px;
  background: white;
  border: 2px solid #5E4C41;
  padding: 6px;
  box-shadow: 0 8px 16px rgba(94, 76, 65, 0.08); /* 柔和阴影 */
  position: relative;
}

.card-inner {
  border: 3px solid #FDF5E6; /* 给一层底色假边框增加厚度感 */
  border-radius: 20px;
  padding: 2.5rem;
  background: #FFFDF8;
  position: relative;
}

.question-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
}

.card-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.favorite-btn {
  background: #FFFDF8;
  border: 2px solid #5E4C41;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 0.85rem;
  color: #8E705B;
  font-weight: 800;
  cursor: pointer;
  outline: none;
  box-shadow: 0 3px 0 rgba(94, 76, 65, 0.1);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.favorite-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 0 rgba(94, 76, 65, 0.15);
}

.favorite-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 rgba(94, 76, 65, 0.1);
}

.favorite-btn.active {
  background: #FFF9E6;
  color: #D35400;
  border-color: #F8B182;
}

.fav-icon {
  font-size: 1rem;
}

@media (max-width: 600px) {
  .card-inner {
    padding: 1.5rem;
    padding-top: 3rem;
  }
  .card-actions {
    top: 0.8rem;
    right: 0.8rem;
  }
  .favorite-btn {
    padding: 4px 10px;
    font-size: 0.75rem;
  }
  .fav-icon {
    font-size: 0.9rem;
  }
  .question-header {
    margin-bottom: 1rem;
  }
  .image-wrapper {
    margin-bottom: 1rem;
  }
}

.emoji-wrapper {
  font-size: 5rem;
  display: inline-block;
  background: #A3D1E6;
  border: 2px solid #5E4C41;
  border-radius: 20px;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
  box-shadow: inset -3px -3px 0 rgba(0,0,0,0.05);
}

.image-wrapper {
  margin-bottom: 1.5rem;
  min-height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-scenario-wrapper {
  background-color: #FEF9EB;
  background-image: 
    linear-gradient(90deg, transparent 46px, rgba(232, 90, 127, 0.4) 46px, rgba(232, 90, 127, 0.4) 48px, transparent 48px),
    repeating-linear-gradient(transparent, transparent 31px, rgba(163, 209, 230, 0.5) 31px, rgba(163, 209, 230, 0.5) 32px);
  background-size: 100% 100%, 100% 32px;
  background-position: 0 0, 0 8px;
  border: 2px solid #5E4C41;
  border-radius: 4px 16px 16px 4px;
  padding: 1.8rem 1.5rem 1.5rem 4.2rem;
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
  position: relative;
  box-shadow: 4px 4px 0 rgba(94, 76, 65, 0.1);
}

/* 顶部半透明胶带 Washi tape */
.text-scenario-wrapper::before {
  content: '';
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%) rotate(-2deg);
  width: 110px;
  height: 28px;
  background-color: rgba(163, 209, 230, 0.7); /* 淡蓝色胶带 */
  border: 1px dashed rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  box-shadow: 1px 2px 3px rgba(94, 76, 65, 0.1);
  backdrop-filter: blur(1px);
  z-index: 2;
}

.scenario-text {
  font-size: 1.15rem;
  color: #3D312A;
  font-weight: 700;
  line-height: 32px; /* Must securely match background-size */
  margin: 0;
  position: relative;
  top: -2px; /* Micro adjustment to sit text on ruled lines */
}

.loader-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 2rem 0;
}

.loader {
  border: 4px solid rgba(94, 76, 65, 0.1);
  border-top: 4px solid #F8B182;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.cute-shadow {
  filter: drop-shadow(2px 2px 0 #5E4C41);
}

.question-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 16px;
  border: 2px solid #5E4C41;
  object-fit: contain;
  background: white;
  padding: 0.5rem;
}

.question-title {
  font-size: 1.5rem;
  color: #5E4C41;
  font-weight: 900;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.cute-btn {
  background: white;
  border: 2px solid #5E4C41;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  color: #5E4C41;
  font-weight: 800;
  font-size: 1.15rem;
  box-shadow: 0 4px 0 rgba(94, 76, 65, 0.1);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cute-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 rgba(94, 76, 65, 0.15);
  background: #FDF5E6;
}

.cute-btn:not(:disabled):active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(94, 76, 65, 0.1);
}

/* 多巴胺配色与纹理 */
.dopamine-bg-0 {
  background-color: #FFF2F5;
  background-image: 
    radial-gradient(#FFE0E6 20%, transparent 20%), 
    radial-gradient(#FFE0E6 20%, transparent 20%);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}
.option-btn.dopamine-bg-0:not(:disabled):hover { background-color: #FFE0E6; }

.dopamine-bg-1 {
  background-color: #F0F9FF;
  background-image: 
    radial-gradient(#E0F2FE 20%, transparent 20%), 
    radial-gradient(#E0F2FE 20%, transparent 20%);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}
.option-btn.dopamine-bg-1:not(:disabled):hover { background-color: #E0F2FE; }

.dopamine-bg-2 {
  background-color: #FFFBEB;
  background-image: 
    radial-gradient(#FEF3C7 20%, transparent 20%), 
    radial-gradient(#FEF3C7 20%, transparent 20%);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}
.option-btn.dopamine-bg-2:not(:disabled):hover { background-color: #FEF3C7; }

.dopamine-bg-3 {
  background-color: #F5F3FF;
  background-image: 
    radial-gradient(#EDE9FE 20%, transparent 20%), 
    radial-gradient(#EDE9FE 20%, transparent 20%);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}
.option-btn.dopamine-bg-3:not(:disabled):hover { background-color: #EDE9FE; }

/* 带字母选项的前置 ::before */
.option-btn.has-letter {
  position: relative;
  padding-left: 3.8rem;
  justify-content: flex-start;
  text-align: left;
}

.option-btn.has-letter::before {
  content: attr(data-letter);
  position: absolute;
  left: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background: #FFFDF8;
  border: 2px solid #5E4C41;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 900;
  color: #5E4C41;
  box-shadow: 2px 2px 0 rgba(94, 76, 65, 0.1);
}

@media (max-width: 600px) {
  .option-btn.has-letter {
    padding-left: 3.2rem;
  }
  .option-btn.has-letter::before {
    left: 0.8rem;
    width: 26px;
    height: 26px;
    font-size: 0.95rem;
  }
}

.option-image {
  max-height: 50px;
  object-fit: contain;
}

.option-btn.selected {
  background: #FFFDF8 !important;
  border-color: #F8B182;
  color: #D35400;
}

.option-btn.correct {
  background: #E8F5E9 !important;
  border-color: #84AC50;
  color: #2E7D32;
  opacity: 1;
}

.option-btn.wrong {
  background: #FFEBEE !important;
  border-color: #E74C3C;
  color: #C62828;
}

.option-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.feedback-section {
  text-align: center;
  padding-top: 2rem;
  border-top: 2px dashed #D9E3B4;
}

.result-text {
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
  text-shadow: 0 2px 0 rgba(0,0,0,0.1);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.combo-bonus {
  font-size: 1rem;
  color: #F8B182;
  animation: popIn 0.3s;
  background: #FFFDF8;
  padding: 0.2rem 0.5rem;
  border: 1px solid #5E4C41;
  border-radius: 8px;
  white-space: nowrap;
}

.text-success {
  color: #84AC50; /* 绿色 */
}

.text-error {
  color: #E74C3C;
}

.cute-box {
  background: #FDF5E6;
  border: 2px solid #5E4C41;
  padding: 1rem;
  border-radius: 16px;
  color: #8E705B;
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: left;
  line-height: 1.6;
}

.fact-box {
  background: #E8F4F8;
  color: #1A5276;
}

.next-btn {
  width: 100%;
  padding: 1.2rem;
  background: #A3D1E6; /* 天蓝 */
  color: #1A5276;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 2px;
}
.next-btn:hover {
  background: #8FC4DC;
}

.shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

.pop {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
  40%, 60% { transform: translate3d(8px, 0, 0); }
}

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.feedback-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.feedback-enter-from {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
}
</style>
