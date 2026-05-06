<template>
  <v-app :theme="theme">
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent color="surface" border="0" elevation="2">
      <v-list-item
        prepend-icon="mdi-cash-multiple"
        title="บันทึกรายจ่าย"
        nav
        class="py-4"
      >
        <template #append>
          <v-btn :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'" variant="text" @click="rail = !rail" />
        </template>
      </v-list-item>

      <v-divider />

      <v-list density="compact" nav class="mt-2">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
          color="primary"
          class="mb-1"
        />
      </v-list>

      <template #append>
        <v-divider />
        <v-list density="compact" nav class="py-2">
          <v-list-item
            :prepend-icon="theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny'"
            :title="theme === 'light' ? 'โหมดมืด' : 'โหมดสว่าง'"
            rounded="lg"
            @click="toggleTheme"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat color="surface" border="b" elevation="0">
      <v-app-bar-title>
        <span class="font-weight-semibold">{{ currentTitle }}</span>
      </v-app-bar-title>
      <template #append>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          rounded="lg"
          class="mr-3"
          @click="showAddDialog = true"
        >
          เพิ่มรายการ
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-6">
        <!-- ✅ key บังคับให้ router-view re-render เมื่อ route เปลี่ยน -->
        <router-view :key="route.path" />
      </v-container>
    </v-main>

    <ExpenseDialog v-model="showAddDialog" @saved="onSaved" />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" rounded="lg">
      {{ snackbar.text }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useExpenseStore } from './stores/expense'
import ExpenseDialog from './components/ExpenseDialog.vue'

const store = useExpenseStore()
const route = useRoute()
const drawer = ref(true)
const rail = ref(false)
const theme = ref('light')
const showAddDialog = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const navItems = [
  { to: '/', icon: 'mdi-view-dashboard-outline', title: 'ภาพรวม' },
  { to: '/expenses', icon: 'mdi-format-list-bulleted', title: 'รายการจ่าย' },
  { to: '/categories', icon: 'mdi-tag-multiple-outline', title: 'หมวดหมู่' },
]

const currentTitle = computed(() => {
  const item = navItems.find(n => n.to === route.path)
  return item?.title || 'บันทึกรายจ่าย'
})

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

const onSaved = () => {
  snackbar.value = { show: true, text: 'บันทึกรายการสำเร็จ ✓', color: 'success' }
  // ✅ fetchSummary + lastUpdated ใน store จะ trigger ทุก view อัตโนมัติ
  store.fetchSummary()
}
</script>

<style>
* { font-family: 'Noto Sans Thai', sans-serif !important; }
.v-navigation-drawer { transition: width 0.2s ease !important; }
</style>
