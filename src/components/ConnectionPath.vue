<template>
  <div v-if="isLoading" class="flex items-center justify-center p-12">
    <div class="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
  </div>

  <div v-else-if="path.length" class="space-y-6">
    <h2 class="text-3xl font-bold text-center gradient-text">Connection Found!</h2>
    <div class="space-y-4">
      <template v-for="(item, index) in path" :key="item.id">
        <!-- Actor Card -->
        <a
          v-if="'name' in item"
          :href="item.imdb_url"
          target="_blank"
          rel="noopener noreferrer"
          class="block glass-effect rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_40px_0_rgba(124,58,237,0.1)]"
        >
          <div class="flex items-center gap-4">
            <img
              v-if="item.profile_path"
              :src="`https://image.tmdb.org/t/p/w185${item.profile_path}`"
              :alt="item.name"
              class="w-24 h-24 rounded-lg object-cover"
            />
            <div v-else class="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center text-3xl">
              {{ item.name.charAt(0) }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h3 class="text-2xl font-bold group-hover:text-primary transition-colors">{{ item.name }}</h3>
                <span class="px-2 py-1 bg-[#f3ce13] text-black rounded font-medium text-xs">IMDb</span>
              </div>
              <p class="text-muted-foreground mt-1">{{ item.known_for_department }}</p>
            </div>
          </div>
        </a>

        <!-- Movie Card -->
        <a
          v-else
          :href="item.imdb_url"
          target="_blank"
          rel="noopener noreferrer"
          class="block glass-effect rounded-lg p-3 relative overflow-hidden group opacity-90 hover:opacity-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_40px_0_rgba(124,58,237,0.1)]"
        >
          <div class="flex gap-3 items-center">
            <img
              v-if="item.poster_path"
              :src="`https://image.tmdb.org/t/p/w92${item.poster_path}`"
              :alt="item.title"
              class="w-16 h-24 rounded shadow-lg object-cover"
            />
            <div v-else class="w-16 h-24 rounded bg-secondary flex items-center justify-center text-sm">
              {{ item.title.charAt(0) }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-medium leading-tight group-hover:text-primary transition-colors">
                  {{ item.title }}
                </h3>
                <span class="px-2 py-1 bg-[#f3ce13] text-black rounded font-medium text-xs whitespace-nowrap">IMDb</span>
              </div>
              <div class="mt-1 text-sm text-muted-foreground">
                {{ new Date(item.release_date).getFullYear() }}
              </div>
            </div>
          </div>
        </a>

        <!-- Connection Arrow -->
        <div 
          v-if="index < path.length - 1" 
          class="flex justify-center py-2"
        >
          <div class="w-0.5 h-4 bg-primary/30"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Actor, MovieDetails } from '../types'

defineProps<{
  path: Array<Actor | MovieDetails>
  isLoading: boolean
}>()
</script>