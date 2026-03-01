<template>
  <div class="abstract-background">
    <!-- 纸张纹理层 -->
    <div class="noise-overlay"></div>

    <div class="shapes-container">
      <!-- 左上角暗橙色 Blob -->
      <svg class="shape blob-tl-orange" viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 L250,0 C270,50 200,100 130,130 C60,160 40,220 0,250 Z" fill="#DE9377" />
      </svg>
      
      <!-- 左上角浅桃色 Blob -->
      <svg class="shape blob-tl-peach" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C50,60 120,100 140,160 C160,220 100,270 50,290 C20,300 0,260 0,240 Z" fill="#F0CCB2" />
      </svg>
      
      <!-- 左下角蓝灰色 Blob -->
      <svg class="shape blob-bl-blue" viewBox="0 0 350 400" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,400 L0,150 C50,130 120,180 150,230 C190,290 280,310 320,370 C340,400 350,400 350,400 Z" fill="#7E9FB6" />
      </svg>

      <!-- 贯穿左侧的细线条 -->
      <svg class="shape line-left" viewBox="0 0 300 800" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,50 C100,80 180,150 120,280 C60,410 200,550 150,680 C130,730 80,780 0,800" fill="none" stroke="#BA9D8F" stroke-width="2" />
      </svg>

      <!-- 右上角土黄色 Blob -->
      <svg class="shape blob-tr-mustard" viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">
        <path d="M300,0 L50,0 C40,40 120,80 160,120 C200,160 220,220 280,240 C290,245 300,220 300,200 Z" fill="#D1BE85" />
      </svg>
      
      <!-- 右侧中部偏下 桃色 和 蓝灰色 叠加 -->
      <svg class="shape blob-rm-peach" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg">
        <path d="M150,0 C100,-10 30,50 10,120 C-10,190 60,240 120,230 C180,220 200,160 200,100 C200,50 180,10 150,0 Z" fill="#EACEB7" />
      </svg>
      
      <svg class="shape blob-rm-blue" viewBox="0 0 150 200" xmlns="http://www.w3.org/2000/svg">
        <!-- 靠右边截断的圆弧 -->
        <path d="M150,20 C100,20 40,60 30,120 C20,170 80,200 150,200 Z" fill="#7E9FB6" />
      </svg>
      
      <!-- 右下角大土黄色 Blob -->
      <svg class="shape blob-br-mustard" viewBox="0 0 400 350" xmlns="http://www.w3.org/2000/svg">
        <path d="M400,350 L400,100 C360,60 280,100 240,150 C180,220 120,260 50,270 C20,275 0,310 0,350 Z" fill="#D1BE85" />
      </svg>

      <!-- 右侧细线条 -->
      <svg class="shape line-right" viewBox="0 0 250 500" xmlns="http://www.w3.org/2000/svg">
        <path d="M250,50 C180,60 80,120 100,220 C120,320 20,380 0,450" fill="none" stroke="#BA9D8F" stroke-width="2" />
      </svg>

    </div>
  </div>
</template>

<script setup lang="ts">
// 纯展示的背景组件，无需复杂逻辑
</script>

<style scoped>
.abstract-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0; /* 改为 0，因为很多父级上下文会导致负 index 的层被隐藏。同时内容层的 z-index 都至少是 1 */
  background-color: #F8F5EF; /* 图片中的纸张底色 */
  overflow: hidden;
  pointer-events: none; /* 确保不阻挡点击 */
}

/* 噪点纹理增加纸张质感 */
.noise-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.25;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
  z-index: 1;
}

.shapes-container {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* 绝对定位形状，响应式尺寸。这里使用相对单位 vh / vw 以便拉伸 */
.shape {
  position: absolute;
}

/* ======= 左侧 ======= */
.blob-tl-orange {
  top: 0;
  left: 0;
  width: 35vmin;
  height: auto;
  min-width: 200px;
}

.blob-tl-peach {
  top: 25%;
  left: -5%;
  width: 25vmin;
  height: auto;
  min-width: 150px;
}

.blob-bl-blue {
  bottom: -5%;
  left: -5%;
  width: 45vmin;
  height: auto;
  min-width: 220px;
}

.line-left {
  top: 15%;
  left: -2%;
  width: 25vmin;
  height: 70vmin;
}

/* ======= 右侧 ======= */
.blob-tr-mustard {
  top: 0;
  right: 0;
  width: 30vmin;
  height: auto;
  min-width: 180px;
}

.blob-rm-peach {
  top: 35%;
  right: 5%;
  width: 18vmin;
  height: auto;
  min-width: 120px;
}

.blob-rm-blue {
  top: 40%;
  right: 0;
  width: 15vmin;
  height: auto;
  min-width: 100px;
}

.blob-br-mustard {
  bottom: -10%;
  right: -5%;
  width: 50vmin;
  height: auto;
  min-width: 250px;
}

.line-right {
  top: 45%;
  right: 0;
  width: 15vmin;
  height: 40vmin;
}

/* 针对很宽或很高的屏幕做一些微调，确保它们分布平滑 */
@media (max-width: 768px) {
  .blob-tr-mustard { width: 40vmin; }
  .blob-tl-orange { width: 45vmin; }
  .blob-bl-blue { width: 55vmin; }
  .blob-br-mustard { width: 60vmin; }
}
</style>
