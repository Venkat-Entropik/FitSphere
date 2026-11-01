/** Single source of truth for backend routes. Paths are relative to EXPO_PUBLIC_API_URL. */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    deleteAccount: '/auth/delete-account',
  },
  workouts: { list: '/workouts', history: '/workouts/history' },
  activities: { list: '/activities' },
  nutrition: { daily: '/nutrition/daily', logFood: '/nutrition/foods', water: '/nutrition/water' },
  coach: {
    overview: '/coach/overview',
    suggestions: '/coach/suggestions',
    messages: '/coach/messages',
    send: '/coach/messages',
  },
  profile: { me: '/profile', preferences: '/profile/preferences', weights: '/profile/weights' },
} as const;
