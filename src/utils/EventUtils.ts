export namespace EventUtils {
  // 优化后的节流函数，确保最后一次调用会执行
  export function throttle(callback: Function, delay: number) {
    let lastCall = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    
    return function (...args: any[]) {
      const now = new Date().getTime();
      
      // 如果距离上次执行已经超过了 delay，立即执行回调
      if (now - lastCall >= delay) {
        lastCall = now;
        if (timer) {
          clearTimeout(timer); // 清除定时器
          timer = null;
        }
        callback(...args);
      } else if (!timer) {
        // 如果在节流时间内又触发了事件，设置定时器来保证最后一次调用
        timer = setTimeout(() => {
          lastCall = new Date().getTime();
          callback(...args);
          timer = null; // 执行后清除定时器
        }, delay - (now - lastCall));
      }
    };
  }
}
