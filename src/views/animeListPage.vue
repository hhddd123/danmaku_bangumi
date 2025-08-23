<script setup>
import { inject, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/searchVideo'

const searchStore = useSearchStore()
const router = useRouter()
searchStore.setPathName('list')

const goToDetail = (index) => {
    searchStore.selectVideo(index)
    router.push('/detail')
}

const page = ref(searchStore.currentPage)

//控制隐藏右边导航栏
const naviIsShow = inject('naviIsShow')

// 视频源配置
const videoSources = [
    { key: 'yinghua', name: '樱花影视', description: '高清在线观看', icon: 'mdi-flower' },
    { key: 'liangzi', name: '量子影视', description: '快速稳定播放', icon: 'mdi-atom' },
    { key: 'uku', name: 'U酷影视', description: '海量资源库', icon: 'mdi-video' },
    { key: 'wolong', name: '卧龙影视', description: '经典影视推荐', icon: 'mdi-dragon' },
    { key: 'feifan', name: '非凡影视', description: '最新热门内容', icon: 'mdi-star' }
]

// 获取当前影视源名称
const getCurrentSourceName = () => {
    const source = videoSources.find(s => s.key === searchStore.currentWebsite)
    return source ? source.name : '该影视源'
}

// 切换影视源的处理函数
const handleSwitchWebsite = (website) => {
    searchStore.switchWebsite(website)
}

// 监听page变化，同步到store
watch(() => page.value, (newPage) => {
    if (searchStore.currentPage !== newPage) {
        searchStore.switchPage(newPage)
    }
})

// 监听store中的currentPage变化，同步到本地page（切换影视源时会重置页面）
watch(() => searchStore.currentPage, (newPage) => {
    if (page.value !== newPage) {
        page.value = newPage
    }
})

// 监听store中的currentWebsite变化，重置分页到第1页（切换影视源时）
watch(() => searchStore.currentWebsite, () => {
    // 当切换影视源时，store已经在switchWebsite中设置了currentPage为1
    // 这里只需要确保本地page同步更新
    page.value = 1
})
</script>

<template>
    <!-- 右侧导航抽屉 -->
    <v-navigation-drawer 
        width="280" 
        location="right" 
        v-model="naviIsShow" 
        temporary
        class="nav-drawer"
    >
        <div class="nav-header">
            <h3 class="nav-title">影视源</h3>
            <p class="nav-subtitle">选择视频源</p>
        </div>
        <v-divider class="nav-divider"></v-divider>
        <v-list class="nav-list">
            <v-list-item 
                v-for="source in videoSources" 
                :key="source.key"
                :title="source.name"
                :subtitle="source.description"
                class="nav-item"
                @click="handleSwitchWebsite(source.key)"
                :class="{ 'active': searchStore.currentWebsite === source.key }"
            >
                <template v-slot:prepend>
                    <v-icon :color="searchStore.currentWebsite === source.key ? 'primary' : 'grey-lighten-1'">
                        {{ source.icon }}
                    </v-icon>
                </template>
            </v-list-item>
        </v-list>
    </v-navigation-drawer>

    <v-main class="anime-main">
        <v-container fluid class="anime-container">
            <!-- 页面标题 -->
            <div class="page-header">
                <h1 class="page-title">搜索结果</h1>
            </div>

            <!-- 空状态 -->
            <v-card 
                v-if="searchStore.currentVideoList.length === 0" 
                class="empty-card"
                elevation="4"
            >
                <v-card-text class="empty-content">
                    <v-icon size="64" color="warning" class="mb-4">mdi-alert-circle-outline</v-icon>
                    <h3 class="empty-title">该影视源暂无此内容</h3>
                    <p class="empty-subtitle">{{ getCurrentSourceName() }}暂无搜索结果，请尝试切换其他影视源</p>
                    <v-btn 
                        variant="outlined" 
                        color="primary" 
                        class="mt-4"
                        @click="naviIsShow = true"
                    >
                        切换影视源
                    </v-btn>
                </v-card-text>
            </v-card>

            <!-- 动漫列表 -->
            <v-row v-else class="anime-grid">
                <v-col 
                    v-for="(item, index) in searchStore.currentVideoList" 
                    :key="index"
                    :cols="$vuetify.display.mobile ? 6 : 4"
                    :sm="$vuetify.display.sm ? 4 : 6"
                    :md="3"
                    :lg="2"
                    class="anime-col"
                >
                    <v-card 
                        class="anime-card"
                        elevation="4"
                        @click="goToDetail(index + 12 * (page - 1))"
                    >
                        <div class="image-container">
                            <v-img 
                                :src="item.vod_pic" 
                                cover
                                class="anime-image"
                                :alt="item.vod_name"
                            >
                                <template v-slot:placeholder>
                                    <div class="image-placeholder">
                                        <v-icon size="48" color="grey-lighten-1">mdi-image-outline</v-icon>
                                    </div>
                                </template>
                            </v-img>
                            <div class="image-overlay">
                                <v-icon color="white" size="24">mdi-play-circle-outline</v-icon>
                            </div>
                        </div>
                        <v-card-text class="anime-content">
                            <h3 class="anime-title">{{ item.vod_name }}</h3>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 分页 -->
            <div v-if="searchStore.currentVideoList.length > 0" class="pagination-container">
                <v-pagination 
                    v-model="page" 
                    :length="searchStore.totalPages" 
                    :total-visible="$vuetify.display.mobile ? 5 : 7"
                    class="pagination"
                    color="primary"
                    :density="$vuetify.display.mobile ? 'compact' : 'default'"
                ></v-pagination>
            </div>
        </v-container>
    </v-main>
</template>

<style scoped>
/* 主容器样式 */
.anime-main {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: 100vh;
  animation: pageEnter 0.6s ease-out;
  /* 防止布局跳动 */
  contain: none;
  overflow-x: auto;
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

.anime-container {
  padding: 2rem 1rem;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 300;
  color: #ffffff;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #b0b0b0;
  font-weight: 300;
  margin: 0;
}

/* 空状态卡片 */
.empty-card {
  background: rgba(45, 45, 45, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px !important;
  max-width: 500px;
  margin: 0 auto;
}

.empty-content {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-title {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 1rem;
}

.empty-subtitle {
  color: #b0b0b0;
  font-size: 1rem;
  margin-bottom: 0;
}

/* 动漫网格 */
.anime-grid {
  margin: 0 -0.5rem;
}

.anime-col {
  padding: 0.5rem;
}

/* 动漫卡片 */
.anime-card {
  background: rgba(45, 45, 45, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px !important;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  animation: animeCardEnter 0.6s ease-out both;
}

/* 动漫卡片进入动画 */
@keyframes animeCardEnter {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 为每个卡片添加不同的延迟 */
.anime-col:nth-child(1) .anime-card { animation-delay: 0.1s; }
.anime-col:nth-child(2) .anime-card { animation-delay: 0.2s; }
.anime-col:nth-child(3) .anime-card { animation-delay: 0.3s; }
.anime-col:nth-child(4) .anime-card { animation-delay: 0.4s; }
.anime-col:nth-child(5) .anime-card { animation-delay: 0.5s; }
.anime-col:nth-child(6) .anime-card { animation-delay: 0.6s; }

.anime-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border-color: rgba(100, 181, 246, 0.3);
}

/* 图片容器 */
.image-container {
  position: relative;
  overflow: hidden;
}

.anime-image {
  width: 100%;
  height: 200px;
  transition: transform 0.3s ease;
}

.anime-card:hover .anime-image {
  transform: scale(1.05);
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: rgba(60, 60, 60, 0.6);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.anime-card:hover .image-overlay {
  opacity: 1;
}

/* 动漫内容 */
.anime-content {
  padding: 1rem;
}

.anime-title {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 400;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 分页容器 */
.pagination-container {
  margin-top: 2rem;
  margin-bottom: 4rem; /* 为底部导航栏留出空间 */
  display: flex;
  justify-content: center;
  padding: 0 1rem;
}

.pagination {
  background: rgba(45, 45, 45, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 100%;
  overflow-x: auto;
  width: fit-content;
  min-width: 0;
}

.pagination :deep(.v-pagination__item) {
  min-width: 32px;
  height: 32px;
}

.pagination :deep(.v-pagination__navigation) {
  min-width: 32px;
  height: 32px;
}

/* 导航抽屉样式 */
.nav-drawer {
  background: rgba(30, 30, 30, 0.95) !important;
  backdrop-filter: blur(20px);
}

.nav-header {
  padding: 2rem 1.5rem 1rem;
  text-align: center;
}

.nav-title {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 0.5rem;
}

.nav-subtitle {
  color: #b0b0b0;
  font-size: 0.9rem;
  margin: 0;
}

.nav-divider {
  border-color: rgba(255, 255, 255, 0.1);
  margin: 0 1rem;
}

.nav-list {
  padding: 0 1rem;
}

.nav-item {
  margin: 0.5rem 0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: rgba(100, 181, 246, 0.1);
}

.nav-item.active {
  background: rgba(100, 181, 246, 0.2);
  border-left: 3px solid #64b5f6;
}

.nav-item :deep(.v-list-item-title) {
  color: #ffffff;
  font-weight: 400;
}

.nav-item :deep(.v-list-item-subtitle) {
  color: #b0b0b0;
  font-size: 0.8rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .anime-container {
    padding: 1.5rem 1rem;
  }
  
  .page-header {
    margin-bottom: 2rem;
  }
  
  .page-title {
    font-size: 2.2rem;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .anime-container {
    padding: 1rem 0.5rem;
  }
  
  .anime-grid {
    margin: 0 -0.25rem;
  }
  
  .anime-col {
    padding: 0.25rem;
  }
  
  .anime-image {
    height: 180px;
  }
  
  .anime-title {
    font-size: 0.9rem;
    -webkit-line-clamp: 1;
  }
  
  .anime-content {
    padding: 0.75rem;
  }
  
  .nav-drawer {
    width: 280px !important;
  }
  
  .nav-header {
    padding: 1.5rem 1rem 0.5rem;
  }
  
  .nav-title {
    font-size: 1.3rem;
  }
  
  .nav-subtitle {
    font-size: 0.8rem;
  }
  
  .pagination-container {
    margin-top: 1.5rem;
    margin-bottom: 3.5rem; /* 为平板端底部导航栏留出空间 */
    padding: 0 0.5rem;
  }
  
  .pagination {
    padding: 0.4rem;
    border-radius: 6px;
  }
  
  .empty-content {
    padding: 2rem 1rem;
  }
  
  .empty-title {
    font-size: 1.3rem;
  }
  
  .empty-subtitle {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .anime-container {
    padding: 0.75rem 0.25rem;
  }
  
  .anime-grid {
    margin: 0 -0.125rem;
  }
  
  .anime-col {
    padding: 0.125rem;
  }
  
  .anime-image {
    height: 140px;
  }
  
  .anime-title {
    font-size: 0.8rem;
    line-height: 1.3;
  }
  
  .anime-content {
    padding: 0.5rem;
  }
  
  .nav-drawer {
    width: 260px !important;
  }
  
  .nav-header {
    padding: 1rem 0.75rem 0.5rem;
  }
  
  .nav-title {
    font-size: 1.2rem;
  }
  
  .nav-subtitle {
    font-size: 0.75rem;
  }
  
  .nav-list {
    padding: 0 0.75rem;
  }
  
  .nav-item {
    margin: 0.25rem 0;
  }
  
  .pagination-container {
    margin-top: 1rem;
    margin-bottom: 3rem; /* 为手机端底部导航栏留出空间 */
    padding: 0 0.25rem;
  }
  
  .pagination {
    padding: 0.3rem;
    border-radius: 4px;
  }
  
  .empty-content {
    padding: 1.5rem 0.75rem;
  }
  
  .empty-title {
    font-size: 1.2rem;
  }
  
  .empty-subtitle {
    font-size: 0.85rem;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  .page-title {
    font-size: 1.6rem;
  }
  
  .anime-image {
    height: 120px;
  }
  
  .anime-title {
    font-size: 0.75rem;
  }
  
  .anime-content {
    padding: 0.4rem;
  }
  
  .nav-drawer {
    width: 240px !important;
  }
}
</style>