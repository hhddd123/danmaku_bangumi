import { defineStore } from "pinia";
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router';
import { ApiService } from '@/services/api'
import { WEBSITES, PAGINATION, ROUTES } from '@/constants'
import { arrayUtils, handleError } from '@/utils'

export const useSearchStore = defineStore('search', () => {
    const router = useRouter();
    
    // 搜索数据状态
    const searchData = ref({
        [WEBSITES.YINGHUA]: [],
        [WEBSITES.LIANGZI]: [],
        [WEBSITES.UKU]: [],
        [WEBSITES.WOLONG]: [],
        [WEBSITES.FEIFAN]: []
    })
    
    // 当前状态
    const currentWebsite = ref(WEBSITES.FEIFAN)
    const currentIndex = ref(0)
    const currentPage = ref(1)
    const currentPathName = ref(ROUTES.SEARCH)
    const danmaku = ref([])
    const loading = ref(false)
    const error = ref('')
    
    // 播放状态
    const currentPlayUrl = ref('')
    const currentDanmaku = ref([])
    const danmakuTimeOffset = ref(0) // 弹幕时间偏移量
    const playerVolume = ref(0.8)
    const playerMuted = ref(false)
    const playerSpeed = ref(1.0)
    const playerCurrentTime = ref(0)
    const playerDuration = ref(0)
    const playerWidth = ref(null)
    const playerHeight = ref(500)
    
    // 计算属性
    const currentVideoList = computed(() => {
        const data = searchData.value[currentWebsite.value] || []
        return arrayUtils.paginate(data, currentPage.value, PAGINATION.ITEMS_PER_PAGE)
    })
    
    const totalPages = computed(() => {
        const data = searchData.value[currentWebsite.value] || []
        return Math.ceil(data.length / PAGINATION.ITEMS_PER_PAGE)
    })
    
    const hasSearchResults = computed(() => {
        return Object.values(searchData.value).some(data => data.length > 0)
    })
    
    const currentVideo = computed(() => {
        const data = searchData.value[currentWebsite.value] || []
        return data[currentIndex.value] || null
    })

    // 搜索所有网站
    const searchAllWebsites = async (keyword) => {
        if (!keyword?.trim()) {
            error.value = '请输入搜索关键词'
            return
        }
        
        loading.value = true
        error.value = ''
        
        try {
            const results = await ApiService.searchAllWebsites(keyword)
            
            // 更新搜索数据
            results.forEach(result => {
                if (result.success) {
                    searchData.value[result.website] = result.data || []
                } else {
                    searchData.value[result.website] = []
                }
            })
            
            // 重置状态
            currentWebsite.value = WEBSITES.FEIFAN
            currentIndex.value = 0
            currentPage.value = 1
            
            // 只有在有搜索结果时才跳转到列表页
            if (hasSearchResults.value) {
                router.push('/list')
            } else {
                error.value = '未找到相关内容，请尝试其他关键词'
            }
            
        } catch (err) {
            error.value = handleError(err, '搜索失败')
        } finally {
            loading.value = false
        }
    }

    // 切换网站
    const switchWebsite = (website) => {
        currentWebsite.value = website
        currentIndex.value = 0
        currentPage.value = 1
        error.value = ''
    }

    // 切换页面
    const switchPage = (page) => {
        if (page < 1 || page > totalPages.value) return
        
        currentPage.value = page
    }

    // 选择视频
    const selectVideo = (index) => {
        const data = searchData.value[currentWebsite.value] || []
        if (index >= 0 && index < data.length) {
            currentIndex.value = index
        }
    }

    // 设置路径名称
    const setPathName = (pathName) => {
        currentPathName.value = pathName
    }

    // 设置弹幕
    const setDanmaku = (danmakuList) => {
        danmaku.value = danmakuList || []
        currentDanmaku.value = danmakuList || []
    }
    
    // 播放状态管理
    const setPlayUrl = (url) => {
        currentPlayUrl.value = url
    }
    
    const setPlayerVolume = (volume) => {
        playerVolume.value = Math.max(0, Math.min(1, volume))
    }
    
    const setPlayerMuted = (muted) => {
        playerMuted.value = muted
    }
    
    const setPlayerSpeed = (speed) => {
        playerSpeed.value = Math.max(0.25, Math.min(4, speed))
    }
    
    const setPlayerCurrentTime = (time) => {
        playerCurrentTime.value = time
    }
    
    const setPlayerDuration = (duration) => {
        playerDuration.value = duration
    }
    
    const setPlayerWidth = (width) => {
        playerWidth.value = width !== null ? Math.max(400, width) : null
    }
    
    const setPlayerHeight = (height) => {
        playerHeight.value = Math.max(200, Math.min(1000, height))
    }
    
    const setDanmakuTimeOffset = (offset) => {
        danmakuTimeOffset.value = offset
    }
    
    const resetPlayerState = () => {
        currentPlayUrl.value = ''
        currentDanmaku.value = []
        danmakuTimeOffset.value = 0
        playerVolume.value = 0.8
        playerMuted.value = false
        playerSpeed.value = 1.0
        playerCurrentTime.value = 0
        playerDuration.value = 0
        playerWidth.value = null
        playerHeight.value = 500
    }

    // 清空搜索数据
    const clearSearchData = () => {
        Object.keys(searchData.value).forEach(key => {
            searchData.value[key] = []
        })
        currentIndex.value = 0
        currentPage.value = 1
        error.value = ''
    }

    // 重置状态
    const resetState = () => {
        clearSearchData()
        currentWebsite.value = WEBSITES.FEIFAN
        currentPathName.value = ROUTES.SEARCH
        danmaku.value = []
        loading.value = false
    }

    return {
        // 状态
        searchData,
        currentWebsite,
        currentIndex,
        currentPage,
        currentPathName,
        danmaku,
        loading,
        error,
        
        // 播放状态
        currentPlayUrl,
        currentDanmaku,
        danmakuTimeOffset,
        playerVolume,
        playerMuted,
        playerSpeed,
        playerCurrentTime,
        playerDuration,
        playerWidth,
        playerHeight,
        
        // 计算属性
        currentVideoList,
        totalPages,
        hasSearchResults,
        currentVideo,
        
        // 方法
        searchAllWebsites,
        switchWebsite,
        switchPage,
        selectVideo,
        setPathName,
        setDanmaku,
        setPlayUrl,
        setPlayerVolume,
        setPlayerMuted,
        setPlayerSpeed,
        setPlayerCurrentTime,
        setPlayerDuration,
        setPlayerWidth,
        setPlayerHeight,
        setDanmakuTimeOffset,
        resetPlayerState,
        clearSearchData,
        resetState,
        
        // 兼容性方法（保持向后兼容）
        get yinghua() { return searchData.value[WEBSITES.YINGHUA] },
        get liangzi() { return searchData.value[WEBSITES.LIANGZI] },
        get uku() { return searchData.value[WEBSITES.UKU] },
        get wolong() { return searchData.value[WEBSITES.WOLONG] },
        get feifan() { return searchData.value[WEBSITES.FEIFAN] },
        get website() { return currentWebsite.value },
        get index() { return currentIndex.value },
        get page() { return currentPage.value },
        get videoList() { return currentVideoList.value },
        get pathName() { return currentPathName.value },
        get length() { return totalPages.value },
        
        // 兼容性方法
        searchStore: searchAllWebsites,
        changeWebsite: switchWebsite,
        changeIndex: selectVideo,
        changePage: switchPage,
        changeVideoList: () => {}, // 已废弃，使用计算属性
        changePathName: setPathName,
        changeDanmaku: setDanmaku
    }

}, {
    persist: {
        enabled: true,
        strategies: [
            {
                storage: localStorage,
                paths: ['searchData', 'currentWebsite', 'currentIndex', 'currentPage', 'currentPathName', 'danmaku', 'currentPlayUrl', 'currentDanmaku', 'danmakuTimeOffset', 'playerVolume', 'playerMuted', 'playerSpeed', 'playerCurrentTime', 'playerDuration', 'playerWidth', 'playerHeight']
            }
        ]
    }
})