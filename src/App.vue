<script setup>
import { useSearchStore } from '@/stores/searchVideo'
import { provide, ref } from 'vue';

const searchStore = useSearchStore()
const naviIsShow = ref(false)
provide('naviIsShow', naviIsShow)
const showNavi = () => {
  naviIsShow.value = !naviIsShow.value
}

// 获取当前路由索引
const getCurrentRouteIndex = () => {
  const routeMap = {
    'search': 0,
    'list': 1,
    'detail': 2,
    'player': 3
  }
  return routeMap[searchStore.currentPathName] || 0
}
</script>

<template>
  <v-app id="inspire">
    <v-app-bar class="custom-app-bar" elevation="0">
      <!-- 左侧区域 -->
      <div class="nav-left">
        <v-btn 
          :to="searchStore.currentPathName === 'search' ? null : '/search'" 
          :disabled="searchStore.currentPathName === 'search'"
          class="nav-back-btn"
          variant="text"
          :color="searchStore.currentPathName === 'search' ? 'grey-lighten-1' : 'primary'"
        >
          <v-icon start>mdi-magnify</v-icon>
          <span class="nav-back-text">返回搜索</span>
        </v-btn>
      </div>

      <!-- 中间标题区域 -->
      <div class="nav-center">
        <h1 class="nav-title" v-if="searchStore.currentPathName === 'search'">弹幕动漫</h1>
        <h1 class="nav-title" v-else-if="searchStore.currentPathName === 'list'">搜索结果</h1>
        <h1 class="nav-title" v-else-if="searchStore.currentPathName === 'detail'">动漫详情</h1>
        <h1 class="nav-title" v-else-if="searchStore.currentPathName === 'player'">视频播放</h1>
      </div>

      <!-- 右侧区域 -->
      <div class="nav-right">
        <v-btn 
          v-if="searchStore.currentPathName === 'list'"
          class="nav-menu-btn"
          variant="text"
          color="primary"
          @click="showNavi"
        >
          <v-icon start>mdi-source-branch</v-icon>
          <span class="nav-menu-text">选择影视</span>
        </v-btn>
        
        <v-btn 
          v-if="searchStore.currentPathName === 'player'"
          class="nav-menu-btn"
          variant="text"
          color="primary"
          @click="showNavi"
        >
          <v-icon start>mdi-tune</v-icon>
          <span class="nav-menu-text">弹幕设置</span>
        </v-btn>
      </div>
    </v-app-bar>

    <router-view :key="$route.fullPath" v-slot="{ Component, route }">
      <v-fade-transition mode="out-in" :duration="400">
        <div class="page-wrapper">
          <component :is="Component" :key="route.path" />
        </div>
      </v-fade-transition>
    </router-view>

    <!-- 底部导航栏 -->
    <v-bottom-navigation 
      class="bottom-nav"
      :model-value="getCurrentRouteIndex()"
      grow
      shift
    >
      <v-btn 
        :value="0"
        :to="'/search'"
        class="nav-item"
        :class="{ 'active': searchStore.currentPathName === 'search' }"
      >
        <v-icon>mdi-magnify</v-icon>
        <span class="nav-label">搜索</span>
      </v-btn>

      <v-btn 
        :value="1"
        :to="'/list'"
        class="nav-item"
        :class="{ 'active': searchStore.currentPathName === 'list' }"
        :disabled="!searchStore.hasSearchResults"
      >
        <v-icon>mdi-format-list-bulleted</v-icon>
        <span class="nav-label">列表</span>
      </v-btn>

      <v-btn 
        :value="2"
        :to="'/detail'"
        class="nav-item"
        :class="{ 'active': searchStore.currentPathName === 'detail' }"
        :disabled="!searchStore.currentVideo"
      >
        <v-icon>mdi-information</v-icon>
        <span class="nav-label">详情</span>
      </v-btn>

      <v-btn 
        :value="3"
        :to="'/player'"
        class="nav-item"
        :class="{ 'active': searchStore.currentPathName === 'player' }"
        :disabled="!searchStore.currentVideo"
      >
        <v-icon>mdi-play</v-icon>
        <span class="nav-label">播放</span>
      </v-btn>
    </v-bottom-navigation>

  </v-app>
</template>

<style>
/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-x: hidden; /* 只隐藏横向滚动条 */
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 181, 246, 0.3) transparent;
}

/* Webkit浏览器滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 181, 246, 0.3);
  border-radius: 4px;
  transition: background 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 181, 246, 0.5);
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden; /* 只隐藏横向滚动条 */
}

.v-application {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden; /* 只隐藏横向滚动条 */
}

.v-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 100px !important; /* 增加底部内边距，确保内容不被遮挡 */
  /* 防止滚动条闪烁 */
  scrollbar-gutter: stable;
}

/* 页面包装器 */
.page-wrapper {
  min-height: 100%;
  width: 100%;
  position: relative;
  /* 防止布局跳动 */
  contain: none;
}
</style>

<style scoped>
/* 导航栏样式 */
.custom-app-bar {
  background: rgba(30, 30, 30, 0.95) !important;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 64px !important;
  display: flex;
  align-items: center;
  padding: 0 16px;
  position: relative;
}

/* 左侧区域 */
.nav-left {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: 0 0 auto;
}

.nav-back-btn {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  border-radius: 8px !important;
  padding: 8px 16px !important;
  transition: all 0.3s ease;
}

.nav-back-btn:hover:not(.v-btn--disabled) {
  background: rgba(100, 181, 246, 0.1) !important;
  transform: translateY(-1px);
}

.nav-back-text {
  font-size: 0.95rem;
  font-weight: 500;
}

/* 中间标题区域 */
.nav-center {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.nav-title {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 300;
  margin: 0;
  letter-spacing: -0.02em;
}

/* 右侧区域 */
.nav-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 0 auto;
  margin-left: auto;
}

.nav-menu-btn {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  border-radius: 8px !important;
  padding: 8px 16px !important;
  transition: all 0.3s ease;
}

.nav-menu-btn:hover {
  background: rgba(100, 181, 246, 0.1) !important;
  transform: translateY(-1px);
}

.nav-menu-text {
  font-size: 0.95rem;
  font-weight: 500;
}

/* 链接样式 */
a {
  text-decoration: none;
  color: inherit;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .nav-title {
    font-size: 1.3rem;
  }
  
  .nav-back-text,
  .nav-menu-text {
    font-size: 0.9rem;
  }
  
  .nav-back-btn,
  .nav-menu-btn {
    padding: 6px 12px !important;
  }
  
  .v-main {
    padding-bottom: 90px !important; /* 平板设备底部内边距 */
  }
}

@media (max-width: 768px) {
  .custom-app-bar {
    height: 56px !important;
  }
  
  .nav-title {
    font-size: 1.2rem;
  }
  
  .nav-back-text,
  .nav-menu-text {
    font-size: 0.85rem;
  }
  
  .nav-back-btn,
  .nav-menu-btn {
    padding: 6px 10px !important;
  }
  
  .nav-back-btn .v-icon,
  .nav-menu-btn .v-icon {
    font-size: 18px !important;
  }
  
  .v-main {
    padding-bottom: 80px !important; /* 移动设备底部内边距 */
  }
}

@media (max-width: 480px) {
  .nav-title {
    font-size: 1.1rem;
  }
  
  .nav-back-text,
  .nav-menu-text {
    font-size: 0.8rem;
  }
  
  .nav-back-btn,
  .nav-menu-btn {
    padding: 4px 8px !important;
  }
  
  .nav-back-btn .v-icon,
  .nav-menu-btn .v-icon {
    font-size: 16px !important;
  }
  
  .v-main {
    padding-bottom: 70px !important; /* 小屏幕设备底部内边距 */
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  .nav-title {
    font-size: 1rem;
  }
  
  .nav-back-text,
  .nav-menu-text {
    font-size: 0.75rem;
  }
  
  .nav-back-btn,
  .nav-menu-btn {
    padding: 4px 6px !important;
  }
  
  .v-main {
    padding-bottom: 60px !important; /* 超小屏幕设备底部内边距 */
  }
}

/* 禁用状态样式 */
.nav-back-btn.v-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-back-btn.v-btn--disabled:hover {
  background: transparent !important;
  transform: none !important;
}

/* 底部导航栏样式 */
.bottom-nav {
  background: rgba(30, 30, 30, 0.95) !important;
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  height: 64px !important;
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
}

.nav-item {
  color: #b0b0b0 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px !important;
  margin: 0 4px;
  min-width: 60px;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(100, 181, 246, 0.2), transparent);
  transition: left 0.5s ease;
}

.nav-item:hover::before {
  left: 100%;
}

.nav-item:hover {
  background: rgba(100, 181, 246, 0.1) !important;
  color: #64b5f6 !important;
}

.nav-item.active {
  color: #64b5f6 !important;
  background: rgba(100, 181, 246, 0.1) !important;
}

.nav-item.v-btn--disabled {
  color: #666666 !important;
  opacity: 0.5;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 2px;
}

/* 底部导航栏响应式设计 */
@media (max-width: 768px) {
  .bottom-nav {
    height: 56px !important;
  }
  
  .nav-item {
    min-width: 50px;
    margin: 0 2px;
  }
  
  .nav-label {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .bottom-nav {
    height: 52px !important;
  }
  
  .nav-item {
    min-width: 45px;
    margin: 0 1px;
  }
  
  .nav-label {
    font-size: 0.65rem;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  .bottom-nav {
    height: 48px !important;
  }
  
  .nav-item {
    min-width: 40px;
  }
  
  .nav-label {
    font-size: 0.6rem;
  }
}
</style>