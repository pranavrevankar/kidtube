const API_URL = '/api/videos';
const PROFILE_API_URL = '/api/child-profile';

// Clerk instance
let clerk;
let userId;
let sessionToken;
let childProfile = null;
let signInMounted = false;

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const clerkSignin = document.getElementById('clerk-signin');
const cmsContent = document.getElementById('cms-content');
const onboardingModal = document.getElementById('onboarding-modal');
const onboardingForm = document.getElementById('onboarding-form');
const childNameInput = document.getElementById('child-name');
const childDobInput = document.getElementById('child-dob');
const addVideoForm = document.getElementById('add-video-form');
const videoUrlInput = document.getElementById('video-url');
const videoTitleInput = document.getElementById('video-title');
const messageDiv = document.getElementById('message');
const videoList = document.getElementById('video-list');
const videoCount = document.getElementById('video-count');
const shareLinkInput = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const editProfileBtn = document.getElementById('edit-profile-btn');

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
    clerk.addListener(async ({ user, session }) => {
      if (user && session) {
        await handleSignedIn();
      } else if (!user) {
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

  // Unmount if already mounted to avoid conflicts
  if (signInMounted) {
    try {
      clerk.unmountSignIn(document.getElementById('sign-in'));
    } catch (error) {
      console.log('Error unmounting sign-in:', error);
    }
  }

  // Mount Clerk sign-in component
  clerk.mountSignIn(document.getElementById('sign-in'), {
    fallbackRedirectUrl: '/',
    signUpFallbackRedirectUrl: '/'
  });

  signInMounted = true;
}

// Handle signed-in state
async function handleSignedIn() {
  userId = clerk.user.id;
  sessionToken = await clerk.session.getToken();

  // Load child profile
  await loadChildProfile();

  // Check if onboarding is needed
  if (!childProfile) {
    showOnboardingModal();
    return;
  }

  // Show CMS content
  showCMSContent();
}

// Load child profile
async function loadChildProfile() {
  try {
    const response = await fetch(PROFILE_API_URL, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (response.ok) {
      childProfile = await response.json();
    }
  } catch (error) {
    console.error('Error loading child profile:', error);
  }
}

// Show onboarding modal
function showOnboardingModal() {
  loadingScreen.style.display = 'none';
  clerkSignin.style.display = 'none';
  onboardingModal.style.display = 'flex';

  // Setup onboarding form
  onboardingForm.addEventListener('submit', handleOnboarding);
}

// Handle onboarding form submission
async function handleOnboarding(e) {
  e.preventDefault();

  const childName = childNameInput.value.trim();
  const dateOfBirth = childDobInput.value || null;

  try {
    const response = await fetch(PROFILE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        child_name: childName,
        date_of_birth: dateOfBirth
      })
    });

    if (response.ok) {
      childProfile = await response.json();
      onboardingModal.style.display = 'none';
      showCMSContent();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to save profile. Please try again.');
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Failed to save profile. Please try again.');
  }
}

// Show CMS content with personalization
function showCMSContent() {
  // Hide other screens
  loadingScreen.style.display = 'none';
  clerkSignin.style.display = 'none';
  onboardingModal.style.display = 'none';

  cmsContent.style.display = 'block';

  // Personalize UI with child's name
  updatePersonalization();

  // Mount user button (only once)
  const userButtonContainer = document.getElementById('user-button');
  if (!userButtonContainer.hasChildNodes()) {
    clerk.mountUserButton(userButtonContainer);
  }

  // Set share link
  const baseUrl = window.location.origin;
  shareLinkInput.value = `${baseUrl}/view?user_id=${userId}`;

  // Setup copy link button (remove old listener first)
  const newCopyBtn = copyLinkBtn.cloneNode(true);
  copyLinkBtn.parentNode.replaceChild(newCopyBtn, copyLinkBtn);
  document.getElementById('copy-link-btn').addEventListener('click', () => {
    shareLinkInput.select();
    document.execCommand('copy');
    showMessage('Link copied to clipboard!', 'success');
  });

  // Setup edit profile button (remove old listener first)
  const newEditBtn = editProfileBtn.cloneNode(true);
  editProfileBtn.parentNode.replaceChild(newEditBtn, editProfileBtn);
  const editBtn = document.getElementById('edit-profile-btn');
  editBtn.style.display = 'flex';
  editBtn.addEventListener('click', () => {
    childNameInput.value = childProfile.child_name;
    childDobInput.value = childProfile.date_of_birth || '';
    onboardingModal.style.display = 'flex';
  });

  // Setup add video form (remove old listener first)
  const newForm = addVideoForm.cloneNode(true);
  addVideoForm.parentNode.replaceChild(newForm, addVideoForm);
  document.getElementById('add-video-form').addEventListener('submit', handleAddVideo);

  // Load videos for this user
  loadVideos();

  // Load popular videos
  loadPopularVideos();
}

// Update personalization with child's name
function updatePersonalization() {
  if (!childProfile || !childProfile.child_name) return;

  const childName = childProfile.child_name;

  // Update app title
  document.getElementById('child-name-display').textContent = `${childName}'s KidTube`;

  // Update hero section
  document.getElementById('child-name-hero').textContent = `${childName}'s`;
  document.getElementById('child-name-subtitle').textContent = childName;
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

  // Get fresh references to form elements
  const urlInput = document.getElementById('video-url');
  const titleInput = document.getElementById('video-title');

  const url = urlInput.value.trim();
  const title = titleInput.value.trim();

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
      urlInput.value = '';
      titleInput.value = '';
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

// Load popular videos
async function loadPopularVideos() {
  const popularVideosList = document.getElementById('popular-videos-list');

  try {
    const response = await fetch('/api/videos/popular');

    if (!response.ok) {
      throw new Error('Failed to fetch popular videos');
    }

    const popularVideos = await response.json();

    if (popularVideos.length === 0) {
      popularVideosList.innerHTML = `
        <div class="empty-popular">
          <p>No popular videos yet</p>
          <small>Be the first to add videos!</small>
        </div>
      `;
      return;
    }

    popularVideosList.innerHTML = popularVideos
      .map((video, index) => `
        <div class="popular-video-item">
          <div class="popular-rank">#${index + 1}</div>
          <img src="https://img.youtube.com/vi/${video.id}/default.jpg" alt="${video.title}" class="popular-thumbnail">
          <div class="popular-info">
            <div class="popular-title">${video.title}</div>
            <div class="popular-count">${video.addedByCount} ${video.addedByCount === 1 ? 'parent' : 'parents'}</div>
          </div>
          <button class="btn-add-popular" onclick="addPopularVideo('${video.id}', '${video.title.replace(/'/g, "\\'")}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      `)
      .join('');
  } catch (error) {
    console.error('Error loading popular videos:', error);
    popularVideosList.innerHTML = `
      <div class="empty-popular">
        <p>Failed to load popular videos</p>
      </div>
    `;
  }
}

// Add popular video to user's collection
async function addPopularVideo(videoId, videoTitle) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        url: videoId,
        title: videoTitle
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage('Video added successfully!', 'success');
      loadVideos();
      // Reload popular videos to update counts
      loadPopularVideos();
    } else {
      showMessage(data.error || 'Failed to add video', 'error');
    }
  } catch (error) {
    console.error('Error adding video:', error);
    showMessage('Failed to add video', 'error');
  }
}

// Make functions available globally
window.deleteVideo = deleteVideo;
window.addPopularVideo = addPopularVideo;

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClerk);
} else {
  initClerk();
}
