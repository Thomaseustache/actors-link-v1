const TMDB_API_KEY = '1793e5bf5d2a11bbfd7865ba98302fed';
const BASE_URL = 'https://api.themoviedb.org/3';

export interface Actor {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  imdb_id?: string;
  imdb_url?: string;
}

export interface Movie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  vote_count: number;
  imdb_id?: string;
  imdb_url?: string;
}

export async function searchActor(query: string): Promise<Actor[]> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(
      `${BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error('Failed to fetch actor search results');
    
    const data = await response.json();
    return data.results.filter((actor: Actor) => 
      actor.known_for_department === 'Acting'
    );
  } catch (error) {
    console.error('Actor search error:', error);
    throw new Error('Failed to search for actor');
  }
}

export async function getActorDetails(actorId: number): Promise<Actor> {
  try {
    const response = await fetch(
      `${BASE_URL}/person/${actorId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`
    );
    if (!response.ok) throw new Error('Failed to fetch actor details');
    
    const data = await response.json();
    return {
      ...data,
      imdb_url: data.imdb_id ? `https://www.imdb.com/name/${data.imdb_id}` : null
    };
  } catch (error) {
    console.error('Actor details error:', error);
    throw new Error('Failed to get actor details');
  }
}

export async function getMovieDetails(movieId: number): Promise<Movie> {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`
    );
    if (!response.ok) throw new Error('Failed to fetch movie details');
    
    const data = await response.json();
    return {
      ...data,
      imdb_url: data.imdb_id ? `https://www.imdb.com/title/${data.imdb_id}` : null
    };
  } catch (error) {
    console.error('Movie details error:', error);
    throw new Error('Failed to get movie details');
  }
}

export async function getActorMovies(actorId: number): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/person/${actorId}/movie_credits?api_key=${TMDB_API_KEY}`
    );
    if (!response.ok) throw new Error('Failed to fetch actor movies');
    
    const data = await response.json();
    const movies = data.cast;
    
    // Get IMDB IDs for all movies
    const moviesWithImdb = await Promise.all(
      movies.map(async (movie: Movie) => {
        const details = await getMovieDetails(movie.id);
        return {
          ...movie,
          imdb_url: details.imdb_url
        };
      })
    );
    
    return moviesWithImdb;
  } catch (error) {
    console.error('Actor movies error:', error);
    throw new Error('Failed to get actor movies');
  }
}

export async function getMovieCast(movieId: number): Promise<Actor[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`
    );
    if (!response.ok) throw new Error('Failed to fetch movie cast');
    
    const data = await response.json();
    return data.cast;
  } catch (error) {
    console.error('Movie cast error:', error);
    throw new Error('Failed to get movie cast');
  }
}