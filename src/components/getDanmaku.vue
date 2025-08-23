<script setup>
import { ref } from 'vue'
import { useSearchStore } from '@/stores/searchVideo'
import { ApiService } from '@/services/api'
import { handleError } from '@/utils'

const searchStore = useSearchStore()
const dialog = ref(false)
const dialog2 = ref(false)
const isTransitioning = ref(false)

const keyword = ref('')
const loading = ref(false)
const episodeLoading = ref(false)
const error = ref('')

let bangumi = null
let episode = null

//通过关键词获取bangumiId
const getBangumi = async (keyword) => {
    if (!keyword.trim()) {
        error.value = '请输入搜索关键词'
        return
    }
    
    loading.value = true
    error.value = ''
    
    try {
        const response = await ApiService.searchAnime(keyword)
        
        // 处理API响应结构
        const data = response.animes || response
        bangumi = data
        if (bangumi && bangumi.length > 0) {
            dialog.value = true
        } else {
            error.value = '未找到相关影视作品'
        }
    } catch (err) {
        error.value = handleError(err, '搜索失败，请稍后重试')
    } finally {
        loading.value = false
    }
}

//通过bangumiId获取集数
const selectEpisode = async (bangumiId) => {
    episodeLoading.value = true
    error.value = ''
    
    try {
        const response = await ApiService.getBangumi(bangumiId)
        
        // 处理API响应结构
        const data = response.episodes || response
        episode = data
        
        if (episode && episode.length > 0) {
            // 设置过渡状态，防止弹窗闪烁
            isTransitioning.value = true
            dialog.value = false
            // 延迟打开集数弹窗
            setTimeout(() => {
                dialog2.value = true
                isTransitioning.value = false
            }, 100)
        } else {
            error.value = '该作品暂无集数信息'
            // 保持动漫弹窗打开，让用户选择其他动漫
        }
    } catch (err) {
        error.value = handleError(err, '获取集数失败，请稍后重试')
        // 保持动漫弹窗打开，让用户选择其他动漫
    } finally {
        episodeLoading.value = false
    }
}

//通过集数获得弹幕库
const getDanmaku = async (episodeId) => {
    loading.value = true
    error.value = ''
    
    try {
        const response = await ApiService.getDanmaku(episodeId)
        
        // 处理API响应结构
        const data = response.comments || response.danmaku || response
        const danmaku = data.sort((a, b) => a.time - b.time)
        searchStore.setDanmaku(danmaku)
        dialog.value = false
        dialog2.value = false
        // 显示成功提示
        error.value = ''
    } catch (err) {
        error.value = handleError(err, '获取弹幕失败，请稍后重试')
    } finally {
        loading.value = false
    }
}

</script>

<template>
    <div class="danmaku-container">
        <!-- 搜索区域 -->
        <div class="search-section">
            <v-text-field 
                v-model="keyword" 
                label="搜索弹幕库" 
                variant="outlined" 
                density="comfortable"
                append-inner-icon="mdi-arrow-right"
                class="search-field"
                hide-details="auto"
                :loading="loading"
                :disabled="loading"
                :rules="[v => !!v || '请输入搜索关键词']"
                @click:append-inner="getBangumi(keyword)" 
                @keyup.enter="getBangumi(keyword)"
            >
                <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-magnify</v-icon>
                </template>
            </v-text-field>
            
            <!-- 错误提示 -->
            <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                class="mt-3"
                closable
                @click:close="error = ''"
            >
                {{ error }}
            </v-alert>
            
        </div>

        <!-- 番剧选择弹窗 -->
        <v-dialog 
            v-model="dialog" 
            max-width="800" 
            scrollable
            transition="dialog-transition"
            class="bangumi-dialog"
        >
            <v-card class="bangumi-card" elevation="12" rounded="xl">
                <!-- 弹窗头部 -->
                <v-card-title class="dialog-header">
                    <v-icon start color="primary">mdi-movie-search</v-icon>
                    选择影视作品
                    <v-spacer></v-spacer>
                    <v-btn 
                        icon="mdi-close" 
                        variant="text" 
                        size="small"
                        @click="dialog = false"
                    ></v-btn>
                </v-card-title>
                
                <v-divider></v-divider>

                <!-- 内容区域 -->
                <v-card-text class="dialog-content">
                    <!-- 搜索加载状态 -->
                    <div v-if="loading" class="loading-state">
                        <v-progress-circular
                            indeterminate
                            color="primary"
                            size="48"
                        ></v-progress-circular>
                        <p class="loading-text">正在搜索...</p>
                    </div>
                    
                    <!-- 集数获取加载状态 -->
                    <div v-else-if="episodeLoading || isTransitioning" class="loading-state">
                        <v-progress-circular
                            indeterminate
                            color="primary"
                            size="48"
                        ></v-progress-circular>
                        <p class="loading-text">{{ isTransitioning ? '正在切换...' : '正在获取集数...' }}</p>
                    </div>
                    
                    <!-- 番剧列表 -->
                    <div v-else-if="bangumi && bangumi.length > 0" class="bangumi-grid">
                        <v-card
                            v-for="(item, index) in bangumi" 
                            :key="index"
                            class="bangumi-item"
                            elevation="4"
                            rounded="lg"
                            hover
                            @click="selectEpisode(item.bangumiId)"
                        >
                            <div class="image-container">
                                <v-img 
                                    :src="item.imageUrl" 
                                    :alt="item.animeTitle"
                                    cover
                                    class="bangumi-image"
                                >
                                    <template v-slot:placeholder>
                                        <div class="image-placeholder">
                                            <v-icon size="48" color="grey-lighten-1">mdi-image</v-icon>
                                        </div>
                                    </template>
                                    <div class="image-overlay">
                                        <v-icon color="white" size="32">mdi-play</v-icon>
                                    </div>
                                </v-img>
                            </div>
                            <v-card-text class="bangumi-text">
                                <h3 class="bangumi-title">{{ item.animeTitle }}</h3>
                            </v-card-text>
                        </v-card>
                    </div>
                    
                    <div v-else class="empty-state">
                        <v-icon size="64" color="grey-lighten-1">mdi-movie-off</v-icon>
                        <p class="empty-text">暂无搜索结果</p>
                    </div>
                </v-card-text>

                <!-- 底部操作区 -->
                <v-card-actions class="dialog-actions">
                    <v-spacer></v-spacer>
                    <v-btn 
                        variant="outlined" 
                        color="primary"
                        @click="dialog = false"
                    >
                        取消
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 集数选择弹窗 -->
        <v-dialog 
            v-model="dialog2" 
            max-width="600" 
            scrollable
            transition="dialog-transition"
            class="episode-dialog"
        >
            <v-card class="episode-card" elevation="12" rounded="xl">
                <!-- 弹窗头部 -->
                <v-card-title class="dialog-header">
                    <v-icon start color="primary">mdi-playlist-play</v-icon>
                    选择集数
                    <v-spacer></v-spacer>
                    <v-btn 
                        icon="mdi-close" 
                        variant="text" 
                        size="small"
                        @click="dialog2 = false"
                    ></v-btn>
                </v-card-title>
                
                <v-divider></v-divider>

                <!-- 内容区域 -->
                <v-card-text class="dialog-content">
                    <!-- 加载状态 -->
                    <div v-if="loading" class="loading-state">
                        <v-progress-circular
                            indeterminate
                            color="primary"
                            size="48"
                        ></v-progress-circular>
                        <p class="loading-text">正在加载集数...</p>
                    </div>
                    
                    <!-- 集数列表 -->
                    <div v-else-if="episode && episode.length > 0" class="episode-list">
                        <v-card
                            v-for="(item, index) in episode" 
                            :key="index"
                            class="episode-item"
                            elevation="2"
                            rounded="lg"
                            hover
                            @click="getDanmaku(item.episodeId)"
                        >
                            <v-card-text class="episode-content">
                                <div class="episode-info">
                                    <v-icon color="primary" class="episode-icon">mdi-play-circle</v-icon>
                                    <div class="episode-text">
                                        <h4 class="episode-title">{{ item.episodeTitle }}</h4>
                                        <p class="episode-subtitle">点击加载弹幕</p>
                                    </div>
                                </div>
                                <v-icon color="grey-lighten-1">mdi-chevron-right</v-icon>
                            </v-card-text>
                        </v-card>
                    </div>
                    
                    <div v-else class="empty-state">
                        <v-icon size="64" color="grey-lighten-1">mdi-playlist-off</v-icon>
                        <p class="empty-text">暂无集数信息</p>
                    </div>
                </v-card-text>

                <!-- 底部操作区 -->
                <v-card-actions class="dialog-actions">
                    <v-spacer></v-spacer>
                    <v-btn 
                        variant="outlined" 
                        color="primary"
                        @click="dialog2 = false"
                    >
                        取消
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>
/* 主容器 */
.danmaku-container {
  padding: 1rem;
  background: rgba(45, 45, 45, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 搜索区域 */
.search-section {
  margin-bottom: 1rem;
}

.search-field :deep(.v-field) {
  background: rgba(60, 60, 60, 0.6) !important;
  border-radius: 12px !important;
  transition: all 0.3s ease;
}

.search-field :deep(.v-field__input) {
  color: #ffffff !important;
  font-size: 1rem;
}

.search-field :deep(.v-label) {
  color: #a0a0a0 !important;
}

.search-field :deep(.v-field__outline) {
  color: rgba(255, 255, 255, 0.2) !important;
}

.search-field :deep(.v-field--focused .v-field__outline) {
  color: #64b5f6 !important;
  border-width: 2px !important;
}

.search-field :deep(.v-field__prepend-inner) {
  color: #64b5f6 !important;
}

.search-field :deep(.v-field__append-inner) {
  color: #a0a0a0 !important;
  transition: all 0.3s ease;
}

.search-field :deep(.v-field--focused .v-field__append-inner) {
  color: #64b5f6 !important;
}

/* 弹窗样式 */
.bangumi-card,
.episode-card {
  background: rgba(45, 45, 45, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 弹窗头部 */
.dialog-header {
  background: rgba(30, 30, 30, 0.8);
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 500;
  padding: 1rem 1.5rem;
}

.dialog-header .v-icon {
  margin-right: 0.5rem;
}

/* 弹窗内容 */
.dialog-content {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

/* 番剧网格 */
.bangumi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 0.5rem 0;
}

/* 番剧卡片 */
.bangumi-item {
  background: rgba(60, 60, 60, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}

.bangumi-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border-color: rgba(100, 181, 246, 0.3);
}

/* 图片容器 */
.image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.bangumi-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.bangumi-item:hover .bangumi-image {
  transform: scale(1.05);
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: rgba(80, 80, 80, 0.5);
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

.bangumi-item:hover .image-overlay {
  opacity: 1;
}

/* 番剧文本 */
.bangumi-text {
  padding: 1rem;
}

.bangumi-title {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 集数列表 */
.episode-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

/* 集数项目 */
.episode-item {
  background: rgba(60, 60, 60, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.episode-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border-color: rgba(100, 181, 246, 0.3);
  background: rgba(70, 70, 70, 0.7) !important;
}

.episode-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.episode-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.episode-icon {
  margin-right: 1rem;
  font-size: 1.5rem;
}

.episode-text {
  flex: 1;
}

.episode-title {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.episode-subtitle {
  color: #b0b0b0;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.2;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-text {
  color: #b0b0b0;
  font-size: 1rem;
  margin: 1rem 0 0 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-text {
  color: #b0b0b0;
  font-size: 1rem;
  margin: 1rem 0 0 0;
}

/* 弹窗操作区 */
.dialog-actions {
  background: rgba(30, 30, 30, 0.8);
  padding: 1rem 1.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .danmaku-container {
    padding: 0.75rem;
  }
  
  .bangumi-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }
  
  .image-container {
    height: 150px;
  }
  
  .bangumi-title {
    font-size: 0.8rem;
  }
  
  .episode-content {
    padding: 0.75rem 1rem;
  }
  
  .episode-title {
    font-size: 0.9rem;
  }
  
  .episode-subtitle {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .bangumi-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }
  
  .image-container {
    height: 120px;
  }
  
  .bangumi-title {
    font-size: 0.75rem;
  }
  
  .episode-content {
    padding: 0.5rem 0.75rem;
  }
  
  .episode-icon {
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }
}
</style>