const API_URL = '/api/videos';

let player;
let videos = [];
let currentVideoIndex = 0;
let userId = null;

// DOM elements
const videoGrid = document.getElementById('video-grid');
const emptyState = document.getElementById('empty-state');
const playerSection = document.getElementById('player-section');
const gallerySection = document.getElementById('gallery-section');
const closePlayerBtn = document.getElementById('close-player');

// Get user_id from URL parameter
function getUserIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('user_id');
}

// Load videos from API
async function loadVideos() {
  try {
    // Check if user_id is provided in URL
    if (!userId) {
      videoGrid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      emptyState.innerHTML = `
        <p>Welcome to KidTube!</p>
        <small>Please ask your parent for your personalized link</small>
      `;
      return;
    }

    const response = await fetch(`${API_URL}?user_id=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }

    videos = await response.json();

    if (videos.length === 0) {
      videoGrid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      emptyState.innerHTML = `
        <p>No videos available yet</p>
        <small>Ask your parent to add some videos</small>
      `;
      return;
    }

    videoGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    renderVideos();
  } catch (error) {
    console.error('Error loading videos:', error);
    videoGrid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.innerHTML = `
      <p>Oops! Something went wrong</p>
      <small>Please try refreshing the page</small>
    `;
  }
}

// Render video grid
function renderVideos() {
  videoGrid.innerHTML = videos
    .map(
      (video, index) => `
    <div class="video-card" onclick="playVideo(${index})">
      <div class="video-thumbnail">
        <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg"
             alt="${video.title}"
             onerror="this.src='https://img.youtube.com/vi/${video.id}/hqdefault.jpg'">
        <div class="play-icon"></div>
      </div>
      <div class="video-info">
        <div class="video-title">${video.title}</div>
      </div>
    </div>
  `
    )
    .join('');
}

// This function will be called when the YouTube IFrame API is ready
function onYouTubeIframeAPIReady() {
  console.log('YouTube IFrame API is ready');
}

// Play video
function playVideo(index) {
  currentVideoIndex = index;
  const video = videos[index];

  // Show player section
  playerSection.classList.remove('hidden');
  gallerySection.style.display = 'none';

  // Get the channel ID from the current video to use in related videos
  // This will be set through player parameters

  // Destroy existing player if any
  if (player) {
    player.destroy();
  }

  // Create new player with specific configuration
  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: video.id,
    playerVars: {
      autoplay: 1,                // Auto-play video when loaded
      rel: 0,                     // Only show related videos from same channel
      fs: 1,                      // Show fullscreen button
      playsinline: 1,             // Play inline on iOS (prevents auto-fullscreen)
      controls: 1,                // Show player controls
      disablekb: 1,               // Disable keyboard controls to prevent accidental skips
      iv_load_policy: 3,          // Hide video annotations
      cc_load_policy: 1,          // Show closed captions by default (helpful for learning)
      color: 'red',               // Use red progress bar (more kid-friendly)
      widget_referrer: window.location.href  // Track referrer for analytics
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

// Player ready event
function onPlayerReady(event) {
  event.target.playVideo();
}

// Player state change event
function onPlayerStateChange(event) {
  // When video ends (state 0), play next video
  if (event.data === YT.PlayerState.ENDED) {
    playNextVideo();
  }
}

// Play next video
function playNextVideo() {
  currentVideoIndex = (currentVideoIndex + 1) % videos.length;
  playVideo(currentVideoIndex);
}

// Close player
closePlayerBtn.addEventListener('click', () => {
  if (player) {
    player.stopVideo();
  }
  playerSection.classList.add('hidden');
  gallerySection.style.display = 'block';
});

// Prevent accidental navigation away
window.addEventListener('beforeunload', (e) => {
  if (player && player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Handle orientation change for better video experience
window.addEventListener('orientationchange', () => {
  if (player && !playerSection.classList.contains('hidden')) {
    setTimeout(() => {
      player.setSize('100%', '100%');
    }, 100);
  }
});

// Initialize app
userId = getUserIdFromURL();
loadVideos();

// Reload videos every 30 seconds to get updates from CMS
setInterval(loadVideos, 30000);
