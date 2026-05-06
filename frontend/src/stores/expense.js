import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'

const api = axios.create({ baseURL: '/api' })

export const useExpenseStore = defineStore('expenses', () => {
  const expenses = ref([])
  const categories = ref([])
  const summary = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(0)

  async function fetchCategories() {
    const { data } = await api.get('/categories')
    categories.value = data.data
  }
  async function createCategory(payload) {
    const { data } = await api.post('/categories', payload)
    categories.value.push(data.data)
    return data.data
  }
  async function fetchExpenses(params = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/expenses', { params })
      expenses.value = data.data
      return { data: data.data, meta: data.meta }
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }
  async function fetchSummary(month, year) {
    loading.value = true
    try {
      const { data } = await api.get('/expenses/summary', {
        params: { month: month || dayjs().month() + 1, year: year || dayjs().year() }
      })
      summary.value = data.data
    } finally {
      loading.value = false
    }
  }
  async function createExpense(payload) {
    const { data } = await api.post('/expenses', payload)
    lastUpdated.value = Date.now()
    return data.data
  }
  async function updateExpense(id, payload) {
    const { data } = await api.put(`/expenses/${id}`, payload)
    lastUpdated.value = Date.now()
    return data.data
  }
  async function deleteExpense(id) {
    await api.delete(`/expenses/${id}`)
    lastUpdated.value = Date.now()
  }
  const categoryMap = computed(() =>
    Object.fromEntries(categories.value.map(c => [c.id, c]))
  )
  return {
    expenses, categories, summary, loading, error, lastUpdated,
    fetchCategories, createCategory,
    fetchExpenses, fetchSummary,
    createExpense, updateExpense, deleteExpense,
    categoryMap
  }
})
