import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { QuizCatalog, CustomQuestion } from '@/types'
import { catalogsApi } from '@/services/api'

export { type CustomQuestion }

export const useCatalogStore = defineStore('catalogs', () => {
  const catalogs = ref<QuizCatalog[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadCatalogs() {
    loading.value = true
    error.value = null
    try {
      catalogs.value = await catalogsApi.getAll()
    } catch (e) {
      error.value = 'Kataloge konnten nicht geladen werden'
    } finally {
      loading.value = false
    }
  }

  async function createCatalog(title: string, description: string, icon: string, questions: CustomQuestion[]): Promise<string> {
    const { id } = await catalogsApi.create({ title, description, icon, questions })
    await loadCatalogs()
    return id
  }

  async function updateCatalog(id: string, data: Partial<Omit<QuizCatalog, 'id' | 'created_at' | 'updated_at'>>) {
    await catalogsApi.update(id, data)
    await loadCatalogs()
  }

  async function removeCatalog(id: string) {
    await catalogsApi.remove(id)
    catalogs.value = catalogs.value.filter((c) => c.id !== id)
  }

  function exportUrl(id: string): string {
    return catalogsApi.exportUrl(id)
  }

  async function importFromJson(json: string): Promise<string> {
    const payload = JSON.parse(json)
    if (payload.format !== 'lernapp-catalog') throw new Error('Ungültiges Format')
    const { id } = await catalogsApi.import(payload)
    await loadCatalogs()
    return id
  }

  function getCatalog(id: string): QuizCatalog | undefined {
    return catalogs.value.find((c) => c.id === id)
  }

  return { catalogs, loading, error, loadCatalogs, createCatalog, updateCatalog, removeCatalog, exportUrl, importFromJson, getCatalog }
})
