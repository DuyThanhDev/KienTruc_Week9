class TimeLimiter {
  constructor(timeout = 5000) {
    this.timeout = timeout; // Thời gian giới hạn mặc định (ms)
  }

  // Thực hiện yêu cầu với giới hạn thời gian
  async executeWithTimeout(requestFn, customTimeout = null) {
    const timeoutValue = customTimeout || this.timeout;
    
    return new Promise(async (resolve, reject) => {
      // Tạo một promise cho timeout
      const timeoutPromise = new Promise((_, rejectTimeout) => {
        setTimeout(() => {
          rejectTimeout(new Error(`Request timed out after ${timeoutValue}ms`));
        }, timeoutValue);
      });
      
      try {
        // Race giữa yêu cầu và timeout
        const result = await Promise.race([
          requestFn(),
          timeoutPromise
        ]);
        
        resolve(result);
      } catch (error) {
        console.error(`Time Limiter error: ${error.message}`);
        reject(error);
      }
    });
  }
}

module.exports = TimeLimiter;