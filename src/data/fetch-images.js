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

// Helper to search and fetch character image
async function fetchCharacterImage(name) {
  let attempt = 0;
  while (attempt < 3) {
    try {
      console.log(`[Character] Fetching artwork for: ${name}...`);
      const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(name)}&limit=1`;
      const res = await fetch(url);
      
      if (res.status === 429) {
        console.log(`[Character] Rate limited (429) for ${name}. Sleeping 4 seconds...`);
        await sleep(4000);
        attempt++;
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      if (json.data && json.data.length > 0) {
        const charData = json.data[0];
        const imageUrl = charData.images?.webp?.image_url || charData.images?.jpg?.image_url;
        if (imageUrl && !imageUrl.includes('questionmark')) {
          return imageUrl;
        }
      }
      return null;
    } catch (err) {
      console.error(`[Character] Error fetching ${name}: ${err.message}. Retrying...`);
      await sleep(2000);
      attempt++;
    }
  }
  return null;
}

// Helper to search and fetch anime image
async function fetchAnimeImage(title) {
  let attempt = 0;
  while (attempt < 3) {
    try {
      console.log(`[Anime] Fetching poster for: ${title}...`);
      const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`;
      const res = await fetch(url);

      if (res.status === 429) {
        console.log(`[Anime] Rate limited (429) for ${title}. Sleeping 4 seconds...`);
        await sleep(4000);
        attempt++;
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      if (json.data && json.data.length > 0) {
        const animeData = json.data[0];
        const imageUrl = animeData.images?.webp?.large_image_url || animeData.images?.jpg?.large_image_url || animeData.images?.webp?.image_url;
        if (imageUrl) {
          return imageUrl;
        }
      }
      return null;
    } catch (err) {
      console.error(`[Anime] Error fetching ${title}: ${err.message}. Retrying...`);
      await sleep(2000);
      attempt++;
    }
  }
  return null;
}

async function run() {
  console.log("=== STARTING JIKAN ARTWORK FETCHING ===");

  // 1. Fetch character images
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    // Check if the current image is a placeholder
    if (char.image.includes('placehold.co')) {
      const realImage = await fetchCharacterImage(char.name);
      if (realImage) {
        console.log(`[Character] SUCCESS: ${char.name} -> ${realImage}`);
        char.image = realImage;
        char.coverImage = realImage; // fallback cover to portrait
      } else {
        // Fallback to a stable, non-placehold anime image to guarantee no text-only slop
        char.image = `https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80`;
      }
      // Delay to respect rate limits
      await sleep(1500);
    }
  }
  fs.writeFileSync(charactersPath, JSON.stringify(characters, null, 2), 'utf8');
  console.log("[Characters] Completed character database update.");

  // 2. Fetch anime poster images
  for (let i = 0; i < anime.length; i++) {
    const a = anime[i];
    if (a.image.includes('placehold.co')) {
      const realImage = await fetchAnimeImage(a.title);
      if (realImage) {
        console.log(`[Anime] SUCCESS: ${a.title} -> ${realImage}`);
        a.image = realImage;
        a.coverImage = realImage;
      } else {
        a.image = `https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&q=80`;
      }
      await sleep(1500);
    }
  }
  fs.writeFileSync(animePath, JSON.stringify(anime, null, 2), 'utf8');
  console.log("[Anime] Completed anime database update.");

  // 3. Replace placeholder images in Lists with thematic Unsplash anime/manga photography
  const listArtworkFallback = [
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80", // anime room
    "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=800&q=80", // retro console
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80", // anime illustration
    "https://images.unsplash.com/photo-1541562232579-512a21360020?w=800&q=80", // drawing manga
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80", // japan street night
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80", // tokyo tower
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80", // kyoto temple
    "https://images.unsplash.com/photo-1524413840003-05174b1a7d73?w=800&q=80", // cherry blossom
    "https://images.unsplash.com/photo-1518887570146-0612132dd618?w=800&q=80", // neon street
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80"  // nebula sky
  ];

  lists.forEach((l, idx) => {
    if (l.image.includes('placehold.co')) {
      l.image = listArtworkFallback[idx % listArtworkFallback.length];
    }
  });
  fs.writeFileSync(listsPath, JSON.stringify(lists, null, 2), 'utf8');
  console.log("[Lists] Completed list database update.");

  // 4. Replace placeholder images in Blogs with Unsplash photography
  blogs.forEach((b, idx) => {
    if (b.featuredImage.includes('placehold.co')) {
      b.featuredImage = listArtworkFallback[(idx + 2) % listArtworkFallback.length];
    }
  });
  fs.writeFileSync(blogPostsPath, JSON.stringify(blogs, null, 2), 'utf8');
  console.log("[Blogs] Completed blog database update.");

  // 5. Replace placeholder images in Quizzes
  quizzes.forEach((q, idx) => {
    if (q.image.includes('placehold.co')) {
      q.image = listArtworkFallback[(idx + 5) % listArtworkFallback.length];
    }
  });
  fs.writeFileSync(quizzesPath, JSON.stringify(quizzes, null, 2), 'utf8');
  console.log("[Quizzes] Completed quiz database update.");

  console.log("=== COMPLETED JIKAN ARTWORK FETCHING SUCCESSFULLY ===");
}

run();
