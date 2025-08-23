import { ref, onMounted, onUnmounted } from 'vue'

// 防抖混入
export function useDebounce(delay = 300) {
  const debouncedValue = ref('')
  let timeoutId = null

  const setDebouncedValue = (value) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      debouncedValue.value = value
    }, delay)
  }

  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })

  return {
    debouncedValue,
    setDebouncedValue
  }
}

// 节流混入
export function useThrottle(delay = 300) {
  const throttledValue = ref('')
  let lastCall = 0

  const setThrottledValue = (value) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      throttledValue.value = value
      lastCall = now
    }
  }

  return {
    throttledValue,
    setThrottledValue
  }
}

// 虚拟滚动混入
export function useVirtualScroll(itemHeight = 200, containerHeight = 600) {
  const scrollTop = ref(0)
  const containerRef = ref(null)
  const visibleItems = ref([])
  const totalHeight = ref(0)
  const startIndex = ref(0)
  const endIndex = ref(0)

  const updateVisibleItems = (items) => {
    if (!items || items.length === 0) {
      visibleItems.value = []
      return
    }

    totalHeight.value = items.length * itemHeight
    startIndex.value = Math.floor(scrollTop.value / itemHeight)
    endIndex.value = Math.min(
      startIndex.value + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    visibleItems.value = items.slice(startIndex.value, endIndex.value)
  }

  const handleScroll = (event) => {
    scrollTop.value = event.target.scrollTop
    // 这里需要传入items参数，在实际使用中处理
  }

  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll)
    }
  })

  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    scrollTop,
    containerRef,
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
    updateVisibleItems,
    handleScroll
  }
}

// 懒加载混入
export function useLazyLoad(options = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    once = true
  } = options

  const isIntersecting = ref(false)
  const hasIntersected = ref(false)
  const targetRef = ref(null)
  let observer = null

  const startObserving = () => {
    if (!targetRef.value || observer) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting.value = entry.isIntersecting
          if (entry.isIntersecting && !hasIntersected.value) {
            hasIntersected.value = true
            if (once) {
              stopObserving()
            }
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(targetRef.value)
  }

  const stopObserving = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onMounted(() => {
    startObserving()
  })

  onUnmounted(() => {
    stopObserving()
  })

  return {
    isIntersecting,
    hasIntersected,
    targetRef,
    startObserving,
    stopObserving
  }
}

// 缓存混入
export function useCache(key, fetcher, ttl = 5 * 60 * 1000) { // 5分钟默认TTL
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastFetch = ref(0)

  const isExpired = () => {
    return Date.now() - lastFetch.value > ttl
  }

  const fetchData = async (...args) => {
    if (data.value && !isExpired()) {
      return data.value
    }

    loading.value = true
    error.value = null

    try {
      const result = await fetcher(...args)
      data.value = result
      lastFetch.value = Date.now()
      return result
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearCache = () => {
    data.value = null
    lastFetch.value = 0
  }

  return {
    data,
    loading,
    error,
    fetchData,
    clearCache
  }
}

// 性能监控混入
export function usePerformanceMonitor(componentName) {
  const renderTime = ref(0)
  const mountTime = ref(0)
  const updateTime = ref(0)

  const startTime = performance.now()

  onMounted(() => {
    mountTime.value = performance.now() - startTime
    console.log(`${componentName} mounted in ${mountTime.value.toFixed(2)}ms`)
  })

  const measureRender = (fn) => {
    const start = performance.now()
    const result = fn()
    renderTime.value = performance.now() - start
    return result
  }

  const measureUpdate = (fn) => {
    const start = performance.now()
    const result = fn()
    updateTime.value = performance.now() - start
    return result
  }

  return {
    renderTime,
    mountTime,
    updateTime,
    measureRender,
    measureUpdate
  }
}
