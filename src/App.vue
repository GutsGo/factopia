<script setup lang="ts">
// 这里可以处理一些全局应用级别的挂载逻辑，如 PWA 注册提醒
import { onMounted } from "vue";
import AbstractBackground from "@/components/AbstractBackground.vue";

onMounted(() => {
  // 生产环境可以加上 PWA 的更新提示
});
</script>

<template>
  <!-- 全局抽象图案背景 -->
  <AbstractBackground />

  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
</template>

<style>
/* 全局基础样式 */
html, body {
  margin: 0;
  padding: 0;
  background-color: #F8F5EF; /* 与 AbstractBackground 颜色一致 */
  min-height: 100vh;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
