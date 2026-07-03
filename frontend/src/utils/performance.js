/**
 * Performance optimization utilities
 * Reduces memory usage and improves scalability
 */

import React from 'react';

// Debounce function for API calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for event handlers
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Cache manager for reducing API calls
export class CacheManager {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    const item = this.cache.get(key);
    return item && Date.now() - item.timestamp <= this.ttl;
  }
}

// Pagination helper for large datasets
export const paginate = (array, pageSize, pageNumber = 0) => {
  const startIndex = pageNumber * pageSize;
  const endIndex = startIndex + pageSize;
  return array.slice(startIndex, endIndex);
};

// Memory-efficient event cleanup
export const useWindowListener = (event, handler, options = {}) => {
  React.useEffect(() => {
    window.addEventListener(event, handler, options);
    return () => window.removeEventListener(event, handler, options);
  }, [event, handler]);
};

// Lazy load images
export const useImageLazyLoad = (ref) => {
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.src = entry.target.dataset.src;
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref]);
};

// Request animation frame for smooth animations
export const useRAF = (callback, dependencies = []) => {
  React.useEffect(() => {
    let animationFrameId;
    const tick = () => {
      callback();
      animationFrameId = requestAnimationFrame(tick);
    };
    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, dependencies);
};

// Memory pooling for frequently created objects
export class ObjectPool {
  constructor(creator, resetFunction, poolSize = 10) {
    this.creator = creator;
    this.resetFunction = resetFunction;
    this.available = Array.from({ length: poolSize }, creator);
    this.inUse = new Set();
  }

  acquire() {
    let obj;
    if (this.available.length > 0) {
      obj = this.available.pop();
    } else {
      obj = this.creator();
    }
    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    if (this.inUse.has(obj)) {
      this.resetFunction(obj);
      this.inUse.delete(obj);
      this.available.push(obj);
    }
  }

  clear() {
    this.available = [];
    this.inUse.clear();
  }
}

// Network request optimization
export const batchRequests = (requests, delay = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      Promise.all(requests).then(resolve);
    }, delay);
  });
};

// Compress data before sending
export const compressData = (data) => {
  return JSON.stringify(data);
};

// Monitor memory usage in development
export const logMemoryUsage = () => {
  if (process.env.NODE_ENV === 'development' && performance.memory) {
    const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
    const limit = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
    console.log(`Memory: ${used}MB / ${limit}MB`);
  }
};
