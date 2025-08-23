// 全局错误处理插件
export const errorHandlerPlugin = {
  install(app, options = {}) {
    const {
      showToast = true,
      logToConsole = true,
      reportToService = false
    } = options

    // 全局错误处理器
    const handleError = (error, context = {}) => {
      const errorInfo = {
        message: error.message || '未知错误',
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      // 控制台日志
      if (logToConsole) {
        console.error('Global Error:', errorInfo)
      }

      // 显示用户友好的错误提示
      if (showToast) {
        // 这里可以集成toast通知库
        console.warn('Error Toast:', errorInfo.message)
      }

      // 上报到错误监控服务
      if (reportToService) {
        // 这里可以集成错误监控服务，如Sentry
        console.log('Error reported to service:', errorInfo)
      }

      return errorInfo
    }

    // Vue错误处理器
    app.config.errorHandler = (error, instance, info) => {
      handleError(error, {
        type: 'vue',
        component: instance?.$options.name || 'Unknown',
        info
      })
    }

    // 未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      handleError(event.reason, {
        type: 'promise',
        promise: event.promise
      })
    })

    // 全局错误事件
    window.addEventListener('error', (event) => {
      handleError(event.error, {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // 提供全局错误处理方法
    app.provide('$errorHandler', handleError)
    app.config.globalProperties.$errorHandler = handleError
  }
}

// 网络错误处理
export const networkErrorHandler = {
  install(app) {
    const handleNetworkError = (error) => {
      if (error.code === 'NETWORK_ERROR') {
        return '网络连接失败，请检查网络设置'
      }
      if (error.code === 'TIMEOUT') {
        return '请求超时，请稍后重试'
      }
      if (error.response?.status === 404) {
        return '请求的资源不存在'
      }
      if (error.response?.status === 500) {
        return '服务器内部错误'
      }
      if (error.response?.status >= 400 && error.response?.status < 500) {
        return '请求参数错误'
      }
      return '网络请求失败'
    }

    app.provide('$networkErrorHandler', handleNetworkError)
    app.config.globalProperties.$networkErrorHandler = handleNetworkError
  }
}

// 性能监控插件
export const performancePlugin = {
  install(app) {
    const performanceMonitor = {
      // 测量函数执行时间
      measure(name, fn) {
        const start = performance.now()
        const result = fn()
        const end = performance.now()
        console.log(`${name} took ${(end - start).toFixed(2)}ms`)
        return result
      },

      // 测量异步函数执行时间
      async measureAsync(name, fn) {
        const start = performance.now()
        const result = await fn()
        const end = performance.now()
        console.log(`${name} took ${(end - start).toFixed(2)}ms`)
        return result
      },

      // 获取页面性能指标
      getMetrics() {
        if (!window.performance) return null

        const navigation = performance.getEntriesByType('navigation')[0]
        const paint = performance.getEntriesByType('paint')

        return {
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
          loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
        }
      }
    }

    app.provide('$performance', performanceMonitor)
    app.config.globalProperties.$performance = performanceMonitor
  }
}
