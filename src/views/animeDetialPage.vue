<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/searchVideo'

const searchStore = useSearchStore()
const router = useRouter()
searchStore.setPathName('detail')

// 获取当前视频信息
const currentVideo = computed(() => searchStore.currentVideo)

const goToPlayer = (url) => {
    //跳转/player，query参数为url
    searchStore.setDanmaku([])
    router.push({ path: '/player', query: { episode: url } })
}


</script>

<template>
    <v-main class="detail-main">
        <v-container fluid class="detail-container">
            <!-- 动漫信息卡片 -->
            <v-card class="anime-info-card" elevation="8">
                <v-row no-gutters>
                    <!-- 动漫封面 -->
                    <v-col cols="12" sm="4" md="3" class="cover-col">
                        <div class="cover-container">
                            <v-img 
                                :src="currentVideo?.vod_pic" 
                                :alt="currentVideo?.vod_name"
                                class="anime-cover"
                                cover
                            >
                                <template v-slot:placeholder>
                                    <div class="cover-placeholder">
                                        <v-icon size="64" color="grey-lighten-1">mdi-image-outline</v-icon>
                                    </div>
                                </template>
                            </v-img>
                        </div>
                    </v-col>
                    
                    <!-- 动漫信息 -->
                    <v-col cols="12" sm="8" md="9" class="info-col">
                        <v-card-text class="anime-info">
                            <h1 class="anime-title">{{ currentVideo?.vod_name }}</h1>
                            
                            <!-- 动漫描述 -->
                            <div class="anime-description" v-if="currentVideo?.vod_content">
                                <p class="description-text">{{ currentVideo?.vod_content }}</p>
                            </div>
                            
                            <!-- 动漫标签 -->
                            <div class="anime-tags" v-if="currentVideo?.vod_class">
                                <v-chip 
                                    v-for="tag in currentVideo?.vod_class.split(',')" 
                                    :key="tag"
                                    class="tag-chip"
                                    size="small"
                                    variant="outlined"
                                >
                                    {{ tag.trim() }}
                                </v-chip>
                            </div>
                            
                            <!-- 播放信息 -->
                            <div class="play-info">
                                <v-icon color="primary" class="mr-2">mdi-play-circle</v-icon>
                                <span class="play-text">点击下方集数开始播放</span>
                            </div>
                        </v-card-text>
                    </v-col>
                </v-row>
            </v-card>

            <!-- 集数选择区域 -->
            <div class="episodes-section">
                <h2 class="episodes-title">
                    <v-icon class="mr-2">mdi-playlist-play</v-icon>
                    选择集数
                </h2>
                
                <div class="episodes-grid">
                    <v-card 
                        v-for="(item, index) in currentVideo?.vod_play_url"
                        :key="index" 
                        class="episode-card"
                        elevation="4"
                        @click="goToPlayer(item[1])"
                    >
                        <v-card-text class="episode-content">
                            <v-icon color="primary" class="episode-icon">mdi-play</v-icon>
                            <span class="episode-text">{{ item[0] }}</span>
                        </v-card-text>
                    </v-card>
                </div>
            </div>
        </v-container>
    </v-main>
</template>

<style scoped>
/* 主容器样式 */
.detail-main {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: 100vh;
  padding-bottom: 4rem; /* 为底部导航栏留出空间 */
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

.detail-container {
  padding: 2rem 1rem;
}

/* 动漫信息卡片 */
.anime-info-card {
  background: rgba(45, 45, 45, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px !important;
  margin-bottom: 2rem;
  overflow: hidden;
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

.cover-col {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.cover-container {
  width: 100%;
  max-width: 300px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.anime-cover {
  width: 100%;
  height: 400px;
  transition: transform 0.3s ease;
}

.anime-cover:hover {
  transform: scale(1.02);
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: rgba(60, 60, 60, 0.6);
}

.info-col {
  padding: 1rem;
}

.anime-info {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.anime-title {
  color: #ffffff;
  font-size: 2rem;
  font-weight: 400;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.anime-description {
  margin-bottom: 1.5rem;
}

.description-text {
  color: #b0b0b0;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anime-tags {
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-chip {
  background: rgba(100, 181, 246, 0.1) !important;
  border-color: rgba(100, 181, 246, 0.3) !important;
  color: #64b5f6 !important;
}

.play-info {
  display: flex;
  align-items: center;
  color: #64b5f6;
  font-size: 1rem;
  font-weight: 500;
}

.play-text {
  color: #b0b0b0;
}

/* 集数选择区域 */
.episodes-section {
  margin-top: 2rem;
}

.episodes-title {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 4rem; /* 增加底部间距，避免被导航栏遮挡 */
}

.episode-card {
  background: rgba(45, 45, 45, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px !important;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 60px;
}

.episode-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border-color: rgba(100, 181, 246, 0.3);
  background: rgba(60, 60, 60, 0.9) !important;
}

.episode-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0.5rem;
  text-align: center;
  height: 100%;
}

.episode-icon {
  margin-bottom: 0.5rem;
}

.episode-text {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.2;
  word-break: break-all;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .detail-container {
    padding: 1.5rem 1rem;
  }
  
  .detail-main {
    padding-bottom: 3.5rem; /* 为平板端底部导航栏留出空间 */
  }
  
  .anime-title {
    font-size: 1.8rem;
  }
  
  .anime-cover {
    height: 350px;
  }
  
  .cover-placeholder {
    height: 350px;
  }
}

@media (max-width: 768px) {
  .detail-container {
    padding: 1rem 0.5rem;
  }
  
  .detail-main {
    padding-bottom: 3rem; /* 为手机端底部导航栏留出空间 */
  }
  
  .anime-info-card {
    margin-bottom: 1.5rem;
  }
  
  .cover-col {
    padding: 0.5rem;
  }
  
  .anime-cover {
    height: 300px;
  }
  
  .cover-placeholder {
    height: 300px;
  }
  
  .info-col {
    padding: 0.5rem;
  }
  
  .anime-title {
    font-size: 1.6rem;
  }
  
  .description-text {
    font-size: 0.9rem;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }
  
  .episodes-title {
    font-size: 1.3rem;
  }
  
  .episodes-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
    margin-bottom: 3.5rem; /* 为平板端增加底部间距 */
  }
  
  .episode-card {
    min-height: 50px;
  }
  
  .episode-content {
    padding: 0.75rem 0.25rem;
  }
  
  .episode-text {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .detail-container {
    padding: 0.75rem 0.25rem;
  }
  
  .anime-cover {
    height: 250px;
  }
  
  .cover-placeholder {
    height: 250px;
  }
  
  .anime-title {
    font-size: 1.4rem;
  }
  
  .description-text {
    font-size: 0.85rem;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  
  .episodes-title {
    font-size: 1.2rem;
  }
  
  .episodes-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.5rem;
    margin-bottom: 3rem; /* 为手机端增加底部间距 */
  }
  
  .episode-card {
    min-height: 45px;
  }
  
  .episode-content {
    padding: 0.5rem 0.25rem;
  }
  
  .episode-text {
    font-size: 0.75rem;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  .anime-cover {
    height: 200px;
  }
  
  .cover-placeholder {
    height: 200px;
  }
  
  .anime-title {
    font-size: 1.2rem;
  }
  
  .episodes-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    margin-bottom: 2.5rem; /* 为超小屏幕增加底部间距 */
  }
  
  .episode-card {
    min-height: 40px;
  }
  
  .episode-text {
    font-size: 0.7rem;
  }
}
</style>