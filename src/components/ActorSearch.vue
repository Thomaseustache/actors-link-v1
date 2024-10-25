<template>
  <div class="space-y-4">
    <label :for="label" class="block text-lg font-medium text-foreground/90">
      {{ label }}
    </label>

    <!-- Search Input -->
    <div class="relative group">
      <input
        :id="label"
        type="text"
        :value="modelValue"
        @input="handleInput"
        @keydown.down.prevent="handleArrowDown"
        @keydown.up.prevent="handleArrowUp"
        @keydown.enter.prevent="handleEnter"
        @blur="handleBlur"
        :placeholder="placeholder"
        class="w-full h-14 px-5 bg-secondary/30 rounded-xl text-lg 
               text-foreground placeholder:text-muted-foreground focus:outline-none
               border border-white/[0.05] group-hover:border-primary/50 focus:border-primary
               transition-all duration-300 glass-effect"
      />
      
      <!-- Suggestions Dropdown -->
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="absolute z-50 w-full mt-2 glass-effect rounded-xl overflow-hidden"
      >
        <div class="max-h-64 overflow-y-auto">
          <div
            v-for="(actor, index) in suggestions"
            :key="actor.id"
            @mousedown="selectSuggestion(actor)"
            @mouseover="selectedIndex = index"
            :class="[
              'px-5 py-4 cursor-pointer flex items-center gap-3 transition-colors',
              selectedIndex === index ? 'bg-primary/20' : 'hover:bg-primary/10'
            ]"
          >
            <img
              v-if="actor.profile_path"
              :src="`https://image.tmdb.org/t/p/w45${actor.profile_path}`"
              :alt="actor.name"
              class="w-8 h-8 rounded-full object-cover"
            />
            <div v-else class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">
              {{ actor.name.charAt(0) }}
            </div>
            <div>
              <div class="font-medium">{{ actor.name }}</div>
              <div class="text-sm text-muted-foreground">
                {{ actor.known_for_department }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { searchActor } from '../services/tmdb'
import type { Actor } from '../types'
import { debounce } from '../utils/debounce'

const props = defineProps<{
  label: string
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:model-value': [value: string]
  'select': [actor: Actor]
}>()

const suggestions = ref<Actor[]>([])
const showSuggestions = ref(false)
const selectedIndex = ref(-1)

const ALLOWED_DEPARTMENTS = ['Acting']
const MIN_POPULARITY = 2 // Abaissé pour inclure plus d'acteurs

const debouncedSearch = debounce(async (query: string) => {
  if (query.length < 2) {
    suggestions.value = []
    return
  }
  
  try {
    const results = await searchActor(query)
    suggestions.value = results
      .filter(actor => 
        ALLOWED_DEPARTMENTS.includes(actor.known_for_department || '') &&
        actor.profile_path && // Only actors with profile photos
        actor.popularity && actor.popularity >= MIN_POPULARITY // Only somewhat popular actors
      )
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)) // Sort by popularity
      .slice(0, 5)
    selectedIndex.value = -1
    showSuggestions.value = true
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    suggestions.value = []
  }
}, 300)

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:model-value', value)
  debouncedSearch(value)
}

function selectSuggestion(actor: Actor) {
  emit('update:model-value', actor.name)
  emit('select', actor)
  showSuggestions.value = false
  suggestions.value = []
}

function handleArrowDown() {
  if (suggestions.value.length) {
    selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length
  }
}

function handleArrowUp() {
  if (suggestions.value.length) {
    selectedIndex.value = selectedIndex.value <= 0 
      ? suggestions.value.length - 1 
      : selectedIndex.value - 1
  }
}

function handleEnter() {
  if (selectedIndex.value >= 0 && suggestions.value[selectedIndex.value]) {
    selectSuggestion(suggestions.value[selectedIndex.value])
  }
}

function handleBlur() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    suggestions.value = []
    showSuggestions.value = false
  }
})
</script>