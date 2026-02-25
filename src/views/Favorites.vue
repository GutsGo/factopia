<template>
  <div class="favorites-container">
    <header class="page-header">
      <button class="back-btn cute-btn" @click="goBack">← 返回首页</button>
      <h2>⭐ 收藏夹</h2>
    </header>

    <main class="favorites-content cute-card">
      <div v-if="loading" class="state-view">
        <div class="loader"></div>
        <p>正在拉取你心爱的题目...</p>
      </div>

      <div v-else-if="favoritesWithDetails.length === 0" class="state-view empty">
        <div class="emoji-wrapper">📭</div>
        <h3>这里空空的~</h3>
        <p>遇到有趣的题目，记得在答题时点击右上角的星星收藏哦！</p>
        <button class="cute-btn primary-btn mt-4" @click="goBack">去答题</button>
      </div>

      <div v-else class="favorites-list">
        <div v-for="item in favoritesWithDetails" :key="item.categoryId + '_' + item.questionId" class="favorite-item cute-card-inner">
          <div class="f-header">
            <span class="category-badge">{{ getCategoryName(item.categoryId) }}</span>
            <button class="cute-btn small-btn outline" @click="removeFavorite(item.categoryId, item.questionId)">取消收藏</button>
          </div>
          
          <div class="f-title">{{ item.question?.prompt || '题目加载失败' }}</div>
          
          <div class="f-image-container" v-if="item.question?.image">
            <template v-if="isUrl(item.question.image)">
              <img :src="item.question.image" :alt="item.question.prompt" class="f-image" />
            </template>
            <template v-else>
              <div class="f-emoji">{{ item.question.image }}</div>
            </template>
          </div>

          <div class="f-answer" v-if="item.question">正确答案: <span>{{ formatAnswer(item.question) }}</span></div>
          <div class="f-explain" v-if="item.question?.explanation">{{ item.question.explanation }}</div>
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
import type { Question, CategoryData, MistakeRecord } from '@/types/question'

const router = useRouter()
const progressStore = useProgressStore()

const loading = ref(true)
const rawFavorites = ref<MistakeRecord[]>([])
const categories = ref<CategoryData[]>([])

interface FavoriteDetail extends MistakeRecord {
  question?: Question
}
const favoritesWithDetails = ref<FavoriteDetail[]>([])

function goBack() {
  router.push('/')
}

function isUrl(str: string) {
  return typeof str === 'string' && (str.startsWith('http') || str.startsWith('/'))
}

function formatAnswer(q: Question) {
  if (q.type === 'true_false_image') return q.answer ? '正确' : '错误'
  if (isUrl(String(q.answer))) return '（见图片选项）'
  return String(q.answer)
}

function getCategoryName(id: string) {
  return categories.value.find(c => c.id === id)?.name || id
}

async function loadFavorites() {
  loading.value = true
  try {
    categories.value = await fetchCategories()
    rawFavorites.value = progressStore.favorites

    const list: FavoriteDetail[] = []
    const categoryGroups = new Map<string, string[]>()
    
    rawFavorites.value.forEach(f => {
      if (!categoryGroups.has(f.categoryId)) {
        categoryGroups.set(f.categoryId, [])
      }
      categoryGroups.get(f.categoryId)!.push(String(f.questionId))
    })

    for (const [catId, qIds] of categoryGroups.entries()) {
      try {
        const res = await fetch(`/data/questions/${catId}.json`)
        if (res.ok) {
           const allQs: Question[] = await res.json()
           qIds.forEach(targetQid => {
             const matched = allQs.find(q => String(q.id) === targetQid)
             if (matched) {
               const record = rawFavorites.value.find(r => r.categoryId === catId && String(r.questionId) === targetQid)
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
    favoritesWithDetails.value = list.sort((a, b) => b.timestamp - a.timestamp)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function removeFavorite(categoryId: string, questionId: string) {
  progressStore.toggleFavorite(categoryId, questionId)
  favoritesWithDetails.value = favoritesWithDetails.value.filter(
    f => !(f.categoryId === categoryId && String(f.questionId) === questionId)
  )
}

onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.favorites-container {
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

.primary-btn {
  background: #A3D1E6;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
}

.small-btn {
  padding: 0.3rem 0.8rem;
  font-size: 0.9rem;
}

.small-btn.outline {
  background: white;
  color: #E74C3C;
  border-color: #E74C3C;
}
.small-btn.outline:hover {
  background: #FDF5E6;
  box-shadow: 0 4px 0 rgba(231, 76, 60, 0.15);
}

.mt-4 {
  margin-top: 1.5rem;
}

.cute-card {
  background: white;
  border: 2px solid #5E4C41;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 0 rgba(94, 76, 65, 0.08);
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.favorite-item {
  background: #FFFDF8;
  border: 2px solid #5E4C41;
  border-radius: 16px;
  padding: 1.5rem;
  text-align: left;
}

.f-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 2px dashed #D9E3B4;
}

.category-badge {
  background: #F8B182;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.9rem;
  border: 1px solid #5C5552;
}

.f-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #5E4C41;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.f-image-container {
  margin-bottom: 1rem;
  text-align: center;
}

.f-image {
  max-width: 100%;
  max-height: 150px;
  border-radius: 12px;
  border: 2px solid #5E4C41;
}

.f-emoji {
  font-size: 4rem;
  display: inline-block;
  background: #FDF5E6;
  padding: 1rem;
  border-radius: 16px;
  border: 2px solid #5E4C41;
}

.f-answer {
  color: #F8B182;
  font-weight: 800;
  margin-bottom: 0.8rem;
}

.f-answer span {
  background: white;
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  border: 1px solid #F8B182;
  color: #5E4C41;
}

.f-explain {
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
