<template>
  <v-list-item rounded="lg" class="pa-3 mb-1" @click="showEdit = true">
    <template #prepend>
      <div
        class="d-flex align-center justify-center rounded-lg mr-3"
        :style="`background: ${expense.category_color || '#e2e8f0'}22; width:44px; height:44px;`"
      >
        <span style="font-size: 20px">{{ expense.category_icon || '💰' }}</span>
      </div>
    </template>

    <v-list-item-title class="font-weight-medium text-body-1">{{ expense.title }}</v-list-item-title>
    <v-list-item-subtitle class="text-caption text-medium-emphasis">
      {{ expense.category_name || 'ไม่มีหมวดหมู่' }} · {{ formatDate(expense.date) }}
      <span v-if="expense.note" class="ml-1">· {{ expense.note }}</span>
    </v-list-item-subtitle>

    <template #append>
      <div class="d-flex align-center ga-2">
        <span class="text-body-1 font-weight-bold text-error">
          -฿{{ formatAmount(expense.amount) }}
        </span>
        <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click.stop="confirmDelete" />
      </div>
    </template>
  </v-list-item>

  <!-- Edit Dialog -->
  <ExpenseDialog v-model="showEdit" :expense="expense" @saved="emit('deleted')" />

  <!-- Delete Confirm -->
  <v-dialog v-model="deleteDialog" max-width="360">
    <v-card rounded="xl">
      <v-card-title class="pa-6 pb-2">ยืนยันการลบ</v-card-title>
      <v-card-text class="pa-6 pt-2">
        ต้องการลบ <strong>"{{ expense.title }}"</strong> ออกจากรายการหรือไม่?
      </v-card-text>
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="deleteDialog = false">ยกเลิก</v-btn>
        <v-btn color="error" variant="flat" :loading="deleting" rounded="lg" @click="doDelete">ลบ</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { useExpenseStore } from '../stores/expense'
import ExpenseDialog from './ExpenseDialog.vue'

dayjs.locale('th')
const props = defineProps({ expense: Object })
const emit = defineEmits(['deleted'])

const store = useExpenseStore()
const showEdit = ref(false)
const deleteDialog = ref(false)
const deleting = ref(false)

const formatDate = d => dayjs(d).format('D MMM BBBB')
const formatAmount = v => Number(v).toLocaleString('th-TH', { minimumFractionDigits: 0 })

function confirmDelete() { deleteDialog.value = true }

async function doDelete() {
  deleting.value = true
  await store.deleteExpense(props.expense.id)
  deleting.value = false
  deleteDialog.value = false
  // ✅ lastUpdated ใน store จะ trigger views เอง ไม่ต้อง emit แล้ว
}
</script>
