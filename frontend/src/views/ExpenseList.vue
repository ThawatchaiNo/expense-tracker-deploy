<template>
  <div>
    <v-row class="mb-4" align="center">
      <v-col>
        <h2 class="text-h5 font-weight-bold">รายการจ่ายทั้งหมด</h2>
      </v-col>
    </v-row>

    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-text-field v-model="filters.date" label="วันที่" type="date" variant="outlined" density="compact" rounded="lg" clearable hide-details @update:model-value="onDateChange" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select v-model="filters.month" :items="months" item-title="label" item-value="value" label="เดือน" variant="outlined" density="compact" rounded="lg" clearable hide-details />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select v-model="filters.category_id" :items="store.categories" item-title="name" item-value="id" label="หมวดหมู่" variant="outlined" density="compact" rounded="lg" clearable hide-details />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <div v-if="meta" class="mb-3 d-flex align-center ga-3">
      <v-chip color="primary" variant="tonal" size="small">{{ meta.count }} รายการ</v-chip>
      <v-chip color="error" variant="tonal" size="small">รวม ฿{{ formatAmount(meta.total) }}</v-chip>
    </div>

    <v-card rounded="xl" elevation="0" border>
      <v-card-text class="pa-2">
        <div v-if="store.loading" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <template v-else-if="store.expenses.length">
          <ExpenseItem v-for="exp in store.expenses" :key="exp.id" :expense="exp" @deleted="load" />
        </template>
        <div v-else class="text-center py-12 text-medium-emphasis">
          <v-icon size="56" class="mb-3">mdi-receipt-text-outline</v-icon>
          <p class="text-body-1">ไม่พบรายการ</p>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useExpenseStore } from '../stores/expense'
import ExpenseItem from '../components/ExpenseItem.vue'
import dayjs from 'dayjs'

const store = useExpenseStore()
const meta = ref(null)

const months = Array.from({ length: 12 }, (_, i) => ({
  label: dayjs().month(i).format('MMMM'),
  value: i + 1
}))

const filters = reactive({
  date: null,
  month: dayjs().month() + 1,
  year: dayjs().year(),
  category_id: null
})

const formatAmount = v => Number(v).toLocaleString('th-TH', { minimumFractionDigits: 0 })

// ✅ เมื่อเลือกวันที่ ให้ล้าง month filter และกลับกัน
function onDateChange(val) {
  if (val) filters.month = null
}

async function load() {
  const params = {}
  if (filters.date) {
    params.date = filters.date
  } else {
    if (filters.month) params.month = filters.month
    params.year = filters.year
  }
  if (filters.category_id) params.category_id = filters.category_id
  const res = await store.fetchExpenses(params)
  meta.value = res?.meta || null
}

// ✅ watch lastUpdated — รีเฟรชเมื่อมีการเพิ่ม/แก้ไข/ลบจากที่ไหนก็ได้
watch(() => store.lastUpdated, () => load())
watch(() => [filters.date, filters.month, filters.category_id], () => load(), { deep: true })

onMounted(() => {
  store.fetchCategories()
  load()
})
</script>
