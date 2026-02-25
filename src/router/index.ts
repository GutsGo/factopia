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
