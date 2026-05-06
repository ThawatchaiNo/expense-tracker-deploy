<template>
  <v-dialog v-model="dialog" max-width="500" persistent>
    <v-card rounded="xl">
      <v-card-title class="pa-6 pb-2">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-pencil' : 'mdi-plus-circle' }}</v-icon>
        {{ isEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่' }}
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="save">
          <v-text-field
            v-model="form.title"
            label="รายการ *"
            placeholder="เช่น ข้าวผัด, แท็กซี่"
            variant="outlined"
            rounded="lg"
            :rules="[v => !!v || 'กรุณาระบุรายการ']"
            class="mb-3"
          />
          <v-text-field
            v-model.number="form.amount"
            label="จำนวนเงิน (บาท) *"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            variant="outlined"
            rounded="lg"
            prefix="฿"
            :rules="[v => (v > 0) || 'กรุณาระบุจำนวนเงิน']"
            class="mb-3"
          />
          <v-select
            v-model="form.category_id"
            :items="store.categories"
            item-title="name"
            item-value="id"
            label="หมวดหมู่"
            variant="outlined"
            rounded="lg"
            clearable
            class="mb-3"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :title="`${item.raw.icon} ${item.raw.name}`" />
            </template>
            <template #selection="{ item }">
              <span>{{ item.raw.icon }} {{ item.raw.name }}</span>
            </template>
          </v-select>
          <v-text-field
            v-model="form.date"
            label="วันที่ *"
            type="date"
            variant="outlined"
            rounded="lg"
            :rules="[v => !!v || 'กรุณาระบุวันที่']"
            class="mb-3"
          />
          <v-textarea
            v-model="form.note"
            label="หมายเหตุ"
            placeholder="บันทึกเพิ่มเติม..."
            variant="outlined"
            rounded="lg"
            rows="2"
            auto-grow
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn variant="text" rounded="lg" @click="close">ยกเลิก</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" :loading="saving" @click="save">
          {{ isEdit ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มรายการ' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import dayjs from 'dayjs'
import { useExpenseStore } from '../stores/expense'

const props = defineProps({
  modelValue: Boolean,
  expense: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useExpenseStore()
const formRef = ref()
const saving = ref(false)

const isEdit = computed(() => !!props.expense)
const dialog = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const defaultForm = () => ({
  title: '',
  amount: null,
  category_id: null,
  note: '',
  date: dayjs().format('YYYY-MM-DD')
})

const form = ref(defaultForm())

watch(() => props.expense, (val) => {
  if (val) form.value = { ...val }
  else form.value = defaultForm()
}, { immediate: true })

watch(dialog, (val) => {
  if (val) {
    store.fetchCategories()
    if (!props.expense) form.value = defaultForm()
  }
})

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (isEdit.value) {
      await store.updateExpense(props.expense.id, form.value)
    } else {
      await store.createExpense(form.value)
    }
    emit('saved')
    close()
  } finally {
    saving.value = false
  }
}

function close() {
  dialog.value = false
  setTimeout(() => {
    formRef.value?.reset()
    form.value = defaultForm()
  }, 200) // ✅ รอ dialog ปิดก่อน reset form ไม่งั้นจะเห็นกระพริบ
}
</script>
