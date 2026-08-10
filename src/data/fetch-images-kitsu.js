import fs from 'fs';
import path from 'path';

// Helper to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const charactersPath = path.resolve('src/data/characters.json');
const animePath = path.resolve('src/data/anime.json');
const listsPath = path.resolve('src/data/lists.json');
const blogPostsPath = path.resolve('src/data/blog-posts.json');
const quizzesPath = path.resolve('src/data/quizzes.json');

const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));
const anime = JSON.parse(fs.readFileSync(animePath, 'utf8'));
const lists = JSON.parse(fs.readFileSync(listsPath, 'utf8'));
const blogs = JSON.parse(fs.readFileSync(blogPostsPath, 'utf8'));
const quizzes = JSON.parse(fs.readFileSync(quizzesPath, 'utf8'));

// Helper to search and fetch character image from Kitsu API
async function fetchCharacterImageKitsu(name) {
  let attempt = 0;
  while (attempt < 3) {
    try {
      console.log(`[Kitsu Character] Fetching artwork for: ${name}...`);
      // Search by filter[name]
      const url = `https://kitsu.io/api/edge/characters?filter[name]=${encodeURIComponent(name)}&page[limit]=1`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' }
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      if (json.data && json.data.length > 0) {
        const charData = json.data[0];
        const images = charData.attributes?.image;
        if (images) {
          const imageUrl = images.original || images.large || images.medium || images.small;
          if (imageUrl) {
            return imageUrl;
          }
        }
      }
      return null;
    } catch (err) {
      console.error(`[Kitsu Character] Error fetching ${name}: ${err.message}. Retrying...`);
      await sleep(1000);
      attempt++;
    }
  }
  return null;
}

// Helper to search and fetch anime image from Kitsu API
async function fetchAnimeImageKitsu(title) {
  let attempt = 0;
  while (attempt < 3) {
    try {
      console.log(`[Kitsu Anime] Fetching poster for: ${title}...`);
      const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=1`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' }
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      if (json.data && json.data.length > 0) {
        const animeData = json.data[0];
        const posterImage = animeData.attributes?.posterImage;
        if (posterImage) {
          const imageUrl = posterImage.original || posterImage.large || posterImage.medium;
          if (imageUrl) {
            return imageUrl;
          }
        }
      }
      return null;
    } catch (err) {
      console.error(`[Kitsu Anime] Error fetching ${title}: ${err.message}. Retrying...`);
      await sleep(1000);
      attempt++;
    }
  }
  return null;
}

async function run() {
  console.log("=== STARTING KITSU ARTWORK FETCHING ===");

  // Reset placeholder images or keep existing Jikan ones if Jikan succeeded for a few (though it was failing)
  // 1. Fetch character images
  let countChars = 0;
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    // Force refetch all to guarantee no placehold.co or broken fallbacks are left!
    const realImage = await fetchCharacterImageKitsu(char.name);
    if (realImage) {
      console.log(`[Character] SUCCESS: ${char.name} -> ${realImage}`);
      char.image = realImage;
      char.coverImage = realImage;
      countChars++;
    } else {
      console.log(`[Character] WARNING: No artwork found for ${char.name}. Keeping current/fallback image.`);
      // If we don't have an image, let's assign a beautiful high-res anime wallpaper fallback (Unsplash)
      if (char.image.includes('placehold.co')) {
        char.image = `https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80`;
        char.coverImage = `https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&q=80`;
      }
    }
    await sleep(150); // fast sleep
  }
  fs.writeFileSync(charactersPath, JSON.stringify(characters, null, 2), 'utf8');
  console.log(`[Characters] Completed. Updated ${countChars}/${characters.length} characters.`);

  // 2. Fetch anime poster images
  let countAnime = 0;
  for (let i = 0; i < anime.length; i++) {
    const a = anime[i];
    const realImage = await fetchAnimeImageKitsu(a.title);
    if (realImage) {
      console.log(`[Anime] SUCCESS: ${a.title} -> ${realImage}`);
      a.image = realImage;
      a.coverImage = realImage;
      countAnime++;
    } else {
      console.log(`[Anime] WARNING: No poster found for ${a.title}.`);
      if (a.image.includes('placehold.co')) {
        a.image = `https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80`;
        a.coverImage = `https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&q=80`;
      }
    }
    await sleep(150);
  }
  fs.writeFileSync(animePath, JSON.stringify(anime, null, 2), 'utf8');
  console.log(`[Anime] Completed. Updated ${countAnime}/${anime.length} anime series.`);

  // 3. Fallback visual photos (non-placehold.co) for lists
  const listFallbackArtwork = [
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80",
    "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=800&q=80",
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
    "https://images.unsplash.com/photo-1541562232579-512a21360020?w=800&q=80",
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    "https://images.unsplash.com/photo-1524413840003-05174b1a7d73?w=800&q=80",
    "https://images.unsplash.com/photo-1518887570146-0612132dd618?w=800&q=80",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80"
  ];

  lists.forEach((l, idx) => {
    if (l.image.includes('placehold.co') || !l.image) {
      l.image = listFallbackArtwork[idx % listFallbackArtwork.length];
    }
  });
  fs.writeFileSync(listsPath, JSON.stringify(lists, null, 2), 'utf8');

  // 4. Fallback visual photos for blogs
  blogs.forEach((b, idx) => {
    if (b.featuredImage.includes('placehold.co') || !b.featuredImage) {
      b.featuredImage = listFallbackArtwork[(idx + 2) % listFallbackArtwork.length];
    }
  });
  fs.writeFileSync(blogPostsPath, JSON.stringify(blogs, null, 2), 'utf8');

  // 5. Fallback visual photos for quizzes
  quizzes.forEach((q, idx) => {
    if (q.image.includes('placehold.co') || !q.image) {
      q.image = listFallbackArtwork[(idx + 4) % listFallbackArtwork.length];
    }
  });
  fs.writeFileSync(quizzesPath, JSON.stringify(quizzes, null, 2), 'utf8');

  console.log("=== COMPLETED KITSU ARTWORK FETCHING SUCCESSFULLY ===");
}

run();
