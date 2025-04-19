const httpClient = require('./http-client');

// Kịch bản test: Gửi nhiều yêu cầu liên tiếp để kiểm tra Rate Limiter
async function testRateLimiter() {
  console.log('Bắt đầu kiểm tra Rate Limiter Client...');
  console.log('Sẽ gửi 6 yêu cầu liên tiếp (giới hạn cấu hình là 3 yêu cầu / 10 giây)');
  
  // Đảm bảo server-b đang chạy
  try {
    // Gửi 6 yêu cầu liên tiếp để kiểm tra rate limiting
    const requests = [];
    
    for (let i = 1; i <= 6; i++) {
      console.log(`\nĐang gửi yêu cầu #${i}...`);
      const promise = httpClient.post('http://localhost:3001/ship-order', { orderId: i })
        .then(response => {
          console.log(`Yêu cầu #${i} hoàn thành thành công:`, response.data);
          return { id: i, status: 'success', data: response.data };
        })
        .catch(error => {
          console.log(`Yêu cầu #${i} thất bại:`, error.message);
          return { id: i, status: 'error', error: error.message };
        });
      
      requests.push(promise);
      
      // Đợi một chút giữa các request để dễ quan sát
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Đợi tất cả các yêu cầu hoàn thành
    const results = await Promise.all(requests);
    
    console.log('\n=== Kết quả cuối cùng ===');
    results.forEach(result => {
      console.log(`Yêu cầu #${result.id}: ${result.status}`);
    });
    
    console.log('\nKết thúc kiểm tra Rate Limiter Client');
  } catch (error) {
    console.error('Lỗi kiểm tra:', error.message);
  }
}

// Thực hiện kiểm tra
testRateLimiter();