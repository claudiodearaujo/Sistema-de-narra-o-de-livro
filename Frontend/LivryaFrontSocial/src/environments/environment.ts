export const environment = {
  production: false,
  // apiUrl: 'http://localhost:3000/api',
  // wsUrl: 'http://localhost:3000',
    apiUrl: 'https://sistema-de-narra-o-de-livro.onrender.com/api',  // Update with production URL
    wsUrl: 'https://sistema-de-narra-o-de-livro.onrender.com',        // Update with production WS URL
    
  // Push Notifications VAPID Key
  // Generate with: npx web-push generate-vapid-keys
  vapidPublicKey: '',  // Set your VAPID public key here
  
  // Auth configuration
  auth: {
    tokenExpirationMinutes: 60,
    refreshTokenEnabled: true,
    rememberMeDays: 30
  },
  
  // Story configuration
  story: {
    durationMs: 20000  // Duration in milliseconds for each story (20 seconds)
  },
  
  // Feature flags
  features: {
    socialNetwork: true,
    emailVerification: true,
    twoFactorAuth: false,
    pushNotifications: true
  }
};
