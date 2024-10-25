export interface Actor {
  id: number
  name: string
  profile_path: string | null
  known_for_department?: string
  order?: number
  popularity?: number
  imdb_url?: string | null
}

export interface Movie {
  id: number
  title: string
  release_date: string
  cast: Actor[]
  vote_count?: number
  popularity?: number
}

export interface MovieDetails extends Movie {
  poster_path: string | null
  overview: string
  vote_average: number
  imdb_url: string | null
}

export interface SearchNode {
  data: Actor | Movie
  parent: SearchNode | null
  type: 'actor' | 'movie'
  depth: number
}