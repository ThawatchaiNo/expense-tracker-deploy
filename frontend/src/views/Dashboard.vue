<template>
  <div>
    <v-row class="mb-4" align="center">
      <v-col>
        <h2 class="text-h5 font-weight-bold">ภาพรวมรายจ่าย</h2>
        <p class="text-medium-emphasis text-body-2">ติดตามค่าใช้จ่ายของคุณ</p>
      </v-col>
      <v-col cols="auto" class="d-flex align-center ga-2">
        <v-btn icon="mdi-chevron-left" variant="tonal" size="small" @click="prevMonth" />
        <v-chip color="primary" variant="flat" size="large">{{ monthLabel }}</v-chip>
        <v-btn icon="mdi-chevron-right" variant="tonal" size="small" @click="nextMonth" :disabled="isCurrentMonth" />
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <StatCard icon="mdi-calendar-today" icon-color="primary" label="วันนี้" :value="summary?.todayTotal || 0" bg-color="indigo-lighten-5" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <StatCard icon="mdi-calendar-month" icon-color="orange" label="เดือนนี้" :value="summary?.monthTotal || 0" bg-color="orange-lighten-5" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <StatCard icon="mdi-receipt-text" icon-color="green" label="จำนวนรายการ" :value="summary?.monthCount || 0" suffix="รายการ" :is-currency="false" bg-color="green-lighten-5" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <StatCard icon="mdi-trending-up" icon-color="pink" label="เฉลี่ยต่อวัน" :value="avgPerDay" bg-color="pink-lighten-5" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-5 pb-0 text-body-1 font-weight-semibold">
            <v-icon class="mr-2" size="18" color="primary">mdi-chart-bar</v-icon>รายจ่ายรายวัน
          </v-card-title>
          <v-card-text class="pa-4">
            <div v-if="loading" class="d-flex justify-center py-8">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <Bar v-else-if="chartData" :data="chartData" :options="chartOptions" style="max-height: 260px" />
            <div v-else class="text-center py-8 text-medium-emphasis">
              <v-icon size="48" class="mb-2">mdi-chart-bar</v-icon>
              <p>ยังไม่มีข้อมูล</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="xl" elevation="0" border height="100%">
          <v-card-title class="pa-5 pb-0 text-body-1 font-weight-semibold">
            <v-icon class="mr-2" size="18" color="secondary">mdi-tag-multiple</v-icon>หมวดหมู่
          </v-card-title>
          <v-card-text class="pa-4">
            <div v-if="!summary?.byCategory?.length" class="text-center py-6 text-medium-emphasis">ยังไม่มีข้อมูล</div>
            <div v-else>
              <div v-for="cat in summary.byCategory" :key="cat.name" class="mb-3">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-body-2">{{ cat.icon }} {{ cat.name }}</span>
                  <span class="text-body-2 font-weight-medium">{{ formatCurrency(cat.total) }}</span>
                </div>
                <v-progress-linear :model-value="(cat.total / summary.monthTotal) * 100" :color="cat.color || 'primary'" rounded height="6" bg-color="grey-lighten-3" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card rounded="xl" elevation="0" border class="mt-4">
      <v-card-title class="pa-5 pb-0 d-flex align-center">
        <v-icon class="mr-2" size="18" color="primary">mdi-history</v-icon>
        <span class="text-body-1 font-weight-semibold">รายการล่าสุด</span>
        <v-spacer />
        <v-btn variant="text" size="small" to="/expenses" color="primary">ดูทั้งหมด</v-btn>
      </v-card-title>
      <v-card-text class="pa-2">
        <ExpenseItem v-for="exp in recentExpenses" :key="exp.id" :expense="exp" @deleted="loadData" />
        <div v-if="!recentExpenses.length" class="text-center py-8 text-medium-emphasis">
          <v-icon size="48" class="mb-2">mdi-receipt-text-outline</v-icon>
          <p class="text-body-1">ยังไม่มีรายการ</p>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { useExpenseStore } from '../stores/expense'
import StatCard from '../components/StatCard.vue'
import ExpenseItem from '../components/ExpenseItem.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const store = useExpenseStore()
const loading = ref(false)
const recentExpenses = ref([])
const month = ref(dayjs().month() + 1)
const year = ref(dayjs().year())

const summary = computed(() => store.summary)
const isCurrentMonth = computed(() => month.value === dayjs().month() + 1 && year.value === dayjs().year())
const monthLabel = computed(() => dayjs(`${year.value}-${month.value}-01`).format('MMMM YYYY'))
const avgPerDay = computed(() => {
  if (!summary.value?.monthTotal) return 0
  const days = summary.value.daily?.length || 1
  return summary.value.monthTotal / days
})

const chartData = computed(() => {
  if (!summary.value?.daily?.length) return null
  return {
    labels: summary.value.daily.map(d => dayjs(d.date).format('D')),
    datasets: [{ data: summary.value.daily.map(d => d.total), backgroundColor: '#6366f1cc', borderRadius: 6, borderSkipped: false }]
  }
})

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: '#f1f5f9' }, ticks: { callback: v => `฿${v.toLocaleString()}` } }
  }
}

function formatCurrency(v) {
  return `฿${Number(v).toLocaleString('th-TH', { minimumFractionDigits: 0 })}`
}

async function loadData() {
  loading.value = true
  await store.fetchSummary(month.value, year.value)
  const res = await store.fetchExpenses({ month: month.value, year: year.value, limit: 5 })
  recentExpenses.value = res?.data || []
  loading.value = false
}

function prevMonth() {
  const d = dayjs(`${year.value}-${month.value}-01`).subtract(1, 'month')
  month.value = d.month() + 1
  year.value = d.year()
}
function nextMonth() {
  if (isCurrentMonth.value) return
  const d = dayjs(`${year.value}-${month.value}-01`).add(1, 'month')
  month.value = d.month() + 1
  year.value = d.year()
}

// ✅ watch lastUpdated จาก store — รีเฟรชทันทีเมื่อมีการเพิ่ม/แก้ไข/ลบจากที่ไหนก็ได้
watch(() => store.lastUpdated, () => loadData())
watch([month, year], loadData)
onMounted(loadData)
</script>
