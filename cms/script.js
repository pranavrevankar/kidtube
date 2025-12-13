const API_URL = '/api/videos';
const PROFILE_API_URL = '/api/child-profile';

// Clerk instance
let clerk;
let userId;
let sessionToken;
let childProfile = null;
let signInMounted = false;
let onboardingFormMounted = false;
let cmsSetupComplete = false;
let initialSignInComplete = false;

// DOM elements (cache only elements that won't be replaced)
const loadingScreen = document.getElementById('loading-screen');
const clerkSignin = document.getElementById('clerk-signin');
const cmsContent = document.getElementById('cms-content');
const onboardingModal = document.getElementById('onboarding-modal');
const messageDiv = document.getElementById('message');

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
  console.log('handleSignedIn called, initialSignInComplete:', initialSignInComplete);

  // Only run the full sign-in flow once
  if (initialSignInComplete) {
    console.log('Initial sign-in already complete, skipping handleSignedIn');
    return;
  }

  userId = clerk.user.id;
  sessionToken = await clerk.session.getToken();

  // Load child profile
  console.log('Loading child profile from database...');
  await loadChildProfile();
  console.log('Child profile loaded:', childProfile);

  // Check if onboarding is needed
  if (!childProfile) {
    showOnboardingModal();
    return;
  }

  // Show CMS content
  showCMSContent();

  // Mark initial sign-in as complete
  initialSignInComplete = true;
  console.log('Initial sign-in flow complete');
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
  console.log('showOnboardingModal called, onboardingFormMounted:', onboardingFormMounted);
  loadingScreen.style.display = 'none';
  clerkSignin.style.display = 'none';
  onboardingModal.style.display = 'flex';

  // Always ensure the form has the event listener
  // (It's safe to add multiple times - we use once: true to prevent duplicates)
  console.log('Ensuring onboarding form event listener is attached');
  const onboardingForm = document.getElementById('onboarding-form');
  console.log('onboardingForm element:', onboardingForm);

  if (!onboardingFormMounted) {
    console.log('First time - attaching event listener');
    onboardingForm.addEventListener('submit', handleOnboarding);
    onboardingFormMounted = true;
    console.log('Event listener attached');
  } else {
    console.log('Event listener was attached before, should still be active');
  }
}

// Handle onboarding form submission
async function handleOnboarding(e) {
  e.preventDefault();

  // Get fresh references to form inputs
  const nameInput = document.getElementById('child-name');
  const dobInput = document.getElementById('child-dob');

  console.log('nameInput element:', nameInput);
  console.log('nameInput.value:', nameInput?.value);
  console.log('dobInput element:', dobInput);
  console.log('dobInput.value:', dobInput?.value);

  const childName = nameInput.value.trim();
  const dateOfBirth = dobInput.value || null;

  console.log('Saving profile:', { childName, dateOfBirth }); // Debug log

  if (!childName) {
    alert('Please enter your child\'s name');
    return;
  }

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
      const newProfile = await response.json();
      console.log('Profile saved successfully:', newProfile);
      childProfile = newProfile;
      onboardingModal.style.display = 'none';

      // Update personalization immediately with new profile data
      console.log('Calling updatePersonalization with:', childProfile);
      updatePersonalization();
      console.log('Personalization updated');

      // Only call showCMSContent if CMS is not already displayed
      if (cmsContent.style.display === 'none') {
        console.log('CMS was hidden, calling showCMSContent');
        showCMSContent();
      } else {
        console.log('CMS already visible, skipping showCMSContent');
      }
    } else {
      const data = await response.json();
      console.error('Profile save error:', data);
      alert(data.error || 'Failed to save profile. Please try again.');
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Failed to save profile. Please try again.');
  }
}

// Show CMS content with personalization
function showCMSContent() {
  console.log('showCMSContent called, cmsSetupComplete:', cmsSetupComplete);

  // Hide other screens
  loadingScreen.style.display = 'none';
  clerkSignin.style.display = 'none';
  onboardingModal.style.display = 'none';

  cmsContent.style.display = 'block';

  // Only update personalization on first setup
  // After that, updatePersonalization should be called explicitly when needed
  if (!cmsSetupComplete) {
    console.log('First time setup, calling updatePersonalization');
    // Personalize UI with child's name
    updatePersonalization();
  } else {
    console.log('Already setup, skipping updatePersonalization in showCMSContent');
  }

  // Only setup event listeners and load data once
  if (!cmsSetupComplete) {
    // Mount user button (only once)
    const userButtonContainer = document.getElementById('user-button');
    if (!userButtonContainer.hasChildNodes()) {
      clerk.mountUserButton(userButtonContainer);
    }

    // Set share link
    const baseUrl = window.location.origin;
    const shareLinkInput = document.getElementById('share-link');
    shareLinkInput.value = `${baseUrl}/view?user_id=${userId}`;

    // Setup open link button
    const openLinkBtn = document.getElementById('open-link-btn');
    openLinkBtn.addEventListener('click', () => {
      const link = document.getElementById('share-link').value;
      window.open(link, '_blank');
    });

    // Setup onboarding form event listener if not already done
    // (This is needed for users who already have a profile)
    if (!onboardingFormMounted) {
      console.log('Setting up onboarding form event listener during CMS setup');
      const onboardingForm = document.getElementById('onboarding-form');
      onboardingForm.addEventListener('submit', handleOnboarding);
      onboardingFormMounted = true;
    }

    // Setup edit profile button
    const editBtn = document.getElementById('edit-profile-btn');
    editBtn.style.display = 'flex';
    editBtn.addEventListener('click', () => {
      console.log('Edit Profile button clicked');
      console.log('Current childProfile:', childProfile);

      // Pre-fill the form with current profile data
      const nameInput = document.getElementById('child-name');
      const dobInput = document.getElementById('child-dob');
      console.log('Setting name input to:', childProfile.child_name);
      console.log('Setting dob input to:', childProfile.date_of_birth);
      nameInput.value = childProfile.child_name;
      dobInput.value = childProfile.date_of_birth || '';

      // Show the modal
      console.log('Showing onboarding modal for editing');
      onboardingModal.style.display = 'flex';
    });

    // Setup add video form
    const addVideoForm = document.getElementById('add-video-form');
    addVideoForm.addEventListener('submit', handleAddVideo);

    // Load videos for this user
    loadVideos();

    // Load popular videos
    loadPopularVideos();

    cmsSetupComplete = true;
  }
}

// Update personalization with child's name
function updatePersonalization() {
  console.log('updatePersonalization called with childProfile:', childProfile);

  if (!childProfile || !childProfile.child_name) {
    console.log('No childProfile or child_name, exiting');
    return;
  }

  const childName = childProfile.child_name;
  console.log('Updating UI with name:', childName);

  // Update app title
  const displayElement = document.getElementById('child-name-display');
  console.log('child-name-display element:', displayElement);
  if (displayElement) {
    displayElement.textContent = `${childName}'s KidTube`;
    console.log('Updated child-name-display to:', displayElement.textContent);
  }

  // Update hero section
  const heroElement = document.getElementById('child-name-hero');
  const subtitleElement = document.getElementById('child-name-subtitle');
  console.log('hero element:', heroElement, 'subtitle element:', subtitleElement);

  if (heroElement) {
    heroElement.textContent = `${childName}'s`;
    console.log('Updated child-name-hero to:', heroElement.textContent);
  }
  if (subtitleElement) {
    subtitleElement.textContent = childName;
    console.log('Updated child-name-subtitle to:', subtitleElement.textContent);
  }
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
    const videoCount = document.getElementById('video-count');
    const videoList = document.getElementById('video-list');

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

  if (!urlInput) {
    console.error('URL input not found');
    showMessage('Form error - please refresh the page', 'error');
    return;
  }

  const url = urlInput.value.trim();
  const title = titleInput ? titleInput.value.trim() : '';

  console.log('Adding video:', { url, title }); // Debug log

  if (!url) {
    showMessage('Please enter a YouTube URL', 'error');
    return;
  }

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
      if (titleInput) titleInput.value = '';
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
