<script setup>
import { ref, watch } from 'vue'
import { useSearchStore } from '@/stores/searchVideo'

const searchStore = useSearchStore()
searchStore.setPathName('search')

const searchValue = ref('')
const loaded = ref(false)
const loading = ref(false)

// 监听错误信息，清除旧的错误
watch(() => searchValue.value, () => {
  if (searchStore.error) {
    searchStore.error = ''
  }
})

async function onClick() {
  // 判断搜索关键词是否为空，否则弹出提示
  if (searchValue.value === '') {
    alert('请输入搜索关键词')
    return
  }

  loading.value = true
  loaded.value = false
  
  try {
    await searchStore.searchAllWebsites(searchValue.value)
    // 只有在成功跳转时（有结果）才设置loaded为true
    loaded.value = searchStore.hasSearchResults
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-main class="search-main">
    <v-container fluid class="search-container" >
      <v-row justify="center" align="center" class="min-vh-100">
        <v-col cols="12" sm="10" md="8" lg="6" xl="5">
          <div class="search-wrapper">
            <!-- 标题 -->
            <div class="text-center mb-8">
              <h1 class="search-title">动漫搜索</h1>
              <p class="search-subtitle">发现精彩内容</p>
            </div>
            
            <!-- 搜索框 -->
            <v-card class="search-card" elevation="8">
              <v-card-text class="pa-6">
                <v-text-field 
                  :loading="loading" 
                  append-inner-icon="mdi-magnify" 
                  density="comfortable" 
                  label="搜索影视内容"
                  variant="outlined"
                  :error-messages="searchStore.error"
                  single-line
                  class="search-field"
                  @click:append-inner="onClick" 
                  @keyup.enter="onClick"
                  v-model="searchValue"
                ></v-text-field>
              </v-card-text>
            </v-card>
            
            <!-- 使用说明按钮 -->
            <div class="text-center mt-12">
              <v-btn 
                variant="text" 
                color="grey-lighten-1" 
                class="text-none"
                href="https://github.com/hhddd123/danmaku_bangumi"
                target="_blank"
              >
                使用说明
                <v-icon end>mdi-open-in-new</v-icon>
              </v-btn>
            </div>
            
            <!-- 底部信息 -->
            <div class="footer-info">
              <div class="text-center">
                <!-- 弹幕API来源 -->
                <div class="footer-item mb-2">
                  <span class="footer-text">弹幕API由</span>
                  <a 
                    href="https://www.dandanplay.com/" 
                    target="_blank" 
                    class="footer-link"
                  >
                    DanDanPlay
                  </a>
                  <span class="footer-text">提供</span>
                </div>
                
                <!-- 免责声明 -->
                <div class="footer-item mb-2">
                  <p class="disclaimer-text">
                    本站仅提供搜索服务，所有视频内容均来源于第三方网站，本站不对其内容负责。
                    请用户在使用时遵守相关法律法规，尊重版权。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<style scoped>
.search-main {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: calc(100vh - 64px); /* 减去顶部导航栏高度 */
  animation: pageEnter 0.6s ease-out;
  /* 防止布局跳动 */
  contain: none;
  overflow-x: hidden; /* 只隐藏横向滚动 */
}

/* 页面进入动画 */
@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-container {
  padding: 0;
}

.search-wrapper {
  padding: 2rem 1rem;
}

.search-title {
  font-size: 3rem;
  font-weight: 300;
  color: #ffffff;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.search-subtitle {
  font-size: 1.1rem;
  color: #b0b0b0;
  font-weight: 300;
  margin: 0;
}

.search-card {
  background: rgba(45, 45, 45, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px !important;
  animation: cardEnter 0.8s ease-out 0.2s both;
}

/* 卡片进入动画 */
@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.search-field :deep(.v-field) {
  background: rgba(60, 60, 60, 0.6) !important;
  border-radius: 12px !important;
}

.search-field :deep(.v-field__input) {
  color: #ffffff !important;
  font-size: 1.1rem;
}

.search-field :deep(.v-label) {
  color: #a0a0a0 !important;
}

.search-field :deep(.v-field__outline) {
  color: rgba(255, 255, 255, 0.2) !important;
}

.search-field :deep(.v-field--focused .v-field__outline) {
  color: #64b5f6 !important;
}

.search-field :deep(.v-icon) {
  color: #a0a0a0 !important;
}

.search-field :deep(.v-field--focused .v-icon) {
  color: #64b5f6 !important;
}

/* 功能卡片样式 */
.feature-card {
  background: rgba(45, 45, 45, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  animation: featureCardEnter 0.8s ease-out 0.4s both;
}

/* 功能卡片进入动画 */
@keyframes featureCardEnter {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-title {
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.feature-desc {
  color: #b0b0b0;
  font-size: 0.9rem;
  margin-bottom: 0;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .search-main {
    min-height: calc(100vh - 56px); /* 平板设备导航栏高度 */
  }
  
  .search-wrapper {
    padding: 1.5rem 1rem;
  }
  
  .search-title {
    font-size: 2.5rem;
  }
  
  .v-main {
    padding-bottom: 90px !important; /* 平板设备底部内边距 */
  }
}

@media (max-width: 768px) {
  .search-main {
    min-height: calc(100vh - 56px); /* 移动设备导航栏高度 */
  }
  
  .search-title {
    font-size: 2.2rem;
  }
  
  .search-subtitle {
    font-size: 1rem;
  }
  
  .search-wrapper {
    padding: 1rem 0.5rem;
  }
  
  .search-card {
    margin: 0 0.5rem;
  }
  
  .search-field :deep(.v-field__input) {
    font-size: 1rem;
  }
  
  .v-main {
    padding-bottom: 80px !important; /* 移动设备底部内边距 */
  }
}

@media (max-width: 480px) {
  .search-main {
    min-height: calc(100vh - 52px); /* 小屏幕设备导航栏高度 */
  }
  
  .search-title {
    font-size: 1.8rem;
  }
  
  .search-subtitle {
    font-size: 0.9rem;
  }
  
  .search-wrapper {
    padding: 0.75rem 0.25rem;
  }
  
  .search-card {
    margin: 0 0.25rem;
  }
  
  .search-field :deep(.v-field__input) {
    font-size: 0.9rem;
  }
  
  .search-field :deep(.v-label) {
    font-size: 0.9rem;
  }
  
  .v-main {
    padding-bottom: 70px !important; /* 小屏幕设备底部内边距 */
  }
}

/* 底部信息样式 */
.footer-info {
  margin-top: 10rem; /* 减少到8rem，确保有足够空间滚动 */
  animation: footerEnter 0.8s ease-out 0.6s both;
}

@keyframes footerEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.footer-item {
  margin-bottom: 0.5rem;
}

.footer-link {
  color: #64b5f6 !important;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #90caf9 !important;
  text-decoration: underline;
}

.footer-text {
  color: #b0b0b0;
  font-size: 0.9rem;
}

.disclaimer-text {
  color: #a0a0a0;
  font-size: 0.8rem;
  line-height: 1.5;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  .search-main {
    min-height: calc(100vh - 48px); /* 超小屏幕设备导航栏高度 */
  }
  
  .search-title {
    font-size: 1.6rem;
  }
  
  .search-subtitle {
    font-size: 0.85rem;
  }
  
  .search-wrapper {
    padding: 0.5rem 0.125rem;
  }
  
  .search-card {
    margin: 0 0.125rem;
  }
  
  .footer-link,
  .footer-text {
    font-size: 0.8rem;
  }
  
  .disclaimer-text {
    font-size: 0.75rem;
    padding: 0 0.5rem;
  }
  
  .v-main {
    padding-bottom: 60px !important; /* 超小屏幕设备底部内边距 */
  }
}
</style>