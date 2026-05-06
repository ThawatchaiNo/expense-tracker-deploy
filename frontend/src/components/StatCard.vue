<template>
  <v-card rounded="xl" elevation="0" border>
    <v-card-text class="pa-5">
      <div class="d-flex align-center justify-space-between mb-3">
        <div
          class="d-flex align-center justify-center rounded-lg"
          :class="bgColor"
          style="width: 44px; height: 44px;"
        >
          <v-icon :color="iconColor" size="22">{{ icon }}</v-icon>
        </div>
      </div>
      <div class="text-h5 font-weight-bold mb-1">
        <template v-if="isCurrency">฿{{ formatted }}</template>
        <template v-else>{{ value }} <span class="text-body-2 font-weight-regular text-medium-emphasis">{{ suffix }}</span></template>
      </div>
      <div class="text-body-2 text-medium-emphasis">{{ label }}</div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: String,
  iconColor: String,
  label: String,
  value: { type: Number, default: 0 },
  suffix: { type: String, default: '' },
  isCurrency: { type: Boolean, default: true },
  bgColor: { type: String, default: 'indigo-lighten-5' }
})

const formatted = computed(() =>
  Number(props.value).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
)
</script>
