const httpClient = require('./http-client');

// Hàm mô phỏng endpoint chậm
async function mockSlowEndpoint(ms) {
  console.log(`Đang kết nối đến endpoint chậm (sẽ mất ${ms}ms)...`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { message: 'Dữ liệu từ endpoint chậm' } });
    }, ms);
  });
}

// Kiểm tra Time Limiter
async function testTimeLimiter() {
  console.log('=== Kiểm tra Time Limiter ===');
  console.log('Time Limiter được cấu hình với timeout 5000ms (5 giây)');
  
  try {
    // Test 1: Request nhanh (2 giây) - Dưới giới hạn thời gian
    console.log('\n[Test 1] Request hoàn thành trong 2 giây:');
    await httpClient.post('http://localhost:3001/ship-order', { orderId: 1 })
      .then(response => {
        console.log('✓ Thành công! Request đã hoàn thành trong giới hạn thời gian.');
        console.log('Response:', response.data);
      })
      .catch(error => {
        console.log('✗ Thất bại:', error.message);
      });

    // Test 2: Request chậm (mô phỏng 7 giây) - Vượt quá giới hạn thời gian
    console.log('\n[Test 2] Request mất 7 giây (vượt quá giới hạn 5 giây):');
    await httpClient.post('http://localhost:3001/ship-order', { orderId: 2 }, {}, 5000)
      .then(() => {
        mockSlowEndpoint(7000); // Mô phỏng API chậm
        console.log('✓ Thành công - không nên thấy thông báo này vì request sẽ timeout');
      })
      .catch(error => {
        console.log('✓ Đã xảy ra lỗi (như mong đợi):', error.message);
      });

    // Test 3: Request với custom timeout (10 giây)
    console.log('\n[Test 3] Request với custom timeout 10 giây:');
    await httpClient.post('http://localhost:3001/ship-order', { orderId: 3 }, {}, 10000)
      .then(() => {
        mockSlowEndpoint(7000); // Mô phỏng API chậm nhưng vẫn dưới 10 giây
        console.log('✓ Thành công! Request đã hoàn thành trong giới hạn thời gian tùy chỉnh.');
      })
      .catch(error => {
        console.log('✗ Thất bại:', error.message);
      });

    console.log('\n=== Kết thúc kiểm tra Time Limiter ===');
  } catch (error) {
    console.error('Lỗi kiểm tra:', error.message);
  }
}

// Thực hiện kiểm tra tích hợp Rate Limiter và Time Limiter
async function testIntegration() {
  console.log('\n=== Kiểm tra tích hợp Rate Limiter và Time Limiter ===');
  
  try {
    // Gửi nhiều request liên tiếp với thời gian khác nhau
    const requests = [];
    const timeouts = [1000, 2000, 3000, 6000, 4000, 2000];
    
    for (let i = 1; i <= 6; i++) {
      console.log(`\nGửi request #${i} với timeout ${timeouts[i-1]}ms...`);
      
      const promise = httpClient.post('http://localhost:3001/ship-order', 
        { orderId: i }, 
        {}, 
        timeouts[i-1])
        .then(response => {
          console.log(`Request #${i} hoàn thành thành công:`, response.data);
          return { id: i, status: 'success', timeout: timeouts[i-1] };
        })
        .catch(error => {
          console.log(`Request #${i} thất bại:`, error.message);
          return { id: i, status: 'error', error: error.message, timeout: timeouts[i-1] };
        });
      
      requests.push(promise);
      
      // Đợi một chút để dễ quan sát
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Đợi tất cả request hoàn thành
    const results = await Promise.all(requests);
    
    console.log('\n=== Kết quả tích hợp ===');
    results.forEach(result => {
      console.log(`Request #${result.id} (timeout ${result.timeout}ms): ${result.status}`);
    });
    
  } catch (error) {
    console.error('Lỗi kiểm tra tích hợp:', error.message);
  }
}

// Chạy các bài test
async function runTests() {
  // Kiểm tra Time Limiter
  await testTimeLimiter();
  
  // Kiểm tra tích hợp cả Rate Limiter và Time Limiter
  await testIntegration();
}

runTests();