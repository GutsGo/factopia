<script setup lang="ts">
// 这里可以处理一些全局应用级别的挂载逻辑，如 PWA 注册提醒
import { onMounted } from "vue";

onMounted(() => {
  // 生产环境可以加上 PWA 的更新提示
});
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
