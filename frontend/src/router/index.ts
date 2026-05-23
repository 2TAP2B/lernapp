import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
    },
    {
      path: '/learn',
      name: 'learn-select',
      component: () => import('@/views/LearnSelectView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/learn/countries',
      name: 'learn',
      component: () => import('@/views/LearnView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/learn/rivers',
      name: 'learn-rivers',
      component: () => import('@/views/RiverLearnView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/quiz',
      name: 'quiz',
      component: () => import('@/views/QuizView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/countries',
      name: 'countries',
      component: () => import('@/views/CountryListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/catalogs',
      name: 'catalogs',
      component: () => import('@/views/CatalogManagerView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/badges',
      name: 'badges',
      component: () => import('@/views/BadgeManagerView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { name: 'onboarding' }
  }
  if (to.name === 'onboarding' && userStore.isLoggedIn) {
    return { name: 'home' }
  }
})

export default router
