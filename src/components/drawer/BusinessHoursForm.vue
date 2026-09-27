<script setup>
import { TIMEZONES, WEEK_DAYS } from '../../utils/businessHours'
import { formatValidationError } from '../../utils/validation'

const DAY_LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const props = defineProps({
  modelValue: { type: Object, required: true },
  errors: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

function rows() {
  return WEEK_DAYS.map((day) => {
    const existing = (props.modelValue.times || []).find((row) => row.day === day)
    return existing || { day, startTime: '', endTime: '' }
  })
}

function commit(patch) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

function updateTime(day, key, value) {
  commit({
    times: rows().map((row) => (row.day === day ? { ...row, [key]: value } : row)),
  })
}

const timezoneOptions = TIMEZONES.includes(props.modelValue.timezone)
  ? TIMEZONES
  : [props.modelValue.timezone, ...TIMEZONES]
</script>

<template>
  <section class="type-form">
    <h3>Business hours</h3>
    <div class="hours-grid">
      <span></span>
      <span class="hours-head" aria-hidden="true">Start</span>
      <span class="hours-head" aria-hidden="true">End</span>
      <template v-for="row in rows()" :key="row.day">
        <span class="hours-day">{{ DAY_LABELS[row.day] }}</span>
        <div class="hours-cell">
          <label class="visually-hidden" :for="`hours-${row.day}-start`">{{ DAY_LABELS[row.day] }} start</label>
          <input
            :id="`hours-${row.day}-start`"
            type="time"
            :value="row.startTime"
            @input="updateTime(row.day, 'startTime', $event.target.value)"
          />
        </div>
        <div class="hours-cell">
          <label class="visually-hidden" :for="`hours-${row.day}-end`">{{ DAY_LABELS[row.day] }} end</label>
          <input
            :id="`hours-${row.day}-end`"
            type="time"
            :value="row.endTime"
            @input="updateTime(row.day, 'endTime', $event.target.value)"
          />
        </div>
      </template>
    </div>
    <p v-for="error in errors.filter((item) => item.field !== 'timezone')" :id="`error-${error.field}-${error.code}`" :key="`${error.field}-${error.code}`" class="form-error" role="alert">
      {{ formatValidationError(error) }}
    </p>
    <div class="field" :class="{ 'is-invalid': errors.some((item) => item.field === 'timezone') }">
      <label for="node-timezone">Time zone</label>
      <select
        id="node-timezone"
        :value="modelValue.timezone"
        :aria-invalid="errors.some((item) => item.field === 'timezone') ? true : undefined"
        :aria-describedby="errors.some((item) => item.field === 'timezone') ? 'error-timezone-timezone' : undefined"
        @change="commit({ timezone: $event.target.value })"
      >
        <option v-for="zone in timezoneOptions" :key="zone" :value="zone">{{ zone }}</option>
      </select>
      <p v-for="error in errors.filter((item) => item.field === 'timezone')" :id="`error-${error.field}-${error.code}`" :key="`${error.field}-${error.code}`" class="form-error" role="alert">
        {{ formatValidationError(error) }}
      </p>
    </div>
  </section>
</template>

<style scoped>
h3 {
  margin: 0;
  font-size: 14px;
}

.hours-grid {
  display: grid;
  grid-template-columns: minmax(88px, 1.15fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px 10px;
  align-items: center;
}

.hours-head {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.hours-day {
  font-size: 14px;
}

.hours-cell {
  min-width: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
