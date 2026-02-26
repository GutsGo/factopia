<template>
  <div class="mistakes-container">
    <header class="page-header">
      <button class="back-btn cute-btn" @click="goBack">← 返回首页</button>
      <h2>📖 错题本</h2>
    </header>

    <main class="mistakes-content cute-card">
      <div v-if="loading" class="state-view">
        <div class="loader"></div>
        <p>正在加载错题本...</p>
      </div>

      <div v-else-if="mistakesWithDetails.length === 0" class="state-view empty">
        <div class="emoji-wrapper">🎉</div>
        <h3>太棒了！</h3>
        <p>你的错题本空空如也，继续保持哦！</p>
      </div>

      <div v-else class="mistakes-list">
        <div v-for="item in mistakesWithDetails" :key="item.categoryId + '_' + item.questionId" class="mistake-item cute-card-inner">
          <div class="m-header">
            <span class="category-badge">{{ getCategoryName(item.categoryId) }}</span>
            <button class="cute-btn small-btn" @click="markAsMastered(item.categoryId, item.questionId)">已掌握 ✓</button>
          </div>
          <div class="m-title">{{ item.question?.prompt || '题目加载失败' }}</div>
          
          <div class="m-image-container" v-if="item.question?.image">
            <template v-if="isUrl(item.question.image)">
              <img :src="resolveImageUrl(item.question.image)" :alt="item.question.prompt" class="m-image" />
            </template>
            <template v-else>
              <div class="m-emoji">{{ item.question.image }}</div>
            </template>
          </div>

          <div class="m-answer" v-if="item.question">正确答案: <span>{{ formatAnswer(item.question) }}</span></div>
          <div class="m-explain" v-if="item.question?.explanation">{{ item.question.explanation }}</div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/useProgressStore'
import { fetchCategories } from '@/data/questions'
import { resolveImageUrl, resolveDataUrl, isUrl } from '@/utils/assets'
import type { Question, CategoryData, MistakeRecord } from '@/types/question'

const router = useRouter()
const progressStore = useProgressStore()

const loading = ref(true)
const rawMistakes = ref<MistakeRecord[]>([])
const categories = ref<CategoryData[]>([])

// 合并详情后的错题数据结构
interface MistakeDetail extends MistakeRecord {
  question?: Question
}
const mistakesWithDetails = ref<MistakeDetail[]>([])

function goBack() {
  router.push('/')
}



function formatAnswer(q: Question) {
  if (q.type === 'true_false_image') return q.answer ? '正确' : '错误'
  if (isUrl(String(q.answer))) return '（见图片选项）'
  return String(q.answer)
}

function getCategoryName(id: string) {
  return categories.value.find(c => c.id === id)?.name || id
}

async function loadMistakes() {
  loading.value = true
  try {
    categories.value = await fetchCategories()
    rawMistakes.value = progressStore.mistakeBook

    // 批量按类别加载题目详情
    const list: MistakeDetail[] = []
    
    // 按类别分组以减少读取次数
    const categoryGroups = new Map<string, string[]>()
    rawMistakes.value.forEach(m => {
      if (!categoryGroups.has(m.categoryId)) {
        categoryGroups.set(m.categoryId, [])
      }
      categoryGroups.get(m.categoryId)!.push(String(m.questionId))
    })

    for (const [catId, qIds] of categoryGroups.entries()) {
      const cat = categories.value.find(c => c.id === catId)
      if (!cat) continue
      
      // 简单起见，从该类别的随处（通常由于文件结构，我们需要读取 category 对应的 questions 数据）
      // 这里重用现有的 fetchQuestionsByLevel 方法，只要读取了类别任何一个 level 即可得到该类别的总题库或特定 level 的
      // 但是因为结构可能分为了不同的 json。我们需要修改 data/questions 下的方法 或者在这里逐个尝试。
      // 当前的 fetchQuestionsByLevel `id: string` 代表的是 category 文件名。我们改写为一个粗略的整体读取。
      
      try {
        // 由于当前的 fetchQuestionsByLevel 只需要 category 名字就能加载出那个 json 的全体内容再过滤
        // 我们可以借用它，传入一个假的 level 比如全取或者直接拉取 json
        const res = await fetch(resolveDataUrl(`/data/questions/${catId}.json`))
        if (res.ok) {
           const allQs: Question[] = await res.json()
           qIds.forEach(targetQid => {
             const matched = allQs.find(q => String(q.id) === targetQid)
             if (matched) {
               const record = rawMistakes.value.find(r => r.categoryId === catId && String(r.questionId) === targetQid)
               if (record) {
                 list.push({ ...record, question: matched })
               }
             }
           })
        }
      } catch (e) {
        console.error(`Failed to load ${catId}`, e)
      }
    }
    
    // 按照时间戳倒序
    mistakesWithDetails.value = list.sort((a, b) => b.timestamp - a.timestamp)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function markAsMastered(categoryId: string, questionId: string) {
  progressStore.removeMistake(categoryId, questionId)
  mistakesWithDetails.value = mistakesWithDetails.value.filter(
    m => !(m.categoryId === categoryId && String(m.questionId) === questionId)
  )
}

onMounted(() => {
  loadMistakes()
})
</script>

<style scoped>
.mistakes-container {
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

.small-btn {
  padding: 0.3rem 0.8rem;
  font-size: 0.9rem;
  background: #D9E3B4;
}

.cute-card {
  background: white;
  border: 2px solid #5E4C41;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 0 rgba(94, 76, 65, 0.08);
}

/* 列表样式 */
.mistakes-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.mistake-item {
  background: #FFFDF8;
  border: 2px solid #5E4C41;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: left;
}

.m-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 2px dashed #D9E3B4;
}

.category-badge {
  background: #A3D1E6;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.9rem;
  border: 1px solid #5C5552;
}

.m-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #5E4C41;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.m-image-container {
  margin-bottom: 1rem;
  text-align: center;
}

.m-image {
  max-width: 100%;
  max-height: 150px;
  border-radius: 12px;
  border: 2px solid #5E4C41;
}

.m-emoji {
  font-size: 4rem;
  display: inline-block;
  background: #FDF5E6;
  padding: 1rem;
  border-radius: 16px;
  border: 2px solid #5E4C41;
}

.m-answer {
  color: #A3D1E6;
  font-weight: 800;
  margin-bottom: 0.8rem;
}

.m-answer span {
  background: white;
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  border: 1px solid #A3D1E6;
  color: #5E4C41;
}

.m-explain {
  font-size: 0.95rem;
  color: #8E705B;
  line-height: 1.6;
  background: #FDF5E6;
  padding: 1rem;
  border-radius: 10px;
}

.state-view {
  text-align: center;
  padding: 3rem 0;
  color: #8E705B;
  font-weight: bold;
}

.empty h3 {
  font-size: 1.8rem;
  color: #5E4C41;
  margin-bottom: 0.5rem;
}

.empty .emoji-wrapper {
  font-size: 4rem;
  margin-bottom: 1rem;
}

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
