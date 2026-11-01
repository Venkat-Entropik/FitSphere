/** Single source of truth for backend routes. Paths are relative to EXPO_PUBLIC_API_URL. */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  dashboard: { summary: '/dashboard/summary' },
  workouts: {
    list: '/workouts',
    detail: (id: string) => `/workouts/${id}`,
    history: '/workouts/history',
    categories: '/workouts/categories',
    active: '/workouts/active',
  },
  exercises: { list: '/exercises', detail: (id: string) => `/exercises/${id}` },
  activities: { list: '/activities', detail: (id: string) => `/activities/${id}` },
  nutrition: {
    daily: '/nutrition/daily',
    logFood: '/nutrition/foods',
    logRecommended: '/nutrition/recommendation/log',
    water: '/nutrition/water',
  },
  analytics: { overview: '/analytics/overview' },
  progress: { overview: '/progress' },
  coach: {
    overview: '/coach/overview',
    suggestions: '/coach/suggestions',
    messages: '/coach/messages',
    send: '/coach/messages',
  },
  profile: { me: '/profile', preferences: '/profile/preferences' },
} as const;
