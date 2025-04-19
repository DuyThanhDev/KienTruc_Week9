const axios = require('axios');
const RateLimiter = require('./rate-limiter');
const TimeLimiter = require('./time-limiter');

// Tạo instance của rate limiter: 3 yêu cầu trong khoảng 10 giây
const rateLimiter = new RateLimiter(3, 10000);

// Tạo instance của time limiter: 5 giây cho mỗi request
const timeLimiter = new TimeLimiter(5000);

// Tạo HTTP client có giới hạn tốc độ và thời gian
const httpClient = {
  get: async (url, config = {}, timeout = null) => {
    return rateLimiter.executeRequest(() => 
      timeLimiter.executeWithTimeout(() => 
        axios.get(url, config), 
      timeout)
    );
  },
  
  post: async (url, data, config = {}, timeout = null) => {
    return rateLimiter.executeRequest(() =>
      timeLimiter.executeWithTimeout(() => 
        axios.post(url, data, config),
      timeout)
    );
  },
  
  put: async (url, data, config = {}, timeout = null) => {
    return rateLimiter.executeRequest(() =>
      timeLimiter.executeWithTimeout(() => 
        axios.put(url, data, config),
      timeout)
    );
  },
  
  delete: async (url, config = {}, timeout = null) => {
    return rateLimiter.executeRequest(() =>
      timeLimiter.executeWithTimeout(() => 
        axios.delete(url, config),
      timeout)
    );
  }
};

module.exports = httpClient;