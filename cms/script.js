const API_URL = '/api/videos';

// Clerk instance
let clerk;
let userId;
let sessionToken;

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const clerkSignin = document.getElementById('clerk-signin');
const cmsContent = document.getElementById('cms-content');
const addVideoForm = document.getElementById('add-video-form');
const videoUrlInput = document.getElementById('video-url');
const videoTitleInput = document.getElementById('video-title');
const messageDiv = document.getElementById('message');
const videoList = document.getElementById('video-list');
const videoCount = document.getElementById('video-count');
const shareLinkInput = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link-btn');

// Initialize Clerk
async function initClerk() {
  try {
    const publishableKey = window.CLERK_PUBLISHABLE_KEY;

    if (!publishableKey || publishableKey === 'CLERK_PUBLISHABLE_KEY_PLACEHOLDER') {
      loadingScreen.innerHTML = '<p>Configuration error. Please check your environment variables.</p>';
      return;
    }

    // Wait for Clerk to be available
    if (!window.Clerk) {
      setTimeout(initClerk, 100);
      return;
    }

    clerk = window.Clerk;

    await clerk.load({
      publishableKey: publishableKey
    });

    // Check if user is signed in
    if (clerk.user) {
      await handleSignedIn();
    } else {
      showSignIn();
    }

    // Listen for sign in state changes
    clerk.addListener(({ user }) => {
      if (user) {
        handleSignedIn();
      } else {
        showSignIn();
      }
    });
  } catch (error) {
    console.error('Error initializing Clerk:', error);
    loadingScreen.innerHTML = `<p>Error loading authentication: ${error.message}</p><small>Please refresh the page.</small>`;
  }
}

// Show sign-in screen
function showSignIn() {
  loadingScreen.style.display = 'none';
  clerkSignin.style.display = 'flex';
  cmsContent.style.display = 'none';

  // Mount Clerk sign-in component
  clerk.mountSignIn(document.getElementById('sign-in'), {
    afterSignInUrl: '/cms',
    afterSignUpUrl: '/cms',
    redirectUrl: '/cms'
  });
}

// Handle signed-in state
async function handleSignedIn() {
  userId = clerk.user.id;
  sessionToken = await clerk.session.getToken();

  // Show CMS content
  loadingScreen.style.display = 'none';
  clerkSignin.style.display = 'none';
  cmsContent.style.display = 'block';

  // Mount user button
  clerk.mountUserButton(document.getElementById('user-button'));

  // Set share link
  const baseUrl = window.location.origin;
  shareLinkInput.value = `${baseUrl}/?user_id=${userId}`;

  // Setup copy link button
  copyLinkBtn.addEventListener('click', () => {
    shareLinkInput.select();
    document.execCommand('copy');
    showMessage('Link copied to clipboard!', 'success');
  });

  // Setup add video form
  addVideoForm.addEventListener('submit', handleAddVideo);

  // Load videos for this user
  loadVideos();
}

// Show message
function showMessage(text, type = 'success') {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type} show`;
  setTimeout(() => {
    messageDiv.className = 'message';
  }, 5000);
}

// Load videos for the authenticated user
async function loadVideos() {
  try {
    const response = await fetch(`${API_URL}?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }

    const videos = await response.json();
    videoCount.textContent = videos.length;

    if (videos.length === 0) {
      videoList.innerHTML = `
        <div class="empty-state">
          <p>No videos added yet</p>
          <small>Add your first video using the form above</small>
        </div>
      `;
      return;
    }

    videoList.innerHTML = videos
      .map(
        (video) => `
      <div class="video-card" data-id="${video.id}">
        <div class="video-thumbnail">
          <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" alt="${video.title}">
        </div>
        <div class="video-info">
          <div class="video-title">${video.title}</div>
          <div class="video-meta">
            <span class="video-id">${video.id}</span>
            <button class="btn btn-danger" onclick="deleteVideo('${video.id}')">Delete</button>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Error loading videos:', error);
    showMessage('Failed to load videos', 'error');
  }
}

// Add video handler
async function handleAddVideo(e) {
  e.preventDefault();

  const url = videoUrlInput.value.trim();
  const title = videoTitleInput.value.trim();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ url, title }),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage('Video added successfully!', 'success');
      videoUrlInput.value = '';
      videoTitleInput.value = '';
      loadVideos();
    } else {
      showMessage(data.error || 'Failed to add video', 'error');
    }
  } catch (error) {
    console.error('Error adding video:', error);
    showMessage('Failed to add video', 'error');
  }
}

// Delete video
async function deleteVideo(id) {
  if (!confirm('Are you sure you want to delete this video?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (response.ok) {
      showMessage('Video deleted successfully!', 'success');
      loadVideos();
    } else {
      const data = await response.json();
      showMessage(data.error || 'Failed to delete video', 'error');
    }
  } catch (error) {
    console.error('Error deleting video:', error);
    showMessage('Failed to delete video', 'error');
  }
}

// Make deleteVideo available globally
window.deleteVideo = deleteVideo;

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClerk);
} else {
  initClerk();
}
