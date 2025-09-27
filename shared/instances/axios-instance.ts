import axios from "axios"
import { getCookieToken } from '@/shared/utilities/functions/sessionUtils'

const axiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_URL_SIRA_BACK,
  headers: {
    "Content-type": "application/json"
  }
})

// ANTI-INFINITE LOOP PROTECTION
// Track message API requests to prevent infinite loops
const messageRequestTracker = (() => {
  // Keep track of which conversation IDs we've already requested
  const requestedConversationIds = new Set<number>();
  
  // Keep track of pending requests
  const pendingRequests: Record<string, boolean> = {};
  
  // Rate limiting - maximum allowed calls per minute
  const MAX_CALLS_PER_MINUTE = 3;
  const recentCalls: number[] = [];
  
  // Check if we've exceeded our rate limit
  const isRateLimited = () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove calls older than 1 minute
    while (recentCalls.length > 0 && recentCalls[0] < oneMinuteAgo) {
      recentCalls.shift();
    }
    
    return recentCalls.length >= MAX_CALLS_PER_MINUTE;
  };
  
  // Record a new API call
  const recordCall = () => {
    recentCalls.push(Date.now());
  };
  
  return {
    // Check if a message request should be allowed
    shouldAllowMessageRequest: (conversationId: number): boolean => {
      // Don't allow if we're rate limited
      if (isRateLimited()) {
        // Log rate limit warning - less frequently
        if (Math.random() < 0.1) { // Only log 10% of the time to reduce noise
          console.warn('⚠️ RATE LIMIT EXCEEDED: Blocking message fetch request');
        }
        return false;
      }
      
      // Don't allow if we've already requested this conversation
      if (requestedConversationIds.has(conversationId)) {
        // Dramatically reduce logging frequency to avoid console spam
        if (Math.random() < 0.01) { // Only log 1% of the time
          console.log(`Blocking duplicate fetch for conversation ${conversationId}`);
        }
        return false;
      }
      
      // Record this conversation ID
      requestedConversationIds.add(conversationId);
      recordCall();
      
      console.log(`✅ NEW fetch for conversation ${conversationId}`);
      return true;
    },
    
    // Reset tracking for all conversations
    resetAll: () => {
      requestedConversationIds.clear();
      Object.keys(pendingRequests).forEach(key => {
        delete pendingRequests[key];
      });
    },
    
    // Get stats for debugging
    getStats: () => ({
      requestedCount: requestedConversationIds.size,
      pendingCount: Object.keys(pendingRequests).length,
      recentCallCount: recentCalls.length,
      isRateLimited: isRateLimited()
    })
  };
})();

// Add authentication interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('[DEBUG INTERCEPTOR] Ejecutando interceptor para URL:', config.url);
    
    // Add JWT token to all requests
    const token = getCookieToken();
    console.log('[DEBUG INTERCEPTOR] Token obtenido:', token ? 'SÍ' : 'NO');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[DEBUG INTERCEPTOR] Authorization header agregado:', config.headers.Authorization?.substring(0, 50) + '...');
    } else {
      console.log('[DEBUG INTERCEPTOR] No se agregó Authorization header - token no encontrado');
    }
    
    // Check if this is a message fetch request
    if (config.url === '/message/getMessages' && config.method === 'post' && config.data) {
      try {
        // Parse the request data
        const requestData = typeof config.data === 'string' 
          ? JSON.parse(config.data) 
          : config.data;
        
        // Extract the conversation ID
        const conversationId = requestData.conversationId;
        
        // If no valid conversation ID, let the request through
        if (!conversationId || typeof conversationId !== 'number') {
          return config;
        }
        
        // Check if we should allow this request
        if (!messageRequestTracker.shouldAllowMessageRequest(conversationId)) {
          // Return a dummy canceled request to prevent the actual API call
          return {
            ...config,
            cancelToken: new axios.CancelToken((cancel) => {
              cancel('Blocked duplicate message fetch request');
            })
          };
        }
      } catch (error) {
        console.error('Error in axios interceptor:', error);
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export { axiosInstance }
