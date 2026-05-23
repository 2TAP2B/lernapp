import axios from 'axios'
import type { Country, River, RiverProgress, User, LearnProgress, Badge, UserBadge, QuizCatalog, BadgeDefinition, CatalogExport, BadgesExport } from '@/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10000,
})

export const countriesApi = {
  getAll(region?: string): Promise<Country[]> {
    return api.get('/countries', { params: region ? { region } : {} }).then((r) => r.data)
  },
  getById(id: string): Promise<Country> {
    return api.get(`/countries/${id}`).then((r) => r.data)
  },
  getRandom(n = 10): Promise<Country[]> {
    return api.get('/countries/random', { params: { n } }).then((r) => r.data)
  },
}

export const usersApi = {
  getById(id: string): Promise<User> {
    return api.get(`/users/${id}`).then((r) => r.data)
  },
  create(name: string, avatarId: number): Promise<User> {
    return api.post('/users', { name, avatar_id: avatarId }).then((r) => r.data)
  },
  addXp(id: string, xp: number): Promise<{ xp: number; level: number; streak_days: number; level_up: boolean; new_badges: Badge[] }> {
    return api.patch(`/users/${id}/xp`, { xp }).then((r) => r.data)
  },
  getProgress(id: string): Promise<LearnProgress[]> {
    return api.get(`/users/${id}/progress`).then((r) => r.data)
  },
  recordProgress(id: string, countryId: string): Promise<{ xp_gained: number; is_new: boolean; new_badges: Badge[] }> {
    return api.post(`/users/${id}/progress`, { country_id: countryId }).then((r) => r.data)
  },
  getBadges(id: string): Promise<UserBadge[]> {
    return api.get(`/users/${id}/badges`).then((r) => r.data)
  },
}

export const quizApi = {
  createSession(userId: string, quizType: string, countriesPool: string[]): Promise<{ id: string; quiz_type: string; countries_pool: string[] }> {
    return api.post('/quiz/session', { user_id: userId, quiz_type: quizType, countries_pool: countriesPool }).then((r) => r.data)
  },
  completeSession(sessionId: string, score: number, timeSeconds: number, speedBonuses: number): Promise<{ xp_gained: number; new_badges: Badge[] }> {
    return api.post(`/quiz/session/${sessionId}/complete`, { score, time_seconds: timeSeconds, speed_bonuses: speedBonuses }).then((r) => r.data)
  },
}

export const badgesApi = {
  getAll(): Promise<Badge[]> {
    return api.get('/badges').then((r) => r.data)
  },
}

export const catalogsApi = {
  getAll(): Promise<QuizCatalog[]> {
    return api.get('/catalogs').then((r) => r.data)
  },
  getById(id: string): Promise<QuizCatalog> {
    return api.get(`/catalogs/${id}`).then((r) => r.data)
  },
  create(data: Omit<QuizCatalog, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: string }> {
    return api.post('/catalogs', data).then((r) => r.data)
  },
  update(id: string, data: Partial<Omit<QuizCatalog, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    return api.put(`/catalogs/${id}`, data).then(() => undefined)
  },
  remove(id: string): Promise<void> {
    return api.delete(`/catalogs/${id}`).then(() => undefined)
  },
  exportUrl(id: string): string {
    return `${api.defaults.baseURL}/catalogs/${id}/export`
  },
  import(payload: CatalogExport): Promise<{ id: string }> {
    return api.post('/catalogs/import', payload).then((r) => r.data)
  },
}

export const badgeDefsApi = {
  getAll(): Promise<BadgeDefinition[]> {
    return api.get('/badge-definitions').then((r) => r.data)
  },
  create(def: BadgeDefinition & { sort_order?: number }): Promise<void> {
    return api.post('/badge-definitions', def).then(() => undefined)
  },
  update(id: string, def: Partial<BadgeDefinition> & { sort_order?: number }): Promise<void> {
    return api.put(`/badge-definitions/${id}`, def).then(() => undefined)
  },
  remove(id: string): Promise<void> {
    return api.delete(`/badge-definitions/${id}`).then(() => undefined)
  },
  exportUrl(): string {
    return `${api.defaults.baseURL}/badge-definitions/export`
  },
  import(payload: BadgesExport): Promise<void> {
    return api.post('/badge-definitions/import', payload).then(() => undefined)
  },
}

export const riversApi = {
  getAll(continent?: string): Promise<River[]> {
    return api.get('/rivers', { params: continent ? { continent } : {} }).then((r) => r.data)
  },
  getById(id: string): Promise<River> {
    return api.get(`/rivers/${id}`).then((r) => r.data)
  },
  getProgress(userId: string): Promise<RiverProgress[]> {
    return api.get(`/rivers/progress/${userId}`).then((r) => r.data)
  },
  recordProgress(userId: string, riverId: string): Promise<RiverProgress> {
    return api.post('/rivers/progress', { user_id: userId, river_id: riverId }).then((r) => r.data)
  },
}

export default api
