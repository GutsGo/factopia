<template>
  <div class="question-card" :class="{ 'shake': animState === 'wrong', 'pop': animState === 'right' }">
    <div class="card-inner">
      <div class="card-actions">
        <button class="fav-btn" :class="{ active: isFavorite }" @click="toggleFav">
          <span class="fav-icon">{{ isFavorite ? '⭐' : '☆' }}</span>
          <span class="fav-text">{{ isFavorite ? '已收藏' : '收藏' }}</span>
        </button>
      </div>

      <div class="question-header">
        <div v-if="question.type === 'text'" class="text-scenario">
          <p class="scenario-text">{{ question.text || question.prompt }}</p>
        </div>
        <div v-else-if="question.image || !imageLoaded" class="image-wrapper">
          <div v-if="!imageLoaded" class="loader-box"><div class="loader"></div></div>
          <template v-if="question.image">
            <template v-if="isUrl(question.image)">
              <img v-show="imageLoaded" :src="resolveImageUrl(question.image)" :key="question.id" :alt="question.prompt" class="q-image" @load="onImageLoad" @error="onImageLoad" />
            </template>
            <template v-else>
              <div v-if="imageLoaded" class="emoji-box">{{ question.image }}</div>
            </template>
          </template>
        </div>
        <h2 class="q-title" v-if="question.type !== 'text'">{{ question.prompt }}</h2>
      </div>

      <div class="options">
        <template v-if="question.type === 'single_image_to_text' || question.type === 'single_text_to_image' || question.type === 'text'">
          <button v-for="(option, index) in question.options" :key="index"
            class="opt-btn" :class="[`opt-color-${index % 4}`, { selected: selectedOption === option, correct: hasAnswered && option === question.answer, wrong: hasAnswered && selectedOption === option && option !== question.answer }]"
            :data-letter="String.fromCharCode(65 + index)" :disabled="hasAnswered" @click="selectOption(option)">
            <template v-if="isUrl(option)"><img :src="resolveImageUrl(option)" class="opt-img" /></template>
            <template v-else>{{ option }}</template>
          </button>
        </template>
        <template v-else-if="question.type === 'true_false_image'">
          <button class="opt-btn opt-color-0" :class="{ selected: selectedOption === true, correct: hasAnswered && question.answer === true, wrong: hasAnswered && selectedOption === true && question.answer !== true }" :disabled="hasAnswered" @click="selectOption(true)">正确</button>
          <button class="opt-btn opt-color-1" :class="{ selected: selectedOption === false, correct: hasAnswered && question.answer === false, wrong: hasAnswered && selectedOption === false && question.answer !== false }" :disabled="hasAnswered" @click="selectOption(false)">错误</button>
        </template>
      </div>

      <transition name="feedback">
        <div v-if="hasAnswered" class="feedback">
          <div class="result-text" :class="isCorrect ? 'text-ok' : 'text-fail'">
            <span>{{ isCorrect ? '🎉 回答正确 (+10分)' : '❌ 回答错误 (-3分)' }}</span>
            <span v-if="isCorrect && quizStore.comboCount >= 3" class="combo">🔥连击 +5</span>
          </div>
          <div v-if="question.explanation" class="explain-box">💡 <strong>解析：</strong>{{ question.explanation }}</div>
          <div v-if="question.fact" class="explain-box fact-box">💡 <strong>科普：</strong>{{ question.fact }}</div>
          <button class="next-btn" @click="emitNext">下一题 ➔</button>
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

const props = defineProps<{ question: Question; categoryId: string }>()
const emit = defineEmits<{ (e: 'answer', isCorrect: boolean): void; (e: 'next'): void }>()
const quizStore = useQuizStore()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()
const hasAnswered = ref(false)
const selectedOption = ref<any>(null)
const isCorrect = ref(false)
const animState = ref<'idle' | 'right' | 'wrong'>('idle')
const imageLoaded = ref(false)
const isFavorite = computed(() => progressStore.isFavorite(props.categoryId, String(props.question.id)))

function onImageLoad() { imageLoaded.value = true }
function toggleFav() { progressStore.toggleFavorite(props.categoryId, String(props.question.id)) }

watch(() => props.question.id, () => {
  hasAnswered.value = false; selectedOption.value = null; isCorrect.value = false; animState.value = 'idle'
  imageLoaded.value = !(props.question.image && isUrl(props.question.image))
}, { immediate: true })

function selectOption(option: any) {
  if (hasAnswered.value) return
  selectedOption.value = option; hasAnswered.value = true; isCorrect.value = option === props.question.answer
  animState.value = isCorrect.value ? 'right' : 'wrong'
  settingsStore.playSound(isCorrect.value ? 'right' : 'wrong')
  setTimeout(() => { animState.value = 'idle' }, 500)
  emit('answer', isCorrect.value)
  setTimeout(() => { document.querySelector('.next-btn')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, 100)
}

function emitNext() { imageLoaded.value = false; emit('next'); window.scrollTo({ top: 0, behavior: 'instant' }) }
</script>

<style scoped lang="less">
.question-card {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-md);
  padding: 5px;
  box-shadow: var(--theme-shadow-card);
  position: relative;

  .card-inner {
    border: var(--theme-border-width-xs) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    padding: 2rem;
    background: var(--theme-card-inner);
    position: relative;

    @media (max-width: 600px) {
      padding: 1.2rem;
      padding-top: 2.8rem;
    }
  }
}

.question-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.card-actions {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  z-index: 10;

  @media (max-width: 600px) {
    top: 0.5rem;
    right: 0.5rem;
  }
}

.fav-btn {
  background: var(--theme-card-bg);
  border: var(--theme-border-width-xs) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  font-size: 0.8rem;
  color: var(--theme-text-light);
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--theme-shadow-btn);
  transition: transform 0.15s;

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }
  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-btn-active);
  }
  &.active {
    background: var(--theme-fav-active-bg);
    color: #D35400;
    border-color: var(--theme-fav-active-border);
  }

  .fav-icon {
    font-size: 1rem;
  }
}

.emoji-box {
  font-size: 4rem;
  display: inline-block;
  background: var(--theme-info);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
  box-shadow: var(--theme-shadow-btn);
}

.image-wrapper {
  margin-bottom: 1.2rem;
  min-height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-scenario {
  background: var(--theme-scenario-bg);
  background-image:
    linear-gradient(90deg, transparent 44px, var(--theme-scenario-margin-color) 44px, var(--theme-scenario-margin-color) 46px, transparent 46px),
    repeating-linear-gradient(transparent, transparent 29px, var(--theme-scenario-line-color) 29px, var(--theme-scenario-line-color) 30px);
  background-size: 100% 100%, 100% 30px;
  background-position: 0 0, 0 8px;
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: 4px 12px 12px 4px;
  padding: 1.5rem 1.2rem 1.2rem 3.5rem;
  margin: 1rem 0 1.5rem;
  text-align: left;
  position: relative;
  box-shadow: var(--theme-shadow-btn);

  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%) rotate(-2deg);
    width: 90px;
    height: 22px;
    background: var(--theme-scenario-tape-bg);
    border: 1px dashed rgba(255,255,255,0.5);
    border-radius: 2px;
    box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.08);
  }

  .scenario-text {
    font-size: 1.05rem;
    color: var(--theme-text-main);
    font-weight: 700;
    line-height: 30px;
    margin: 0;
  }
}

.loader-box {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 1.5rem 0;

  .loader {
    border: 4px solid rgba(94, 76, 65, 0.1);
    border-top: 4px solid var(--theme-accent);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }

.q-image {
  max-width: 100%;
  max-height: 200px;
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  object-fit: contain;
  background: white;
  padding: 4px;
  box-shadow: var(--theme-shadow-inner);
}

.q-title {
  font-size: 1.3rem;
  color: var(--theme-text-secondary);
  font-weight: 800;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-bottom: 1.5rem;
}

.opt-btn {
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  padding: 0.8rem 1rem 0.8rem 3rem;
  color: var(--theme-text-secondary);
  font-weight: 800;
  font-size: 1.05rem;
  box-shadow: var(--theme-shadow-btn);
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: pointer;
  display: flex;
  align-items: center;
  text-align: left;
  position: relative;
  line-height: 1.5;

  &:not(:disabled) {
    &:hover {
      transform: var(--theme-hover-transform);
      box-shadow: var(--theme-shadow-btn-hover);
    }
    &:active {
      transform: var(--theme-active-transform);
      box-shadow: var(--theme-shadow-btn-active);
    }
  }

  &::before {
    content: attr(data-letter);
    position: absolute;
    left: 0.7rem;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    background: var(--theme-card-bg);
    border: var(--theme-border-width-xs) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 900;
    color: var(--theme-text-secondary);
    box-shadow: var(--theme-shadow-btn);
  }

  // 颜色变体生成
  .generate-opt-color(@i) {
    &.opt-color-@{i} {
      @color: "theme-opt-@{i}";
      @hover: "theme-opt-@{i}-hover";
      @bar: "theme-opt-@{i}-bar";
      @dot: "theme-opt-@{i}-dot";

      background-color: var(~"--@{color}");
      border-left: var(--theme-opt-bar-width) solid var(~"--@{bar}");
      background-image:
        radial-gradient(var(~"--@{dot}", transparent) 20%, transparent 20%),
        radial-gradient(var(~"--@{dot}", transparent) 20%, transparent 20%);
      background-size: var(--theme-opt-bg-size);
      background-position: var(--theme-opt-bg-position);

      &:not(:disabled):hover {
        background-color: var(~"--@{hover}");
      }
    }
  }

  .generate-opt-color(0);
  .generate-opt-color(1);
  .generate-opt-color(2);
  .generate-opt-color(3);

  &.selected {
    background: var(--theme-card-bg) !important;
    border-color: var(--theme-accent);
    color: #D35400;
  }

  &.correct {
    background: var(--theme-correct-bg) !important;
    border-color: var(--theme-correct-border);
    color: #2E7D32;
    opacity: 1;
  }

  &.wrong {
    background: var(--theme-wrong-bg) !important;
    border-color: var(--theme-wrong-border);
    color: #C62828;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.opt-img {
  max-height: 50px;
  object-fit: contain;
}

.feedback {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 3px dashed var(--theme-border-color);

  .result-text {
    font-size: 1.3rem;
    font-weight: 800;
    margin-bottom: 0.8rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0.4rem;

    &.text-ok { color: var(--theme-success); }
    &.text-fail { color: var(--theme-error); }
  }

  .combo {
    font-size: 0.9rem;
    color: var(--theme-accent);
    animation: popIn 0.3s;
    background: var(--theme-card-bg);
    padding: 2px 8px;
    border: var(--theme-border-width-xs) solid var(--theme-border-color);
    border-radius: var(--theme-radius-sm);
  }
}

.explain-box {
  background: var(--theme-card-bg);
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  padding: 0.8rem;
  color: var(--theme-text-light);
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-align: left;
  line-height: 1.7;
  box-shadow: var(--theme-shadow-inner);

  &.fact-box {
    background: var(--theme-fact-bg);
    color: var(--theme-fact-color);
  }
}

.next-btn {
  width: 100%;
  padding: 0.9rem;
  background: var(--theme-btn-primary-bg);
  color: var(--theme-fact-color);
  font-size: 1.15rem;
  font-weight: 900;
  border: var(--theme-border-width) solid var(--theme-border-color);
  border-radius: var(--theme-radius-sm);
  box-shadow: var(--theme-shadow-btn);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: var(--theme-hover-transform);
    box-shadow: var(--theme-shadow-btn-hover);
  }
  &:active {
    transform: var(--theme-active-transform);
    box-shadow: var(--theme-shadow-btn-active);
  }
}

.shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
.pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }

@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
  40%, 60% { transform: translate3d(6px, 0, 0); }
}

@keyframes popIn {
  0% { transform: scale(.8); opacity: 0; }
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
