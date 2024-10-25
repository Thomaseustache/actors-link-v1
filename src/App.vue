<template>
  <div class="min-h-screen bg-background text-foreground p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <header class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-3 gradient-text">Actor Link</h1>
        <p class="text-lg text-muted-foreground">
          Discover how actors are connected through movies
        </p>
      </header>

      <!-- Search Form -->
      <div class="grid gap-8 md:grid-cols-2 mb-8">
        <ActorSearch
          label="First Actor"
          v-model="searchQuery1"
          placeholder="e.g., Leonardo DiCaprio"
          @select="handleActor1Select"
        />
        <ActorSearch
          label="Second Actor"
          v-model="searchQuery2"
          placeholder="e.g., Tom Hanks"
          @select="handleActor2Select"
        />
      </div>

      <!-- Selected Actors -->
      <div v-if="actor1 || actor2" class="grid gap-6 md:grid-cols-2 mb-8">
        <div v-if="actor1" class="glass-effect rounded-xl p-6">
          <div class="flex items-center gap-4">
            <img
              v-if="actor1.profile_path"
              :src="`https://image.tmdb.org/t/p/w185${actor1.profile_path}`"
              :alt="actor1.name"
              class="w-24 h-24 rounded-lg object-cover"
            />
            <div v-else class="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center text-3xl">
              {{ actor1.name.charAt(0) }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h3 class="text-2xl font-bold">{{ actor1.name }}</h3>
                <a 
                  v-if="actor1.imdb_url"
                  :href="actor1.imdb_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-2 py-1 bg-[#f3ce13] text-black rounded font-medium text-xs hover:bg-[#f3ce13]/90 transition-colors"
                >
                  IMDb
                </a>
              </div>
              <p class="text-muted-foreground mt-1">{{ actor1.known_for_department }}</p>
            </div>
            <button 
              @click="clearActor(1)"
              class="ml-auto p-2 hover:text-primary transition-colors"
              title="Remove actor"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="actor2" class="glass-effect rounded-xl p-6">
          <div class="flex items-center gap-4">
            <img
              v-if="actor2.profile_path"
              :src="`https://image.tmdb.org/t/p/w185${actor2.profile_path}`"
              :alt="actor2.name"
              class="w-24 h-24 rounded-lg object-cover"
            />
            <div v-else class="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center text-3xl">
              {{ actor2.name.charAt(0) }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h3 class="text-2xl font-bold">{{ actor2.name }}</h3>
                <a 
                  v-if="actor2.imdb_url"
                  :href="actor2.imdb_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-2 py-1 bg-[#f3ce13] text-black rounded font-medium text-xs hover:bg-[#f3ce13]/90 transition-colors"
                >
                  IMDb
                </a>
              </div>
              <p class="text-muted-foreground mt-1">{{ actor2.known_for_department }}</p>
            </div>
            <button 
              @click="clearActor(2)"
              class="ml-auto p-2 hover:text-primary transition-colors"
              title="Remove actor"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Find Connection Button -->
      <button
        @click="findConnection"
        :disabled="!canSearch"
        class="w-full h-14 bg-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-lg
               hover:bg-primary/90 transition-colors mb-8"
      >
        {{ isLoading ? 'Searching...' : 'Find Connection' }}
      </button>

      <!-- Error Message -->
      <div v-if="error" class="text-red-500 text-center mb-8">
        {{ error }}
      </div>

      <!-- Search Progress -->
      <SearchProgress
        v-if="isLoading"
        :current-movie="currentMovie"
        :progress="searchProgress"
      />

      <!-- Connection Path -->
      <ConnectionPath
        :path="connectionPath"
        :is-loading="isLoading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ActorSearch from './components/ActorSearch.vue'
import ConnectionPath from './components/ConnectionPath.vue'
import SearchProgress from './components/SearchProgress.vue'
import { getActorDetails } from './services/tmdb'
import { findPath, setProgressCallback } from './services/pathFinder'
import type { Actor, MovieDetails, Movie } from './types'

const searchQuery1 = ref('')
const searchQuery2 = ref('')
const actor1 = ref<Actor | null>(null)
const actor2 = ref<Actor | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const connectionPath = ref<Array<Actor | MovieDetails>>([])
const currentMovie = ref<Movie | null>(null)
const searchProgress = ref(0)
let movieCount = 0

const canSearch = computed(() => actor1.value && actor2.value && !isLoading.value)

async function handleActor1Select(actor: Actor) {
  try {
    actor1.value = await getActorDetails(actor.id)
    error.value = null
  } catch (err) {
    error.value = 'Failed to load actor details'
    console.error(err)
  }
}

async function handleActor2Select(actor: Actor) {
  try {
    actor2.value = await getActorDetails(actor.id)
    error.value = null
  } catch (err) {
    error.value = 'Failed to load actor details'
    console.error(err)
  }
}

function clearActor(number: number) {
  if (number === 1) {
    actor1.value = null
    searchQuery1.value = ''
  } else {
    actor2.value = null
    searchQuery2.value = ''
  }
  connectionPath.value = []
  error.value = null
}

async function findConnection() {
  if (!actor1.value || !actor2.value) return

  try {
    isLoading.value = true
    error.value = null
    connectionPath.value = []
    currentMovie.value = null
    searchProgress.value = 0
    movieCount = 0

    // Set up progress callback
    setProgressCallback((movie: Movie) => {
      currentMovie.value = movie
      movieCount++
      searchProgress.value = Math.min((movieCount / 100) * 100, 100)
    })

    const path = await findPath(actor1.value, actor2.value)
    
    if (path.length === 0) {
      error.value = 'No connection found between these actors'
    } else {
      connectionPath.value = path
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
    console.error('Path finding error:', err)
  } finally {
    isLoading.value = false
    currentMovie.value = null
    setProgressCallback(null)
  }
}
</script>