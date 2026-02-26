import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: 'Factopia - 有趣的常识学习' },
  },
  {
    path: '/levels/:category',
    name: 'Levels',
    component: () => import('@/views/Levels.vue'),
    meta: { title: 'Factopia - 关卡选择' },
  },
  {
    path: '/game/:category/:level',
    name: 'Game',
    component: () => import('@/views/Game.vue'),
    props: true,
  },
  {
    path: '/mistakes',
    name: 'Mistakes',
    component: () => import('@/views/Mistakes.vue'),
    meta: { title: 'Factopia - 错题本' },
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/Favorites.vue'),
    meta: { title: 'Factopia - 收藏夹' },
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/Statistics.vue'),
    meta: { title: 'Factopia - 统计中心' },
  },
  {
    path: '/group/:id',
    name: 'CategoryGroup',
    component: () => import('@/views/CategoryGroup.vue'),
    meta: { title: 'Factopia - 分类大全' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from) => {
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
});

export default router;
