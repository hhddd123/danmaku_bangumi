import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    return Promise.reject(error)
  }
)

// API服务类
export class ApiService {
  // 搜索相关API
  static async searchVideo(keyword, website) {
    try {
      const response = await api.get(`/searchList?web=${website}&keyword=${keyword}`)
      return response
    } catch (error) {
      throw new Error(`搜索${website}失败: ${error.message}`)
    }
  }

  // 搜索所有网站
  static async searchAllWebsites(keyword) {
    const websites = ['yinghua', 'liangzi', 'uku', 'wolong', 'feifan']
    const promises = websites.map(website => 
      this.searchVideo(keyword, website).catch(error => ({
        website,
        error: error.message,
        data: []
      }))
    )
    
    const results = await Promise.allSettled(promises)
    return results.map((result, index) => {
      const website = websites[index]
      if (result.status === 'fulfilled') {
        const value = result.value
        return {
          website,
          success: !value.error,
          data: value.error ? [] : value,
          error: value.error || null
        }
      } else {
        return {
          website,
          success: false,
          data: [],
          error: result.reason.message
        }
      }
    })
  }

  // 弹幕相关API
  static async searchAnime(keyword) {
    try {
      const response = await api.get(`/api/v2/search/anime?keyword=${keyword}`)
      return response
    } catch (error) {
      throw new Error(`搜索动漫失败: ${error.message}`)
    }
  }

  static async getBangumi(bangumiId) {
    try {
      const response = await api.get(`/api/v2/bangumi?bangumiId=${bangumiId}`)
      return response
    } catch (error) {
      throw new Error(`获取番剧信息失败: ${error.message}`)
    }
  }

  static async getDanmaku(episodeId) {
    try {
      const response = await api.get(`/api/v2/comment?episodeId=${episodeId}`)
      return response
    } catch (error) {
      throw new Error(`获取弹幕失败: ${error.message}`)
    }
  }
}

export default api
