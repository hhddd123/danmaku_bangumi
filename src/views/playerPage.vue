<script setup>
import NPlayer from 'nplayer'
import { onMounted, ref, inject, watch, onActivated, onBeforeUnmount, computed } from 'vue';
import Hls from 'hls.js'
import { useRoute } from 'vue-router'
import Danmaku from '@nplayer/danmaku'
import getDanmakuVue from '@/components/getDanmaku.vue'
import { useSearchStore } from '@/stores/searchVideo'

const searchStore = useSearchStore()
searchStore.setPathName('player')

const route = useRoute()
const episode = route.query.episode
const player = ref(null)
const naviIsShow = inject('naviIsShow')
const danmakuTime = ref(searchStore.danmakuTimeOffset) // 从 store 恢复弹幕时间偏移

// 获取当前播放的动漫信息
const currentAnimeInfo = computed(() => {
    const currentVideo = searchStore.currentVideo
    if (!currentVideo) return null
    
    // 查找当前播放的集数信息
    const currentEpisodeUrl = episode || searchStore.currentPlayUrl
    let episodeName = '未知集数'
    
    if (currentVideo.vod_play_url && currentEpisodeUrl) {
        const episodeInfo = currentVideo.vod_play_url.find(item => item[1] === currentEpisodeUrl)
        if (episodeInfo) {
            episodeName = episodeInfo[0]
        }
    }
    
    return {
        animeName: currentVideo.vod_name || '未知动漫',
        episodeName: episodeName
    }
})

// 播放器尺寸控制（仅桌面端）
const playerWidth = ref(1280) // 默认宽度
const playerHeight = ref(720) // 默认高度
const isResizing = ref(false)
const isMobile = ref(false)
const hasRestoredTime = ref(false) // 标记是否已经恢复过播放时间

// 获取播放链接
const getPlayUrl = () => {
    // 优先使用URL参数，如果没有则使用store中保存的链接
    return episode || searchStore.currentPlayUrl
}

// 初始化播放状态
const initPlayerState = () => {
    const playUrl = getPlayUrl()
    const savedUrl = searchStore.currentPlayUrl
    
    // 检查是否切换了视频
    if (playUrl && savedUrl && playUrl !== savedUrl) {
        // 重置所有状态
        searchStore.setPlayerCurrentTime(0)
        searchStore.setDanmakuTimeOffset(0)
        danmakuTime.value = 0
        
        // 强制保存到 localStorage
        try {
            const storeData = JSON.parse(localStorage.getItem('search') || '{}')
            storeData.playerCurrentTime = 0
            storeData.danmakuTimeOffset = 0
            localStorage.setItem('search', JSON.stringify(storeData))
        } catch (e) {
            console.error('保存失败:', e)
        }
    }
    
    if (playUrl) {
        searchStore.setPlayUrl(playUrl)
    }
    
    // 恢复弹幕时间偏移
    danmakuTime.value = searchStore.danmakuTimeOffset
    
    // 如果有记忆的弹幕，加载到播放器（currentDanmaku已经包含偏移）
    if (searchStore.currentDanmaku.length > 0 && player.value && player.value.danmaku) {
        try {
            // currentDanmaku 已经是应用过偏移的弹幕，直接使用
            const danmakuItems = JSON.parse(JSON.stringify(searchStore.currentDanmaku))
            player.value.danmaku.items = danmakuItems
        } catch (error) {
            console.warn('弹幕加载失败:', error)
        }
    }
}

// 监听弹幕变化
watch(() => searchStore.danmaku, (newDanmaku, oldDanmaku) => {
    if (player.value && player.value.danmaku && newDanmaku && newDanmaku.length > 0) {
        // 检查是否真的是新弹幕（不是初始化）
        const isNewDanmaku = oldDanmaku && oldDanmaku.length > 0 && newDanmaku !== oldDanmaku
        
        try {
            // 延迟更新弹幕，避免干扰视频播放
            setTimeout(() => {
                if (player.value && player.value.danmaku) {
                    const danmakuItems = JSON.parse(JSON.stringify(newDanmaku))
                    player.value.danmaku.items = danmakuItems
                    
                    if (isNewDanmaku) {
                        // 只有切换新弹幕时才重置时间偏移
                        danmakuTime.value = 0
                        searchStore.setDanmakuTimeOffset(0)
                    }
                    
                    // 更新 currentDanmaku
                    searchStore.currentDanmaku = danmakuItems
                }
            }, 100)
        } catch (error) {
            console.warn('弹幕更新失败:', error)
        }
    }
})

// 监听路由变化，当从其他页面切回时重新加载视频
watch(() => route.query.episode, (newEpisode, oldEpisode) => {
    if (player.value && newEpisode && newEpisode !== oldEpisode) {
        const hls = player.value.video.hls
        if (hls) {
            // 先重置所有状态
            player.value.currentTime = 0
            searchStore.setPlayerCurrentTime(0)
            danmakuTime.value = 0
            searchStore.setDanmakuTimeOffset(0)
            
            // 重置弹幕到原始状态（无偏移）
            if (player.value.danmaku && searchStore.danmaku && searchStore.danmaku.length > 0) {
                const originalDanmaku = JSON.parse(JSON.stringify(searchStore.danmaku))
                player.value.danmaku.items = originalDanmaku
                searchStore.currentDanmaku = originalDanmaku
            }
            
            // 强制保存到 localStorage
            try {
                const storeData = JSON.parse(localStorage.getItem('search') || '{}')
                storeData.playerCurrentTime = 0
                storeData.danmakuTimeOffset = 0
                storeData.currentPlayUrl = newEpisode
                localStorage.setItem('search', JSON.stringify(storeData))
            } catch (e) {
                console.error('保存失败:', e)
            }
            
            // 加载新视频
            hls.loadSource(newEpisode)
            searchStore.setPlayUrl(newEpisode)
            
            // 标记为已恢复，防止 MANIFEST_PARSED 再次恢复
            hasRestoredTime.value = true
        }
    }
})

const changeDanmakuTime = (isAdd) => {
    if (player.value.danmaku.items.length === 0) {
        alert('弹幕未装载')
        return
    }
    
    // 更新偏移值
    danmakuTime.value = isAdd ? danmakuTime.value + 0.5 : danmakuTime.value - 0.5
    searchStore.setDanmakuTimeOffset(danmakuTime.value)
    
    // 基于原始弹幕重新计算偏移后的弹幕
    if (searchStore.danmaku && searchStore.danmaku.length > 0) {
        const danmakuItems = JSON.parse(JSON.stringify(searchStore.danmaku))
        danmakuItems.forEach(item => {
            item.time += danmakuTime.value
        })
        player.value.danmaku.items = danmakuItems
        searchStore.currentDanmaku = danmakuItems
    }
}

// 处理直接输入的弹幕时间偏移
const applyDanmakuTimeOffset = (inputValue) => {
    if (player.value.danmaku.items.length === 0) {
        alert('弹幕未装载')
        return
    }
    
    // 验证输入值
    let offsetValue = parseFloat(inputValue)
    if (isNaN(offsetValue)) {
        offsetValue = 0
    }
    
    // 更新本地值和store
    danmakuTime.value = offsetValue
    searchStore.setDanmakuTimeOffset(offsetValue)
    
    // 基于原始弹幕重新计算偏移后的弹幕
    if (searchStore.danmaku && searchStore.danmaku.length > 0) {
        const danmakuItems = JSON.parse(JSON.stringify(searchStore.danmaku))
        danmakuItems.forEach(item => {
            item.time += offsetValue
        })
        player.value.danmaku.items = danmakuItems
        searchStore.currentDanmaku = danmakuItems
    }
}

// 锁定和解锁控制栏的方法
const lockControlBar = () => {
    if (player.value && player.value.control) {
        // 使用NPlayer的require API来锁定控制栏显示
        player.value.control.require()
    }
}

const unlockControlBar = () => {
    if (player.value && player.value.control) {
        // 使用NPlayer的release API来释放控制栏锁定
        player.value.control.release()
    }
}



// ============ 快捷键和触摸交互系统 ============

// 快捷键状态
let rightArrowPressTimer = null
let isRightArrowPressed = false
let isRightArrowLongPressed = false
const originalPlaybackRate = ref(1)

// 右键菜单处理函数
let contextMenuHandler = null

// ============ 移动端触摸控制系统 ============

// 移动端触摸状态
let mobileState = {
    touchStartX: 0,
    touchStartTime: 0,
    touchLongPressTimer: null,
    isTouchLongPressed: false,
    lastTapTime: 0,
    tapCount: 0,
    doubleTapTimer: null,
    isSwipingForSeek: false,
    isTouchingControl: false,
    isManuallyUpdatingProgress: false, // 添加标记，防止进度条冲突
    timeUpdateBlocker: null // 保存 timeupdate 事件阻止器
}

const MOBILE_TOUCH_LONG_PRESS_DURATION = 500
const MOBILE_TOUCH_SWIPE_THRESHOLD = 10
const MOBILE_DOUBLE_TAP_DELAY = 300

// 移动端触摸事件处理
const handleMobileTouchStart = (e) => {
    if (!player.value || !isMobile.value) return
    
    // 重置手动更新标记
    mobileState.isManuallyUpdatingProgress = false
    
    // 清理 timeupdate 事件阻止器
    if (player.value.video && mobileState.timeUpdateBlocker) {
        player.value.video.removeEventListener('timeupdate', mobileState.timeUpdateBlocker, true)
        mobileState.timeUpdateBlocker = null
    }
    
    // 检查是否在控制栏或其子元素上（更全面的检测）
    const target = e.target
    const isOnControl = target && (
        target.classList?.contains('nplayer_control') || 
        target.closest('.nplayer_control') ||
        target.classList?.contains('nplayer_control_bar') ||
        target.closest('.nplayer_control_bar') ||
        target.classList?.contains('nplayer_progress') || 
        target.closest('.nplayer_progress') ||
        target.classList?.contains('nplayer_tooltip') ||
        target.closest('.nplayer_tooltip') ||
        target.classList?.contains('nplayer_icon') ||
        target.closest('.nplayer_icon') ||
        target.classList?.contains('nplayer_volume') ||
        target.closest('.nplayer_volume') ||
        target.classList?.contains('nplayer_settings') ||
        target.closest('.nplayer_settings') ||
        target.classList?.contains('nplayer_menu') ||
        target.closest('.nplayer_menu') ||
        target.classList?.contains('nplayer_slider') ||
        target.closest('.nplayer_slider') ||
        // 检查是否有 data-nplayer 属性
        target.hasAttribute?.('data-nplayer') ||
        target.closest('[data-nplayer]') ||
        // 检查是否在任何控制相关的元素上
        target.closest('.nplayer_control *')
    )
    
    if (isOnControl) {
        mobileState.isTouchingControl = true
        // 不阻止事件传播，让NPlayer正常处理控制栏交互
        return
    }
    
    mobileState.isTouchingControl = false
    mobileState.touchStartX = e.touches[0].clientX
    mobileState.touchStartTime = Date.now()
    mobileState.isSwipingForSeek = false
    mobileState.isTouchLongPressed = false
    
    // 设置长按定时器
    mobileState.touchLongPressTimer = setTimeout(() => {
        if (player.value.playbackRate !== 2) {
            originalPlaybackRate.value = player.value.playbackRate
        }
        mobileState.isTouchLongPressed = true
        player.value.playbackRate = 2
        if (player.value.toast) {
            player.value.toast.close()
            setTimeout(() => {
                if (player.value && player.value.toast) {
                    player.value.toast.show('二倍速播放', 'right-bottom', 2000)
                }
            }, 100)
        }
        mobileState.touchLongPressTimer = null
    }, MOBILE_TOUCH_LONG_PRESS_DURATION)
}

const handleMobileTouchEnd = (e) => {
    if (!player.value || !isMobile.value) return
    
    if (mobileState.isTouchingControl) {
        mobileState.isTouchingControl = false
        // 不阻止事件传播，让NPlayer正常处理控制栏交互
        return
    }
    
    const touchEndX = e.changedTouches[0].clientX
    const touchDuration = Date.now() - mobileState.touchStartTime
    const swipeDistance = mobileState.touchStartX - touchEndX
    
    // 清除长按定时器
    if (mobileState.touchLongPressTimer) {
        clearTimeout(mobileState.touchLongPressTimer)
        mobileState.touchLongPressTimer = null
    }
    
    // 长按松开 - 恢复播放速度
    if (mobileState.isTouchLongPressed) {
        player.value.playbackRate = originalPlaybackRate.value
        mobileState.isTouchLongPressed = false
        // 重置手动更新标记
        mobileState.isManuallyUpdatingProgress = false
        
        // 清理 timeupdate 事件阻止器
        if (player.value.video && mobileState.timeUpdateBlocker) {
            player.value.video.removeEventListener('timeupdate', mobileState.timeUpdateBlocker, true)
            mobileState.timeUpdateBlocker = null
        }
        return // 长按状态下直接返回，不执行任何其他操作
    }
    
    // 检测滑动 - 调节进度（只有在非长按状态下才执行）
    if (Math.abs(swipeDistance) > MOBILE_TOUCH_SWIPE_THRESHOLD) {
        const seekSeconds = Math.round(Math.abs(swipeDistance) * 0.5)
        let targetTime
        
        if (swipeDistance < 0) {
            // 右滑 - 快进
            targetTime = Math.min(player.value.currentTime + seekSeconds, player.value.duration)
        } else {
            // 左滑 - 快退
            targetTime = Math.max(player.value.currentTime - seekSeconds, 0)
        }
        
        // 设置实际播放时间
        player.value.currentTime = targetTime
        
        // 手动触发时间更新事件，更新进度条和时间显示
        if (player.value.emit) {
            player.value.emit('TimeUpdate')
        }
        
        // 清除手动更新标记，恢复NPlayer自动更新
        mobileState.isManuallyUpdatingProgress = false
        
        // 移除 timeupdate 事件阻止器
        if (player.value.video && mobileState.timeUpdateBlocker) {
            player.value.video.removeEventListener('timeupdate', mobileState.timeUpdateBlocker, true)
            mobileState.timeUpdateBlocker = null
        }
        
        // 确保UI正确更新
        setTimeout(() => {
            try {
                const progressPlayed = player.value.el.querySelector('.nplayer_progress_played')
                const progressDot = player.value.el.querySelector('.nplayer_progress_dot')
                const timeCurrentDisplay = player.value.el.querySelector('.nplayer_control_time span:first-child')
                
                if (progressPlayed && player.value.duration > 0) {
                    const percentage = player.value.currentTime / player.value.duration
                    // 更新进度条填充 - 使用 scaleX 变换
                    progressPlayed.style.transform = `scaleX(${Math.max(0, Math.min(1, percentage))})`
                    
                    // 更新进度球位置
                    if (progressDot) {
                        const progressBars = player.value.el.querySelector('.nplayer_progress_bars')
                        if (progressBars) {
                            const barsWidth = progressBars.offsetWidth
                            const dotPosition = percentage * barsWidth
                            progressDot.style.transform = `translate(${Math.max(0, Math.min(barsWidth, dotPosition))}px, -50%)`
                        }
                    }
                }
                
                // 更新当前时间显示
                if (timeCurrentDisplay) {
                    const formatTime = (seconds) => {
                        const mins = Math.floor(seconds / 60)
                        const secs = Math.floor(seconds % 60)
                        // 匹配 NPlayer 的时间格式：分钟小于10时不显示前导零
                        return `${mins}:${secs.toString().padStart(2, '0')}`
                    }
                    timeCurrentDisplay.textContent = formatTime(player.value.currentTime)
                }
            } catch (e) {
                console.warn('进度条最终更新失败:', e)
            }
        }, 50)
        
        // 重置双击计时器
        mobileState.lastTapTime = 0
        if (mobileState.doubleTapTimer) {
            clearTimeout(mobileState.doubleTapTimer)
            mobileState.doubleTapTimer = null
        }
        return
    }
    
    // 检测点击（只有在非长按且无滑动的情况下）
    if (touchDuration < 300 && Math.abs(swipeDistance) <= MOBILE_TOUCH_SWIPE_THRESHOLD) {
        const currentTime = Date.now()
        const timeSinceLastTap = currentTime - mobileState.lastTapTime
        
        if (timeSinceLastTap < MOBILE_DOUBLE_TAP_DELAY) {
            // 双击 - 暂停/播放
            mobileState.tapCount = 0
            mobileState.lastTapTime = 0
            if (mobileState.doubleTapTimer) {
                clearTimeout(mobileState.doubleTapTimer)
                mobileState.doubleTapTimer = null
            }
            player.value.toggle()
            if (player.value.toast) {
                player.value.toast.show(player.value.paused ? '暂停' : '播放', 'center', 800)
            }
        } else {
            // 单击 - 切换控制栏
            mobileState.tapCount = 1
            mobileState.lastTapTime = currentTime
            
            if (mobileState.doubleTapTimer) {
                clearTimeout(mobileState.doubleTapTimer)
            }
            mobileState.doubleTapTimer = setTimeout(() => {
                mobileState.tapCount = 0
                mobileState.lastTapTime = 0
                mobileState.doubleTapTimer = null
                
                // 切换控制栏显示/隐藏
                if (player.value && player.value.control) {
                    const control = player.value.control
                    if (control.isActive) {
                        control.hide()
                    } else {
                        // 使用 show() 而不是 showTransient()，避免自动隐藏
                        control.show()
                    }
                }
            }, MOBILE_DOUBLE_TAP_DELAY)
        }
    }
}

const handleMobileTouchMove = (e) => {
    if (!player.value || !isMobile.value) return
    
    if (mobileState.isTouchingControl) {
        // 不阻止事件传播，让NPlayer正常处理控制栏交互
        return
    }
    
    const currentX = e.touches[0].clientX
    const swipeDistance = mobileState.touchStartX - currentX
    
    // 如果有滑动，清除长按定时器
    if (mobileState.touchLongPressTimer && Math.abs(swipeDistance) > 10) {
        clearTimeout(mobileState.touchLongPressTimer)
        mobileState.touchLongPressTimer = null
    }
    
    // 只有在非长按状态下才显示滑动提示和实时更新进度
    if (!mobileState.isTouchLongPressed && Math.abs(swipeDistance) > MOBILE_TOUCH_SWIPE_THRESHOLD) {
        const seekSeconds = Math.round(Math.abs(swipeDistance) * 0.5)
        const direction = swipeDistance < 0 ? '快进' : '快退'
        const message = `${direction} ${seekSeconds} 秒`
        
        // 设置手动更新标记，防止NPlayer自动更新进度条
        mobileState.isManuallyUpdatingProgress = true
        
        // 暂时阻止原生视频的 timeupdate 事件传播
        if (player.value.video && !mobileState.timeUpdateBlocker) {
            mobileState.timeUpdateBlocker = (e) => {
                if (mobileState.isManuallyUpdatingProgress) {
                    e.stopImmediatePropagation()
                }
            }
            // 在捕获阶段拦截事件
            player.value.video.addEventListener('timeupdate', mobileState.timeUpdateBlocker, true)
        }
        
        // 计算预览时间
        let previewTime
        if (swipeDistance < 0) {
            // 右滑 - 快进
            previewTime = Math.min(player.value.currentTime + seekSeconds, player.value.duration)
        } else {
            // 左滑 - 快退
            previewTime = Math.max(player.value.currentTime - seekSeconds, 0)
        }
        
        // 实时更新进度条显示（不改变实际播放时间）
        try {
            // 使用正确的NPlayer CSS类名
            const progressPlayed = player.value.el.querySelector('.nplayer_progress_played')
            const progressDot = player.value.el.querySelector('.nplayer_progress_dot')
            const timeCurrentDisplay = player.value.el.querySelector('.nplayer_control_time span:first-child')
            
            if (progressPlayed && player.value.duration > 0) {
                const percentage = previewTime / player.value.duration
                // 更新进度条填充 - 使用 scaleX 变换（NPlayer的方式）
                progressPlayed.style.transform = `scaleX(${Math.max(0, Math.min(1, percentage))})`
                
                // 更新进度球位置 - 计算像素位置
                if (progressDot) {
                    const progressBars = player.value.el.querySelector('.nplayer_progress_bars')
                    if (progressBars) {
                        const barsWidth = progressBars.offsetWidth
                        const dotPosition = percentage * barsWidth
                        progressDot.style.transform = `translate(${Math.max(0, Math.min(barsWidth, dotPosition))}px, -50%)`
                    }
                }
            }
            
            // 更新当前时间显示
            if (timeCurrentDisplay) {
                const formatTime = (seconds) => {
                    const mins = Math.floor(seconds / 60)
                    const secs = Math.floor(seconds % 60)
                    // 匹配 NPlayer 的时间格式：分钟小于10时不显示前导零
                    return `${mins}:${secs.toString().padStart(2, '0')}`
                }
                timeCurrentDisplay.textContent = formatTime(previewTime)
            }
        } catch (e) {
            // 忽略DOM操作错误
            console.warn('进度条更新失败:', e)
        }
        
        try {
            if (player.value.toast) {
                player.value.toast.show(message, 'center', 2000)
            }
        } catch (e) {
            // 忽略创建 toast 的错误
        }
    }
}

// 初始化移动端控制
const initMobileControls = () => {
    if (!isMobile.value || !player.value || !player.value.el) return
    
    // 完全禁用NPlayer的自动控制栏管理
    const playerEl = player.value.el
    
    // 移除所有可能导致控制栏自动隐藏的事件监听器
    if (player.value.control) {
        const control = player.value.control
        
        // 移除自动隐藏相关的事件监听器
        playerEl.removeEventListener('mousemove', control.showTransient)
        playerEl.removeEventListener('mouseleave', control.tryHide)
        playerEl.removeEventListener('mouseenter', control.show)
        
        // 移除视频元素上的事件监听器
        const videoElement = playerEl.querySelector('video') || playerEl.querySelector('.nplayer-video')
        if (videoElement) {
            videoElement.removeEventListener('mousemove', control.showTransient)
            videoElement.removeEventListener('mouseleave', control.tryHide)
            videoElement.removeEventListener('mouseenter', control.show)
        }
        
        // 禁用控制栏的自动隐藏定时器
        if (control._hideTimer) {
            clearTimeout(control._hideTimer)
            control._hideTimer = null
        }
        
        // 备份并重写 tryHide 方法
        if (!control._originalTryHide) {
            control._originalTryHide = control.tryHide
        }
        control.tryHide = function() {
            // 在移动端不执行自动隐藏
            if (isMobile.value) {
                return
            }
            return control._originalTryHide.call(this)
        }
        
        // 备份并重写 showTransient 方法
        if (!control._originalShowTransient) {
            control._originalShowTransient = control.showTransient
        }
        control.showTransient = function() {
            if (isMobile.value) {
                return this.show()
            }
            return control._originalShowTransient.call(this)
        }
    }
    
    // 禁用NPlayer的默认点击暂停功能
    if (player.value.disableClickPause) {
        player.value.disableClickPause()
    }
    
    // 添加移动端触摸事件
    playerEl.addEventListener('touchstart', handleMobileTouchStart, { passive: true })
    playerEl.addEventListener('touchmove', handleMobileTouchMove, { passive: false })
    playerEl.addEventListener('touchend', handleMobileTouchEnd, { passive: true })
}

// 清理移动端控制
const cleanupMobileControls = () => {
    if (!player.value || !player.value.el) return
    
    const playerEl = player.value.el
    playerEl.removeEventListener('touchstart', handleMobileTouchStart)
    playerEl.removeEventListener('touchmove', handleMobileTouchMove)
    playerEl.removeEventListener('touchend', handleMobileTouchEnd)
    
    // 恢复NPlayer的原始控制栏方法
    if (player.value.control) {
        const control = player.value.control
        
        // 恢复原始方法（如果有备份的话）
        if (control._originalTryHide) {
            control.tryHide = control._originalTryHide
        }
        if (control._originalShowTransient) {
            control.showTransient = control._originalShowTransient
        }
    }
    
    // 清理定时器
    if (mobileState.touchLongPressTimer) {
        clearTimeout(mobileState.touchLongPressTimer)
        mobileState.touchLongPressTimer = null
    }
    if (mobileState.doubleTapTimer) {
        clearTimeout(mobileState.doubleTapTimer)
        mobileState.doubleTapTimer = null
    }
}

// ============ 电脑端鼠标控制系统 ============

// 电脑端状态（简化）
let desktopState = {
    clickTimer: null,
    clickCount: 0
}

// 电脑端点击事件处理（支持单击播放暂停和双击全屏）
const handleDesktopClick = (e) => {
    if (!player.value || isMobile.value) return
    
    // 检查点击的不是控制栏
    const isControlClick = e.target.closest('.nplayer_control') || 
                         e.target.closest('.nplayer_progress') ||
                         e.target.closest('[data-nplayer]')
    
    if (isControlClick) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // 增加点击计数
    desktopState.clickCount++
    
    // 清除之前的定时器
    if (desktopState.clickTimer) {
        clearTimeout(desktopState.clickTimer)
    }
    
    // 设置延迟执行，区分单击和双击
    desktopState.clickTimer = setTimeout(() => {
        if (desktopState.clickCount === 1) {
            // 单击 - 播放/暂停
            player.value.toggle()
        } else if (desktopState.clickCount === 2) {
            // 双击 - 全屏
            if (player.value.fullscreen) {
                if (document.fullscreenElement) {
                    player.value.exitFullscreen()
                } else {
                    player.value.enterFullscreen()
                }
            }
        }
        
        // 重置点击计数
        desktopState.clickCount = 0
        desktopState.clickTimer = null
    }, 300) // 300ms 延迟来区分单击和双击
}

// 初始化电脑端控制
const initDesktopControls = () => {
    if (isMobile.value || !player.value || !player.value.el) return
    
    const playerEl = player.value.el
    
    // 禁用NPlayer的默认点击暂停功能
    if (player.value.disableClickPause) {
        player.value.disableClickPause()
    }
    
    // 添加自定义点击事件处理器（支持单击播放暂停和双击全屏）
    playerEl.addEventListener('click', handleDesktopClick, true)
    
    // 添加控制栏鼠标悬停事件
    if (player.value.control && player.value.control.el) {
        const controlElement = player.value.control.el
        controlElement.addEventListener('mouseenter', lockControlBar)
        controlElement.addEventListener('mouseleave', unlockControlBar)
    }
    
    // 添加键盘快捷键
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)
}

// 清理电脑端控制
const cleanupDesktopControls = () => {
    if (!player.value || !player.value.el) return
    
    const playerEl = player.value.el
    playerEl.removeEventListener('click', handleDesktopClick, true)
    
    // 清理键盘事件
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('keyup', handleKeyUp, true)
    
    // 清理点击定时器
    if (desktopState.clickTimer) {
        clearTimeout(desktopState.clickTimer)
        desktopState.clickTimer = null
        desktopState.clickCount = 0
    }
}

// 处理右箭头键按下
const handleRightArrowDown = (e) => {
    if (!player.value || e.keyCode !== 39) return
    if (isRightArrowPressed) return
    
    isRightArrowPressed = true
    e.preventDefault()
    e.stopPropagation()
    
    // 保存原始播放速度（只在非二倍速时保存）
    if (player.value.playbackRate !== 2) {
        originalPlaybackRate.value = player.value.playbackRate
    }
    
    // 设置长按定时器，500ms后触发二倍速
    rightArrowPressTimer = setTimeout(() => {
        isRightArrowLongPressed = true
        player.value.playbackRate = 2
        if (player.value.toast) {
            // 先关闭所有现有的 toast
            player.value.toast.close()
            // 延迟一小段时间后显示新的 toast，确保 DOM 清理完成
            setTimeout(() => {
                if (player.value && player.value.toast) {
                    player.value.toast.show('二倍速播放', 'right-bottom', 2000)
                }
            }, 100)
        }
        rightArrowPressTimer = null
    }, 500)
}

// 处理右箭头键松开
const handleRightArrowUp = (e) => {
    if (!player.value || e.keyCode !== 39) return
    if (!isRightArrowPressed) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // 重置按键状态
    isRightArrowPressed = false
    
    // 如果是长按状态（已触发二倍速）
    if (isRightArrowLongPressed) {
        // 恢复原始播放速度
        isRightArrowLongPressed = false
        player.value.playbackRate = originalPlaybackRate.value
        // 清理定时器（如果还存在）
        if (rightArrowPressTimer !== null) {
            clearTimeout(rightArrowPressTimer)
            rightArrowPressTimer = null
        }
    } else if (rightArrowPressTimer !== null) {
        // 短按（定时器还在，未触发长按）
        clearTimeout(rightArrowPressTimer)
        rightArrowPressTimer = null
        // 快进10秒
        const targetTime = Math.min(player.value.currentTime + 10, player.value.duration)
        // 手动显示 loading 动画
        if (player.value.loading) {
            player.value.loading.show()
        }
        // 设置目标时间
        player.value.currentTime = targetTime
        // 立即手动触发 TIME_UPDATE 事件，更新进度条显示
        player.value.emit('TimeUpdate')
        // 显示控制栏
        if (player.value.control) {
            player.value.control.showTransient()
        }
        if (player.value.toast) {
            player.value.toast.show('快进 10 秒', 'center', 1000)
        }
    }
}

// 处理左箭头键（快退10秒）
const handleLeftArrow = (e) => {
    if (!player.value || e.keyCode !== 37) return
    e.preventDefault()
    e.stopPropagation()
    // 快退10秒
    const targetTime = Math.max(player.value.currentTime - 10, 0)
    // 手动显示 loading 动画
    if (player.value.loading) {
        player.value.loading.show()
    }
    // 设置目标时间
    player.value.currentTime = targetTime
    // 立即手动触发 TIME_UPDATE 事件，更新进度条显示
    player.value.emit('TimeUpdate')
    // 显示控制栏
    if (player.value.control) {
        player.value.control.showTransient()
    }
    if (player.value.toast) {
        player.value.toast.show('快退 10 秒', 'center', 1000)
    }
}

// 处理空格键（暂停/播放）
const handleSpaceBar = (e) => {
    if (!player.value || e.keyCode !== 32) return
    e.preventDefault()
    e.stopPropagation()
    player.value.toggle()
}

// 全局键盘事件处理
const handleKeyDown = (e) => {
    switch (e.keyCode) {
        case 32: // 空格
            handleSpaceBar(e)
            break
        case 37: // 左箭头
            handleLeftArrow(e)
            break
        case 39: // 右箭头
            handleRightArrowDown(e)
            break
    }
}

const handleKeyUp = (e) => {
    if (e.keyCode === 39) { // 右箭头
        handleRightArrowUp(e)
    }
}



// 检测是否为移动设备
const checkMobile = () => {
    isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
}

// 调整播放器大小的函数
const startResize = (e) => {
    if (isMobile.value) return
    
    e.preventDefault()
    isResizing.value = true
    
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = playerWidth.value
    const startHeight = playerHeight.value
    
    const onMouseMove = (moveEvent) => {
        if (!isResizing.value) return
        
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY
        
        // 计算新尺寸，设置最小和最大限制
        const newWidth = Math.max(600, Math.min(window.innerWidth - 40, startWidth + deltaX))
        const newHeight = Math.max(300, Math.min(window.innerHeight - 200, startHeight + deltaY))
        
        playerWidth.value = newWidth
        playerHeight.value = newHeight
    }
    
    const onMouseUp = () => {
        isResizing.value = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
    }
    
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'nwse-resize'
    document.body.style.userSelect = 'none'
}

// 保存播放时间到 localStorage
const savePlayerTime = () => {
    if (player.value && player.value.currentTime) {
        const currentTime = player.value.currentTime
        searchStore.setPlayerCurrentTime(currentTime)
        
        // 直接写入 localStorage，确保保存
        try {
            const storeData = JSON.parse(localStorage.getItem('search') || '{}')
            storeData.playerCurrentTime = currentTime
            localStorage.setItem('search', JSON.stringify(storeData))
        } catch (e) {
            console.error('保存失败:', e)
        }
    }
}

// 复制播放链接
const copyPlayUrl = async () => {
    if (!searchStore.currentPlayUrl) {
        if (player.value && player.value.toast) {
            player.value.toast.show('无播放链接可复制', 'center', 2000)
        }
        return
    }
    
    try {
        await navigator.clipboard.writeText(searchStore.currentPlayUrl)
        if (player.value && player.value.toast) {
            player.value.toast.show('播放链接已复制到剪贴板', 'center', 2000)
        }
    } catch (err) {
        // 如果 Clipboard API 不可用，使用传统方法
        try {
            const textArea = document.createElement('textarea')
            textArea.value = searchStore.currentPlayUrl
            textArea.style.position = 'fixed'
            textArea.style.left = '-999999px'
            textArea.style.top = '-999999px'
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            
            if (player.value && player.value.toast) {
                player.value.toast.show('播放链接已复制到剪贴板', 'center', 2000)
            }
        } catch (fallbackErr) {
            console.error('复制失败:', fallbackErr)
            if (player.value && player.value.toast) {
                player.value.toast.show('复制失败，请手动复制', 'center', 2000)
            }
        }
    }
}


onMounted(async () => {
    // 检测设备类型
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // 监听页面刷新/关闭事件，保存播放时间
    window.addEventListener('beforeunload', savePlayerTime)
    window.addEventListener('pagehide', savePlayerTime) // iOS Safari 支持

    const addControl = {
        el: document.querySelector('.add'),
        tip: '加0.5秒',
    }
    const timeControl = {
        el: document.querySelector('.danmakuTime'),
    }
    const minusControl = {
        el: document.querySelector('.minus'),
        tip: '减0.5秒',
    }

    // 准备弹幕数据
    let danmakuItems = []
    if (searchStore.currentDanmaku && searchStore.currentDanmaku.length > 0) {
        // currentDanmaku 已经是应用过偏移的弹幕，直接使用
        danmakuItems = JSON.parse(JSON.stringify(searchStore.currentDanmaku))
    } else if (searchStore.danmaku && searchStore.danmaku.length > 0) {
        // 如果没有 currentDanmaku，使用原始弹幕并应用偏移
        danmakuItems = JSON.parse(JSON.stringify(searchStore.danmaku))
        if (searchStore.danmakuTimeOffset !== 0) {
            danmakuItems.forEach(item => {
                item.time += searchStore.danmakuTimeOffset
            })
        }
    }
    
    player.value = new NPlayer({
        //参数
        controls: [
            ['play', 'volume', 'time', 'spacer', minusControl, timeControl, addControl, 'danmaku-settings', 'airplay', 'settings', 'web-fullscreen', 'fullscreen'],
            ['progress'],
        ],
        plugins: [
            new Danmaku({
                items: danmakuItems,
                persistOptions: true,
                autoInsert: false,
            }),
        ],
        // 音量控制条配置
        volumeVertical: true,  // 设置为垂直方向
        volumeBarLength: 60,   // 缩小宽度为60px
        shortcut: false,  // 禁用默认快捷键（我们使用自定义快捷键）
        isTouch: false,  // 完全禁用 NPlayer 的触摸交互，使用我们的自定义逻辑
    });
    const hls = new Hls({
        // 启用 Worker 提升性能
        enableWorker: true,
        // 减小初始缓冲长度，加快首帧显示
        maxBufferLength: 15,
        maxMaxBufferLength: 30,
        // 自动选择最优质量
        startLevel: -1,
        // 快速切换质量
        abrEwmaDefaultEstimate: 500000,
        // 快速启动配置
        liveSyncDuration: 2,
        liveMaxLatencyDuration: 5,
        // 更激进的碎片加载
        maxBufferHole: 0.5,
        // 快速重试
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
    })
    hls.attachMedia(player.value.video)
    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        const playUrl = getPlayUrl()
        if (playUrl) {
            hls.loadSource(playUrl)
        }
    })
    
    // 监听HLS加载完成事件
    hls.on(Hls.Events.MANIFEST_PARSED, function () {
        // 视频加载完成后，恢复播放状态（只在首次加载时恢复）
        setTimeout(() => {
            if (hasRestoredTime.value) {
                return
            }
            
            const savedTime = searchStore.playerCurrentTime
            const currentUrl = getPlayUrl()
            const savedUrl = searchStore.currentPlayUrl
            
            // 检查是否是同一个视频
            const isSameVideo = currentUrl === savedUrl
            
            if (isSameVideo && savedTime > 0) {
                player.value.currentTime = savedTime
                hasRestoredTime.value = true
            } else {
                hasRestoredTime.value = true
            }
        }, 1000)
    })
    
    // 监听视频可以播放事件
    player.value.video.addEventListener('canplay', function() {
        // 只在首次加载且还没恢复过时才恢复播放时间
        if (!hasRestoredTime.value && searchStore.playerCurrentTime > 0 && Math.abs(player.value.currentTime - searchStore.playerCurrentTime) > 1) {
            player.value.currentTime = searchStore.playerCurrentTime
            hasRestoredTime.value = true
        }
    })
    
    
    // 监听视频错误事件
    player.value.video.addEventListener('error', function(e) {
        console.error('视频播放错误:', e)
    })

    player.value.mount(document.querySelector('.mv'));
    
    // ============ 初始化设备特定的控制系统 ============
    
    // 延迟初始化控制系统，确保播放器完全加载
    setTimeout(() => {
        if (isMobile.value) {
            initMobileControls()
        } else {
            initDesktopControls()
        }
    }, 1000)
    
    // 初始化完成后恢复播放状态
    initPlayerState()
    
    // 恢复弹幕不透明度设置（修复 @nplayer/danmaku 的 bug）
    setTimeout(() => {
        try {
            const storageKey = 'nplayer:danmaku'
            const storedSettings = JSON.parse(localStorage.getItem(storageKey) || '{}')
            if (storedSettings.opacity !== undefined && player.value.danmaku) {
                player.value.danmaku.el.style.opacity = String(storedSettings.opacity)
                player.value.danmaku.opts.opacity = storedSettings.opacity
            }
        } catch (e) {
            console.warn('弹幕不透明度恢复失败:', e)
        }
    }, 100)
    
    
    // 添加播放器事件监听来保存状态（使用 NPlayer 的大驼峰事件名）
    player.value.on('VolumeChange', () => {
        searchStore.setPlayerVolume(player.value.volume)
        searchStore.setPlayerMuted(player.value.muted)
    })
    
    player.value.on('RateChange', () => {
        searchStore.setPlayerSpeed(player.value.playbackRate)
    })
    
    // 监听弹幕设置更新事件，手动修复不透明度存储问题
    player.value.on('DanmakuUpdateOptions', (opts) => {
        // 手动修复不透明度存储问题
        const currentOpacity = parseFloat(player.value.danmaku.el.style.opacity) || 1
        if (currentOpacity !== opts.opacity) {
            // 更新配置对象中的不透明度值
            player.value.danmaku.opts.opacity = currentOpacity
            // 手动存储到 localStorage
            try {
                const storageKey = 'nplayer:danmaku'
                const currentStorage = JSON.parse(localStorage.getItem(storageKey) || '{}')
                currentStorage.opacity = currentOpacity
                localStorage.setItem(storageKey, JSON.stringify(currentStorage))
            } catch (e) {
                console.warn('弹幕设置存储失败:', e)
            }
        }
    })
    
    // 监听播放时间更新
    let lastSaveTime = 0
    
    player.value.on('TimeUpdate', () => {
        const currentTime = player.value.currentTime
        
        // 节流：每秒保存一次
        const currentSecond = Math.floor(currentTime)
        if (currentSecond !== lastSaveTime) {
            searchStore.setPlayerCurrentTime(currentTime)
            lastSaveTime = currentSecond
        }
    })
    
    player.value.on('LoadedMetadata', () => {
        searchStore.setPlayerDuration(player.value.duration)
    })
    
    // 恢复播放器状态
    if (searchStore.playerVolume !== undefined) {
        player.value.volume = searchStore.playerVolume
    }
    if (searchStore.playerMuted !== undefined) {
        player.value.muted = searchStore.playerMuted
    }
    if (searchStore.playerSpeed !== undefined) {
        player.value.playbackRate = searchStore.playerSpeed
    }
    
    // ============ 注册自定义快捷键和触摸事件 ============
    
    // 禁用右键菜单 - 同时禁用播放器和其容器的右键菜单
    if (player.value.contextmenu) {
        player.value.contextmenu.hide()
    }
    
    // 监听进度条拖动事件，防止控制栏自动隐藏
    const progressElement = player.value.el.querySelector('.nplayer_progress')
    if (progressElement) {
        // 使用 pointerdown/pointerup 监听拖动状态
        progressElement.addEventListener('pointerdown', () => {
            // 拖动开始时，锁定控制栏显示
            if (player.value.control) {
                player.value.control.require()
            }
        }, true)
        
        progressElement.addEventListener('pointerup', () => {
            // 拖动结束时，释放锁定
            if (player.value.control) {
                player.value.control.release()
            }
        }, true)
        
        progressElement.addEventListener('pointercancel', () => {
            // 拖动取消时，释放锁定
            if (player.value.control) {
                player.value.control.release()
            }
        }, true)
    }
    
    // 禁用播放器元素的右键菜单
    if (player.value.el) {
        contextMenuHandler = (e) => {
            e.preventDefault()
            e.stopPropagation()
            if (player.value.contextmenu) {
                player.value.contextmenu.hide()
            }
        }
        player.value.el.addEventListener('contextmenu', contextMenuHandler, true)
        player.value.container.addEventListener('contextmenu', contextMenuHandler, true)
    }
    

    
    // ============ 自定义网页全屏功能 ============
    
    // 创建自定义网页全屏功能
    const createCustomWebFullscreen = () => {
        let isWebFullscreen = false
        let originalStyles = {}
        let originalViewport = null
        
        const enterWebFullscreen = () => {
            if (isWebFullscreen) return
            
            const playerContainer = player.value.el.closest('.player-card') || player.value.el.parentElement
            if (!playerContainer) {
                console.warn('无法找到播放器容器元素')
                return
            }
            
            // 保存原始视口设置
            const viewport = document.querySelector('meta[name="viewport"]')
            if (viewport) {
                originalViewport = viewport.getAttribute('content')
            }
            
            // 保存原始样式
            originalStyles = {
                body: {
                    overflow: document.body.style.overflow,
                    margin: document.body.style.margin,
                    padding: document.body.style.padding,
                },
                html: {
                    overflow: document.documentElement.style.overflow,
                },
                container: {
                    position: playerContainer.style.position,
                    zIndex: playerContainer.style.zIndex,
                    top: playerContainer.style.top,
                    left: playerContainer.style.left,
                    width: playerContainer.style.width,
                    height: playerContainer.style.height,
                    backgroundColor: playerContainer.style.backgroundColor,
                    borderRadius: playerContainer.style.borderRadius,
                }
            }
            
            // 应用全屏样式
            document.body.style.overflow = 'hidden'
            document.body.style.margin = '0'
            document.body.style.padding = '0'
            document.documentElement.style.overflow = 'hidden'
            
            // 移动端额外优化
            if (isMobile.value) {
                // 隐藏地址栏（在支持的浏览器中）
                window.scrollTo(0, 1)
                setTimeout(() => window.scrollTo(0, 0), 100)
                
                // 防止页面缩放
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
                }
            }
            
            playerContainer.style.position = 'fixed'
            playerContainer.style.zIndex = '9999'
            playerContainer.style.top = '0'
            playerContainer.style.left = '0'
            playerContainer.style.width = '100vw'
            playerContainer.style.height = '100vh'
            playerContainer.style.backgroundColor = '#000'
            playerContainer.style.borderRadius = '0'
            
            // 添加全屏类
            playerContainer.classList.add('custom-web-fullscreen')
            
            isWebFullscreen = true
            
            if (player.value && player.value.toast) {
                player.value.toast.show('网页全屏已启用，按 ESC 键退出', 'center', 2000)
            }
            
            // 触发 NPlayer 的 resize 事件以确保播放器正确适应新尺寸
            setTimeout(() => {
                if (player.value && player.value.resize) {
                    player.value.resize()
                }
            }, 100)
        }
        
        const exitWebFullscreen = () => {
            if (!isWebFullscreen) return
            
            const playerContainer = player.value.el.closest('.player-card') || player.value.el.parentElement
            if (!playerContainer) {
                console.warn('无法找到播放器容器元素')
                return
            }
            
            // 恢复原始样式
            document.body.style.overflow = originalStyles.body.overflow || ''
            document.body.style.margin = originalStyles.body.margin || ''
            document.body.style.padding = originalStyles.body.padding || ''
            document.documentElement.style.overflow = originalStyles.html.overflow || ''
            
            // 移动端恢复视口设置
            if (isMobile.value) {
                const viewport = document.querySelector('meta[name="viewport"]')
                if (viewport && originalViewport) {
                    viewport.setAttribute('content', originalViewport)
                }
            }
            
            playerContainer.style.position = originalStyles.container.position || ''
            playerContainer.style.zIndex = originalStyles.container.zIndex || ''
            playerContainer.style.top = originalStyles.container.top || ''
            playerContainer.style.left = originalStyles.container.left || ''
            playerContainer.style.width = originalStyles.container.width || ''
            playerContainer.style.height = originalStyles.container.height || ''
            playerContainer.style.backgroundColor = originalStyles.container.backgroundColor || ''
            playerContainer.style.borderRadius = originalStyles.container.borderRadius || ''
            
            // 移除全屏类
            playerContainer.classList.remove('custom-web-fullscreen')
            
            isWebFullscreen = false
            
            if (player.value && player.value.toast) {
                player.value.toast.show('已退出网页全屏', 'center', 1000)
            }
            
            // 触发 NPlayer 的 resize 事件以确保播放器正确适应新尺寸
            setTimeout(() => {
                if (player.value && player.value.resize) {
                    player.value.resize()
                }
            }, 100)
        }
        
        return { enterWebFullscreen, exitWebFullscreen, isWebFullscreen: () => isWebFullscreen }
    }
    
    const customWebFullscreen = createCustomWebFullscreen()
    
    // 延迟重写 NPlayer 的 web 全屏方法，确保播放器完全初始化
    setTimeout(() => {
        if (player.value) {
            // 重写 NPlayer 的 web 全屏方法
            if (player.value.webEnterFullscreen) {
                player.value.webEnterFullscreen = customWebFullscreen.enterWebFullscreen
            }
            
            if (player.value.webExitFullscreen) {
                player.value.webExitFullscreen = customWebFullscreen.exitWebFullscreen
            }
            
            // 也可以通过监听 web-fullscreen 按钮点击事件来触发自定义全屏
            const webFullscreenBtn = player.value.el.querySelector('[data-nplayer="web-fullscreen"]')
            if (webFullscreenBtn) {
                webFullscreenBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (customWebFullscreen.isWebFullscreen()) {
                        customWebFullscreen.exitWebFullscreen()
                    } else {
                        customWebFullscreen.enterWebFullscreen()
                    }
                })
            }
            
            // 也监听 NPlayer 的内置 web 全屏事件
            player.value.on('WebEnterFullscreen', () => {
                if (!customWebFullscreen.isWebFullscreen()) {
                    customWebFullscreen.enterWebFullscreen()
                }
            })
            
            player.value.on('WebExitFullscreen', () => {
                if (customWebFullscreen.isWebFullscreen()) {
                    customWebFullscreen.exitWebFullscreen()
                }
            })
        }
    }, 1500)
    
    // 监听 ESC 键退出全屏
    const handleEscKey = (e) => {
        if (e.key === 'Escape' && customWebFullscreen.isWebFullscreen()) {
            customWebFullscreen.exitWebFullscreen()
        }
    }
    
    document.addEventListener('keydown', handleEscKey)
})

// 清理事件监听
onBeforeUnmount(() => {
    if (player.value && player.value.control) {
        player.value.control.release()
    }
    
    window.removeEventListener('resize', checkMobile)
    window.removeEventListener('beforeunload', savePlayerTime)
    window.removeEventListener('pagehide', savePlayerTime)
    
    // 根据设备类型清理对应的控制系统
    if (isMobile.value) {
        cleanupMobileControls()
    } else {
        cleanupDesktopControls()
    }
    
    // 清理自定义网页全屏的键盘事件监听
    document.removeEventListener('keydown', handleEscKey)
    
    // 清理右键菜单事件
    if (player.value && player.value.el && contextMenuHandler) {
        player.value.el.removeEventListener('contextmenu', contextMenuHandler, true)
        if (player.value.container) {
            player.value.container.removeEventListener('contextmenu', contextMenuHandler, true)
        }
        contextMenuHandler = null
    }
    
    // 清理快捷键定时器
    if (rightArrowPressTimer) {
        clearTimeout(rightArrowPressTimer)
        rightArrowPressTimer = null
    }
    
    // 页面卸载前强制保存当前播放时间
    savePlayerTime()
})

// 当页面被激活时（从其他页面切回），重新检查播放状态
onActivated(() => {
    if (player.value) {
        const playUrl = getPlayUrl()
        if (playUrl) {
            // 检查当前播放的视频是否与保存的链接一致
            const currentSrc = player.value.video.src
            if (!currentSrc || currentSrc !== playUrl) {
                // 如果播放链接不同，重新加载
                const hls = player.value.video.hls
                if (hls) {
                    hls.loadSource(playUrl)
                }
            }
        }
        
        // 延迟初始化播放状态，避免与弹幕加载冲突
        setTimeout(() => {
            if (player.value && player.value.danmaku) {
                // 重新初始化播放状态
                initPlayerState()
            }
        }, 500)
    }
})

</script>

<template>
    <!-- 右侧弹幕设置抽屉 -->
    <v-navigation-drawer 
        location="right" 
        v-model="naviIsShow" 
        temporary
        width="320"
        class="danmaku-drawer"
    >
        <div class="drawer-header">
            <h3 class="drawer-title">弹幕设置</h3>
            <p class="drawer-subtitle">调整弹幕参数</p>
        </div>
        <v-divider class="drawer-divider"></v-divider>
        <div class="drawer-content">
            <getDanmakuVue></getDanmakuVue>
        </div>
    </v-navigation-drawer>

    <v-main class="player-main">
        <v-container fluid class="player-container">
            <!-- 播放器区域 -->
            <div class="player-section" :style="!isMobile ? { maxWidth: playerWidth + 'px' } : {}">
                <v-card class="player-card" elevation="8" :style="{ position: 'relative' }">
                    <div class="player-wrapper">
                        <div class="mv" :style="!isMobile ? { height: playerHeight + 'px' } : {}"></div>
                    </div>
                    
                    <!-- 弹幕时间轴控制栏 -->
                    <div 
                        class="danmaku-controls" 
                        :style="{ position: 'relative' }"
                    >
                        <!-- 拖动调整大小的手柄（仅桌面端显示，放在右上角） -->
                        <div 
                            v-if="!isMobile" 
                            class="resize-handle" 
                            @mousedown="startResize"
                            :class="{ 'resizing': isResizing }"
                        >
                            <v-icon size="20" color="white">mdi-resize-bottom-right</v-icon>
                        </div>
                        
                        <v-card-text class="controls-content">
                            <div class="controls-header">
                                <v-icon color="primary" class="mr-2">mdi-tune</v-icon>
                                <span class="controls-title">弹幕时间调节</span>
                            </div>
                            
                            <div class="controls-buttons">
                                <v-btn 
                                    density="comfortable" 
                                    icon="mdi-minus" 
                                    class="control-btn minus" 
                                    variant="outlined"
                                    color="primary"
                                    @click="changeDanmakuTime(false)"
                                >
                                </v-btn>
                                
                                <div class="time-chip-wrapper">
                                    <v-text-field
                                        v-model.number="danmakuTime"
                                        class="time-chip danmakuTime no-spinner"
                                        variant="outlined"
                                        density="compact"
                                        type="number"
                                        step="0.1"
                                        suffix="秒"
                                        hide-details
                                        @blur="applyDanmakuTimeOffset(danmakuTime)"
                                        @keyup.enter="applyDanmakuTimeOffset(danmakuTime)"
                                    >
                                        <template v-slot:prepend-inner>
                                            <v-icon size="small" color="primary">mdi-clock-outline</v-icon>
                                        </template>
                                    </v-text-field>
                                </div>
                                
                                <v-btn 
                                    density="comfortable" 
                                    icon="mdi-plus" 
                                    class="control-btn add" 
                                    variant="outlined"
                                    color="primary"
                                    @click="changeDanmakuTime(true)"
                                >
                                </v-btn>
                            </div>
                            
                            <div class="controls-info">
                                <v-icon color="grey-lighten-1" size="small" class="mr-1">mdi-information-outline</v-icon>
                                <span class="info-text">调整弹幕与视频的同步时间</span>
                            </div>
                            
                            
                            <!-- 播放状态信息 -->
                            <div class="player-state-info mt-4">
                                <v-divider class="mb-3"></v-divider>
                                <div class="state-header">
                                    <v-icon color="primary" class="mr-2">mdi-information</v-icon>
                                    <span class="state-title">播放信息</span>
                                </div>
                                <div class="state-details">
                                    <div class="state-item" v-if="currentAnimeInfo">
                                        <span class="state-label">动漫名称:</span>
                                        <span class="state-value">{{ currentAnimeInfo.animeName }}</span>
                                    </div>
                                    <div class="state-item" v-if="currentAnimeInfo">
                                        <span class="state-label">当前集数:</span>
                                        <span class="state-value">{{ currentAnimeInfo.episodeName }}</span>
                                    </div>
                                    <div class="state-item">
                                        <span class="state-label">播放链接:</span>
                                        <div class="state-value-with-action">
                                            <span class="state-value">{{ searchStore.currentPlayUrl ? '已加载' : '未加载' }}</span>
                                            <v-btn 
                                                v-if="searchStore.currentPlayUrl"
                                                size="small" 
                                                variant="text" 
                                                color="primary"
                                                class="ml-2"
                                                @click="copyPlayUrl"
                                            >
                                                <v-icon size="16">mdi-content-copy</v-icon>
                                                <span class="ml-1">复制链接</span>
                                            </v-btn>
                                        </div>
                                    </div>
                                    <div class="state-item">
                                        <span class="state-label">弹幕数量:</span>
                                        <span class="state-value">{{ searchStore.currentDanmaku.length }} 条</span>
                                    </div>
                                </div>
                            </div>
                        </v-card-text>
                    </div>
                </v-card>
            </div>

        </v-container>
    </v-main>
</template>

<style scoped>
/* 主容器样式 */
.player-main {
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

.player-container {
  padding: 2rem 1rem;
  margin: 0 auto;
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

/* 播放器区域 */
.player-section {
  margin-bottom: 2rem;
  width: 100%;
  transition: max-width 0.1s ease-out;
}

.player-card {
  background: rgba(45, 45, 45, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px !important;
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

.player-wrapper {
  position: relative;
  width: 100%;
  padding: 0;
  user-select: none;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
}

.mv {
  background-color: #000000;
  width: 100%;
  height: 500px; /* 设置固定高度 */
  position: relative;
  overflow: auto;
  border-radius: 12px;
  margin: 0;
  transition: height 0.1s ease-out;
}

.mv :deep(video) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
}

.mv :deep(.nplayer) {
  width: 100% !important;
  height: 100% !important;
  border-radius: 12px;
  overflow: hidden;
}

.mv :deep(.nplayer .nplayer-video) {
  width: 100% !important;
  height: 100% !important;
  border-radius: 12px;
  overflow: hidden;
}

.mv :deep(.nplayer .nplayer-video video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain;
}

/* 修复移动端全屏时控制栏自动隐藏 */
.mv :deep(.nplayer_control-hide) {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 移动端触摸事件优化 */
.mv :deep(.nplayer) {
  touch-action: manipulation;
}

/* 弹幕控制栏 */
.danmaku-controls {
  background: rgba(30, 30, 30, 0.9);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0 0 16px 16px;
}

.controls-content {
  padding: 1rem 1.5rem;
}

.controls-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.controls-title {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 500;
}

.controls-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.control-btn {
  min-width: 40px;
  height: 40px;
  border-radius: 8px !important;
  transition: all 0.3s ease;
}

.control-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(100, 181, 246, 0.3);
}

.time-chip {
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
  height: 35px !important;
  font-size: 0.9rem !important;
  font-weight: 500 !important;
  border-radius: 8px !important;
  transform: translateY(-2px) !important; /* 向上移动5px */
}

/* 修改Vuetify输入框内部元素的高度 */
.time-chip :deep(.v-field) {
  min-height: 40px !important;
  height: 40px !important;
}

.time-chip :deep(.v-field__input) {
  min-height: 40px !important;
  height: 40px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.time-chip :deep(.v-input__control) {
  min-height: 40px !important;
  height: 40px !important;
}

.time-chip :deep(.v-field__field) {
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
}

/* 居中对齐后缀文字 "秒" */
.time-chip :deep(.v-field__suffix) {
  display: flex !important;
  align-items: center !important;
  height: 40px !important;
  line-height: 40px !important;
}

/* 居中对齐输入框内的文字 */
.time-chip :deep(input) {
  text-align: center !important;
  line-height: 40px !important;
  height: 40px !important;
}

/* 居中对齐输入框内的图标 */
.time-chip :deep(.v-field__prepend-inner) {
  display: flex !important;
  align-items: center !important;
  height: 40px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.time-chip :deep(.v-field__prepend-inner .v-icon) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* 更强的全局选择器 */
:deep(input::-webkit-outer-spin-button),
:deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none !important;
  margin: 0 !important;
  display: none !important;
}

:deep(input[type=number]) {
  -moz-appearance: textfield !important;
}

.time-chip-wrapper {
  display: flex;
  align-items: center;
}

.time-chip.danmakuTime .v-field {
  border-radius: 8px !important;
  background: transparent !important;
  min-height: 20px !important;
}

.time-chip.danmakuTime .v-field__field {
  text-align: center !important;
  font-weight: 500 !important;
}

.time-chip.danmakuTime .v-field__input {
  text-align: center !important;
  padding: 0 8px !important;
  font-size: 0.9rem !important;
  font-weight: 500 !important;
}

.time-chip.danmakuTime .v-field__outline {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.time-chip.danmakuTime:hover .v-field__outline {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px !important;
}

/* 强制覆盖 Vuetify 的默认样式 */
.danmaku-controls .time-chip.danmakuTime {
  width: 120px !important;
  min-width: 120px !important;
  max-width: 120px !important;
}

.danmaku-controls .time-chip.danmakuTime .v-input__control {
  min-height: 40px !important;
}

.danmaku-controls .time-chip.danmakuTime .v-field__input {
  min-height: 40px !important;
  line-height: 40px !important;
}

.controls-info {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b0b0b0;
  font-size: 0.8rem;
}

.info-text {
  color: #b0b0b0;
}


/* 弹幕设置抽屉 */
.danmaku-drawer {
  background: rgba(30, 30, 30, 0.95) !important;
  backdrop-filter: blur(20px);
}

.drawer-header {
  padding: 2rem 1.5rem 1rem;
  text-align: center;
}

.drawer-title {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 0.5rem;
}

.drawer-subtitle {
  color: #b0b0b0;
  font-size: 0.9rem;
  margin: 0;
}

.drawer-divider {
  border-color: rgba(255, 255, 255, 0.1);
  margin: 0 1rem;
}

.drawer-content {
  padding: 1rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .player-container {
    padding: 1.5rem 1rem;
    margin-top: 1.5rem;
  }
  
  .player-main {
    padding-bottom: 3.5rem; /* 为平板端底部导航栏留出空间 */
  }
  
}

@media (max-width: 768px) {
  .player-container {
    padding: 1rem 0.5rem;
    margin-top: 1rem;
  }
  
  .player-main {
    padding-bottom: 3rem; /* 为手机端底部导航栏留出空间 */
  }
  
  .player-card {
    margin-bottom: 1.5rem;
  }
  
  .mv {
    height: 300px;
  }
  
  /* 移动端强制控制栏隐藏样式 */
  .mv :deep(.nplayer_control-hide) {
    opacity: 0 !important;
    pointer-events: none !important;
    visibility: hidden !important;
  }
  
  .controls-content {
    padding: 0.75rem 1rem;
  }
  
  .controls-buttons {
    gap: 0.75rem;
  }
  
  .control-btn {
    min-width: 36px;
    height: 36px;
  }
  
  .time-chip {
    min-width: 90px !important;
    height: 36px !important;
    font-size: 0.85rem !important;
  }
  
  .danmaku-controls .time-chip.danmakuTime .v-field,
  .danmaku-controls .time-chip.danmakuTime .v-input__control {
    min-height: 36px !important;
  }
  
  .danmaku-drawer {
    width: 280px !important;
  }
  
  .drawer-header {
    padding: 1.5rem 1rem 0.5rem;
  }
  
  .drawer-title {
    font-size: 1.3rem;
  }
  
  .drawer-subtitle {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .player-container {
    padding: 0.75rem 0.25rem;
    margin-top: 0.75rem;
  }
  
  .mv {
    height: 250px;
  }
  
  /* 小屏幕移动端强制控制栏隐藏样式 */
  .mv :deep(.nplayer_control-hide) {
    opacity: 0 !important;
    pointer-events: none !important;
    visibility: hidden !important;
    transform: translateY(100%) !important;
  }
  
  .controls-content {
    padding: 0.5rem 0.75rem;
  }
  
  .controls-header {
    margin-bottom: 0.75rem;
  }
  
  .controls-title {
    font-size: 0.9rem;
  }
  
  .controls-buttons {
    gap: 0.5rem;
  }
  
  .control-btn {
    min-width: 32px;
    height: 32px;
  }
  
  .time-chip {
    min-width: 80px !important;
    height: 32px !important;
    font-size: 0.8rem !important;
  }
  
  .danmaku-controls .time-chip.danmakuTime .v-field,
  .danmaku-controls .time-chip.danmakuTime .v-input__control {
    min-height: 32px !important;
  }
  
  .controls-info {
    font-size: 0.75rem;
  }
  
  .danmaku-drawer {
    width: 260px !important;
  }
  
  .drawer-header {
    padding: 1rem 0.75rem 0.5rem;
  }
  
  .drawer-title {
    font-size: 1.2rem;
  }
  
  .drawer-subtitle {
    font-size: 0.75rem;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  .mv {
    height: 200px;
  }
  
  /* 超小屏幕强制控制栏隐藏样式 */
  .mv :deep(.nplayer_control-hide) {
    opacity: 0 !important;
    pointer-events: none !important;
    visibility: hidden !important;
    transform: translateY(100%) !important;
  }
  
  .controls-content {
    padding: 0.4rem 0.5rem;
  }
  
  .controls-buttons {
    gap: 0.25rem;
  }
  
  .control-btn {
    min-width: 28px;
    height: 28px;
  }
  
  .time-chip {
    min-width: 70px !important;
    height: 28px !important;
    font-size: 0.75rem !important;
  }
  
  .danmaku-controls .time-chip.danmakuTime .v-field,
  .danmaku-controls .time-chip.danmakuTime .v-input__control {
    min-height: 28px !important;
  }
  
  .danmaku-drawer {
    width: 240px !important;
  }
}

/* 播放状态信息样式 */
.player-state-info {
  background: rgba(40, 40, 40, 0.6);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.state-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.state-title {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 500;
}

.state-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.state-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.state-label {
  color: #b0b0b0;
  font-size: 0.85rem;
}

.state-value {
  color: #64b5f6;
  font-size: 0.85rem;
  font-weight: 500;
}

.state-value-with-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 调整大小手柄样式 */
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  cursor: nwse-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.resize-handle:hover {
  background: rgba(100, 181, 246, 0.8);
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(100, 181, 246, 0.5);
}

.resize-handle.resizing {
  background: rgba(100, 181, 246, 0.9);
  transform: scale(1.15);
  box-shadow: 0 0 20px rgba(100, 181, 246, 0.7);
}

.resize-handle:active {
  background: rgba(100, 181, 246, 1);
}

/* 拖动时禁用文本选择 */
body.resizing {
  user-select: none;
  cursor: nwse-resize !important;
}

/* 自定义网页全屏样式 */
.custom-web-fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  background: #000 !important;
  border-radius: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.custom-web-fullscreen .player-wrapper {
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}

.custom-web-fullscreen .mv {
  width: 100% !important;
  height: 100% !important;
  border-radius: 0 !important;
  margin: 0 !important;
}

.custom-web-fullscreen .mv :deep(.nplayer) {
  width: 100% !important;
  height: 100% !important;
  border-radius: 0 !important;
}

.custom-web-fullscreen .mv :deep(video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  border-radius: 0 !important;
}

/* 隐藏全屏模式下的弹幕控制栏 */
.custom-web-fullscreen .danmaku-controls {
  display: none !important;
}

/* 移动端全屏优化 */
@media (max-width: 768px) {
  .custom-web-fullscreen {
    /* 确保在移动端完全覆盖屏幕 */
    width: 100vw !important;
    height: 100vh !important;
    /* 防止滚动 */
    overflow: hidden !important;
  }
  
  .custom-web-fullscreen .mv :deep(.nplayer_control) {
    /* 移动端全屏时控制栏样式优化 */
    background: rgba(0, 0, 0, 0.8) !important;
  }
}

</style>