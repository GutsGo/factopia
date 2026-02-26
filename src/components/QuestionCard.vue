<template>
  <div class="question-card" :class="{ 'shake': animState === 'wrong', 'pop': animState === 'right' }">
    <div class="card-inner">
      <div class="question-header">
        <div class="header-top">
          <!-- 这里使用 emoji 简单实现星形按钮 -->
          <button class="favorite-btn" :class="{ active: isFavorite }" @click="toggleFav" title="收藏/取消收藏">
            {{ isFavorite ? '⭐' : '☆' }}
          </button>
        </div>
        <!-- 兼容 URL 或者 emoji -->
        <div v-if="question.image || !imageLoaded" class="image-wrapper cute-shadow">
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
        <h2 class="question-title">{{ question.prompt }}</h2>
      </div>

      <div class="options-container">
        <template v-if="question.type === 'single_image_to_text' || question.type === 'single_text_to_image'">
          <button
            v-for="(option, index) in question.options"
            :key="index"
            class="option-btn cute-btn"
            :class="{ 
              'selected': selectedOption === option,
              'correct': hasAnswered && option === question.answer,
              'wrong': hasAnswered && selectedOption === option && option !== question.answer
            }"
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

      <transition name="fade">
        <div v-if="hasAnswered" class="feedback-section">
          <div class="result-text" :class="isCorrect ? 'text-success' : 'text-error'">
            {{ isCorrect ? '🎉 回答正确 (+10分)' : '❌ 回答错误 (-3分)' }}
            <span v-if="isCorrect && quizStore.comboCount >= 3" class="combo-bonus">🔥连击 +5</span>
          </div>
          <div v-if="question.explanation" class="explanation cute-box">
            <strong>💡 解析：</strong> {{ question.explanation }}
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
}

.question-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
}

.header-top {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 10;
}

.favorite-btn {
  background: none;
  border: none;
  font-size: 2.2rem;
  cursor: pointer;
  outline: none;
  color: #CFD8DC;
  transition: all 0.2s;
  padding: 5px;
  line-height: 1;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));
}

@media (max-width: 600px) {
  .card-inner {
    padding: 1.5rem;
  }
  .header-top {
    margin-bottom: 0.8rem; /* 移动端间距 */
  }
  .favorite-btn {
    font-size: 1.8rem;
  }
  .question-header {
    margin-bottom: 1rem;
  }
  .image-wrapper {
    margin-bottom: 1rem;
  }
}

.favorite-btn:hover {
  transform: scale(1.1);
}

.favorite-btn:active {
  transform: scale(0.9);
}

.favorite-btn.active {
  color: #F1C40F;
  animation: popIn 0.3s;
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

.option-image {
  max-height: 50px;
  object-fit: contain;
}

.option-btn.selected {
  background: #FFFDF8;
  border-color: #F8B182;
  color: #D35400;
}

.option-btn.correct {
  background: rgba(132, 172, 80, 0.15);
  border-color: #84AC50;
  color: #84AC50;
  opacity: 1;
}

.option-btn.wrong {
  background: rgba(231, 76, 60, 0.1);
  border-color: #E74C3C;
  color: #E74C3C;
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
}

.combo-bonus {
  font-size: 1rem;
  color: #F8B182;
  margin-left: 0.5rem;
  animation: popIn 0.3s;
  background: #FFFDF8;
  padding: 0.2rem 0.5rem;
  border: 1px solid #5E4C41;
  border-radius: 8px;
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
</style>
