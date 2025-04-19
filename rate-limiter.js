class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;    // Số yêu cầu tối đa được phép
    this.timeWindow = timeWindow;      // Cửa sổ thời gian (milliseconds)
    this.requestTimestamps = [];       // Mảng lưu trữ thời điểm của các yêu cầu
    this.waitingQueue = [];            // Hàng đợi cho các yêu cầu vượt quá giới hạn
    this.processing = false;           // Trạng thái xử lý hàng đợi
  }

  // Kiểm tra xem có thể thực hiện yêu cầu hay không
  canMakeRequest() {
    const now = Date.now();
    
    // Loại bỏ các timestamp đã hết hạn
    this.requestTimestamps = this.requestTimestamps.filter(
      time => now - time < this.timeWindow
    );
    
    // Kiểm tra xem còn slot trống không
    return this.requestTimestamps.length < this.maxRequests;
  }

  // Ghi nhận một yêu cầu mới
  recordRequest() {
    this.requestTimestamps.push(Date.now());
    return this.getRemainingRequests();
  }

  // Lấy số lượng request còn lại trong cửa sổ hiện tại
  getRemainingRequests() {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      time => now - time < this.timeWindow
    );
    return this.maxRequests - this.requestTimestamps.length;
  }

  // Thực hiện yêu cầu với rate limiting
  async executeRequest(requestFn) {
    if (this.canMakeRequest()) {
      const remaining = this.recordRequest();
      console.log(`Rate limit: ${remaining}/${this.maxRequests} requests remaining in window`);
      return await requestFn();
    } else {
      console.log(`Rate limit exceeded. Request queued.`);
      // Đưa yêu cầu vào hàng đợi nếu vượt quá giới hạn
      return new Promise((resolve, reject) => {
        this.waitingQueue.push({ requestFn, resolve, reject });
        this.processQueue();
      });
    }
  }

  // Xử lý hàng đợi
  async processQueue() {
    if (this.processing || this.waitingQueue.length === 0) return;
    
    this.processing = true;
    
    while (this.waitingQueue.length > 0) {
      if (this.canMakeRequest()) {
        const { requestFn, resolve, reject } = this.waitingQueue.shift();
        const remaining = this.recordRequest();
        console.log(`Processing queued request. ${remaining}/${this.maxRequests} requests remaining.`);
        
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        // Tính toán thời gian chờ cho đến khi có thể gửi request tiếp theo
        const oldestTimestamp = this.requestTimestamps[0];
        const waitTime = oldestTimestamp + this.timeWindow - Date.now() + 100; // +100ms để đảm bảo
        
        console.log(`Waiting ${waitTime}ms for next available slot`);
        await new Promise(r => setTimeout(r, waitTime > 0 ? waitTime : 1000));
      }
    }
    
    this.processing = false;
  }
}

module.exports = RateLimiter;