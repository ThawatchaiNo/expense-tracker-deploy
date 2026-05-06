<template>
  <div>
    <v-row class="mb-4" align="center">
      <v-col>
        <h2 class="text-h5 font-weight-bold">หมวดหมู่</h2>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" rounded="lg" @click="showAdd = true">
          เพิ่มหมวดหมู่
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="cat in store.categories"
        :key="cat.id"
        cols="6" sm="4" md="3"
      >
        <v-card rounded="xl" elevation="0" border class="text-center pa-4">
          <div
            class="d-flex align-center justify-center rounded-xl mx-auto mb-3"
            :style="`background: ${cat.color}22; width:60px; height:60px;`"
          >
            <span style="font-size: 28px">{{ cat.icon }}</span>
          </div>
          <div class="text-body-1 font-weight-medium">{{ cat.name }}</div>
          <div class="mt-2">
            <v-chip :color="cat.color" variant="flat" size="x-small">{{ cat.color }}</v-chip>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add Category Dialog -->
    <v-dialog v-model="showAdd" max-width="420" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2">เพิ่มหมวดหมู่ใหม่</v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-text-field
              v-model="form.name"
              label="ชื่อหมวดหมู่ *"
              variant="outlined"
              rounded="lg"
              :rules="[v => !!v || 'กรุณาระบุชื่อ']"
              class="mb-3"
            />
            <v-text-field
              v-model="form.icon"
              label="ไอคอน (emoji)"
              variant="outlined"
              rounded="lg"
              placeholder="🏠"
              class="mb-3"
            />
            <v-text-field
              v-model="form.color"
              label="สี (hex)"
              variant="outlined"
              rounded="lg"
              placeholder="#6366f1"
              class="mb-1"
            />
            <div class="d-flex flex-wrap ga-2 mt-2">
              <v-btn
                v-for="c in presetColors"
                :key="c"
                :color="c"
                variant="flat"
                size="x-small"
                icon
                rounded="lg"
                @click="form.color = c"
              />
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="showAdd = false">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="saving" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useExpenseStore } from '../stores/expense'

const store = useExpenseStore()
const showAdd = ref(false)
const saving = ref(false)
const formRef = ref()

const presetColors = ['#6366f1','#f97316','#22c55e','#3b82f6','#ec4899','#eab308','#a855f7','#ef4444','#14b8a6','#6b7280']

const form = reactive({ name: '', icon: '📦', color: '#6366f1' })

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  await store.createCategory({ ...form })
  saving.value = false
  showAdd.value = false
  Object.assign(form, { name: '', icon: '📦', color: '#6366f1' })
}

onMounted(() => store.fetchCategories())
</script>
