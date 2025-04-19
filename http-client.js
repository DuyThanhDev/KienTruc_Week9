const axios = require('axios');
const RateLimiter = require('./rate-limiter');

// Tạo instance của rate limiter: 3 yêu cầu trong khoảng 10 giây
const rateLimiter = new RateLimiter(3, 10000);

// Tạo HTTP client có giới hạn tốc độ
const httpClient = {
  get: async (url, config = {}) => {
    return rateLimiter.executeRequest(() => axios.get(url, config));
  },
  
  post: async (url, data, config = {}) => {
    return rateLimiter.executeRequest(() => axios.post(url, data, config));
  },
  
  put: async (url, data, config = {}) => {
    return rateLimiter.executeRequest(() => axios.put(url, data, config));
  },
  
  delete: async (url, config = {}) => {
    return rateLimiter.executeRequest(() => axios.delete(url, config));
  }
};

module.exports = httpClient;