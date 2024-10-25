import { Actor, Movie, getActorMovies, getMovieCast } from './tmdb';

const MAX_DEPTH = 20;
const MIN_VOTE_COUNT = 100;
const MAX_MOVIES_PER_ACTOR = 100;
const MAX_ACTORS_PER_MOVIE = 30;

// Cache for API calls
const movieCache = new Map<number, Movie[]>();
const castCache = new Map<number, Actor[]>();

interface SearchNode {
  node: Actor | Movie;
  path: Array<Actor | Movie>;
  depth: number;
}

// Event emitter for search progress
type ProgressCallback = (movie: Movie) => void;
let onMovieProgress: ProgressCallback | null = null;

export function setProgressCallback(callback: ProgressCallback) {
  onMovieProgress = callback;
}

export async function findPath(startActor: Actor, endActor: Actor): Promise<Array<Actor | Movie>> {
  console.log(`Starting bidirectional path search between ${startActor.name} and ${endActor.name}`);
  
  const forwardQueue: SearchNode[] = [{ node: startActor, path: [startActor], depth: 0 }];
  const backwardQueue: SearchNode[] = [{ node: endActor, path: [endActor], depth: 0 }];
  
  const forwardVisited = new Map<string, SearchNode>();
  const backwardVisited = new Map<string, SearchNode>();
  
  forwardVisited.set(`actor-${startActor.id}`, forwardQueue[0]);
  backwardVisited.set(`actor-${endActor.id}`, backwardQueue[0]);

  while (forwardQueue.length > 0 && backwardQueue.length > 0) {
    if (forwardQueue[0].depth <= MAX_DEPTH) {
      const intersection = await expandFrontier(forwardQueue, forwardVisited, backwardVisited, 'forward');
      if (intersection) {
        console.log('Found intersection in forward search!');
        const path = constructPath(intersection.forwardNode, intersection.backwardNode);
        if (await validatePath(path)) {
          return path;
        }
      }
    }
    
    if (backwardQueue[0].depth <= MAX_DEPTH) {
      const intersection = await expandFrontier(backwardQueue, backwardVisited, forwardVisited, 'backward');
      if (intersection) {
        console.log('Found intersection in backward search!');
        const path = constructPath(intersection.backwardNode, intersection.forwardNode);
        if (await validatePath(path)) {
          return path;
        }
      }
    }

    if ((forwardQueue.length === 0 && backwardQueue.length === 0) || 
        (forwardQueue[0]?.depth > MAX_DEPTH && backwardQueue[0]?.depth > MAX_DEPTH)) {
      console.log('No path found within depth limit');
      return [];
    }
  }

  console.log('No path found');
  return [];
}

async function expandFrontier(
  queue: SearchNode[],
  visited: Map<string, SearchNode>,
  otherVisited: Map<string, SearchNode>,
  direction: 'forward' | 'backward'
): Promise<{ forwardNode: SearchNode; backwardNode: SearchNode } | null> {
  const current = queue.shift();
  if (!current) return null;

  console.log(`Expanding ${direction} frontier at depth ${current.depth} for ${
    'name' in current.node ? current.node.name : current.node.title
  }`);

  if ('name' in current.node) {
    const actor = current.node;
    try {
      let movies = movieCache.get(actor.id);
      if (!movies) {
        movies = await getActorMovies(actor.id);
        movieCache.set(actor.id, movies);
        console.log(`Fetched ${movies.length} movies for ${actor.name}`);
      }

      const filteredMovies = movies
        .filter(movie => movie.vote_count >= MIN_VOTE_COUNT)
        .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
        .slice(0, MAX_MOVIES_PER_ACTOR);

      for (const movie of filteredMovies) {
        // Emit progress event
        if (onMovieProgress) {
          onMovieProgress(movie);
          // Add a small delay to make the transition visible
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const movieKey = `movie-${movie.id}`;
        
        if (!visited.has(movieKey)) {
          const nextNode: SearchNode = {
            node: movie,
            path: direction === 'forward' 
              ? [...current.path, movie]
              : [movie, ...current.path],
            depth: current.depth + 1
          };
          visited.set(movieKey, nextNode);
          
          let cast = castCache.get(movie.id);
          if (!cast) {
            cast = await getMovieCast(movie.id);
            castCache.set(movie.id, cast);
          }

          const mainCast = cast
            .filter(a => a.known_for_department === 'Acting')
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, MAX_ACTORS_PER_MOVIE);

          for (const castMember of mainCast) {
            const castMemberKey = `actor-${castMember.id}`;
            
            if (otherVisited.has(castMemberKey)) {
              const otherNode = otherVisited.get(castMemberKey)!;
              const castMemberNode: SearchNode = {
                node: castMember,
                path: direction === 'forward'
                  ? [...current.path, movie, castMember]
                  : [castMember, movie, ...current.path],
                depth: current.depth + 2
              };
              
              return {
                forwardNode: direction === 'forward' ? castMemberNode : otherNode,
                backwardNode: direction === 'forward' ? otherNode : castMemberNode
              };
            }

            if (!visited.has(castMemberKey)) {
              const nextActorNode: SearchNode = {
                node: castMember,
                path: direction === 'forward'
                  ? [...current.path, movie, castMember]
                  : [castMember, movie, ...current.path],
                depth: current.depth + 2
              };
              visited.set(castMemberKey, nextActorNode);
              queue.push(nextActorNode);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing actor ${actor.name}:`, error);
    }
  }

  return null;
}

function constructPath(forwardNode: SearchNode, backwardNode: SearchNode): Array<Actor | Movie> {
  const forwardPath = forwardNode.path;
  const backwardPath = backwardNode.path;
  
  const intersectionId = 'name' in forwardPath[forwardPath.length - 1] 
    ? (forwardPath[forwardPath.length - 1] as Actor).id
    : (forwardPath[forwardPath.length - 1] as Movie).id;

  const splitIndex = backwardPath.findIndex(node => {
    const nodeId = 'name' in node ? (node as Actor).id : (node as Movie).id;
    return nodeId === intersectionId;
  });

  return [...forwardPath, ...backwardPath.slice(splitIndex + 1)];
}

async function validatePath(path: Array<Actor | Movie>): Promise<boolean> {
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];

    if ('name' in current && 'title' in next) {
      const movies = movieCache.get(current.id) || await getActorMovies(current.id);
      if (!movies.some(m => m.id === next.id)) {
        console.log(`Invalid connection: ${current.name} did not appear in ${next.title}`);
        return false;
      }
    } else if ('title' in current && 'name' in next) {
      const cast = castCache.get(current.id) || await getMovieCast(current.id);
      if (!cast.some(a => a.id === next.id)) {
        console.log(`Invalid connection: ${next.name} did not appear in ${current.title}`);
        return false;
      }
    } else {
      console.log('Invalid path structure: consecutive actors or movies');
      return false;
    }
  }

  return true;
}

setInterval(() => {
  console.log('Clearing path finding caches');
  movieCache.clear();
  castCache.clear();
}, 1000 * 60 * 5);