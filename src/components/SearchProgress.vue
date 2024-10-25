<template>
  <div v-if="currentMovie" class="fixed inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur-sm">
    <div class="glass-effect p-8 rounded-xl max-w-lg w-full mx-4">
      <div class="text-center mb-6">
        <h3 class="text-2xl font-bold mb-2">Searching through movies...</h3>
        <p class="text-muted-foreground">Analyzing connections between actors</p>
      </div>
      
      <div class="relative aspect-video mb-6 overflow-hidden rounded-lg">
        <img
          v-if="currentMovie.poster_path"
          :src="`https://image.tmdb.org/t/p/w500${currentMovie.poster_path}`"
          :alt="currentMovie.title"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full bg-secondary flex items-center justify-center">
          <span class="text-4xl">{{ currentMovie.title.charAt(0) }}</span>
        </div>
        
        <!-- Fade overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
      </div>
      
      <div class="text-center">
        <h4 class="text-xl font-semibold mb-2">{{ currentMovie.title }}</h4>
        <p class="text-muted-foreground">
          {{ new Date(currentMovie.release_date).getFullYear() }}
        </p>
      </div>
      
      <!-- Progress bar -->
      <div class="mt-6 h-2 bg-secondary/30 rounded-full overflow-hidden">
        <div 
          class="h-full bg-primary transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Movie } from '../types'

defineProps<{
  currentMovie: Movie | null
  progress: number
}>()
</script>