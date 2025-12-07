const API_URL = '/api/videos';

// DOM elements
const addVideoForm = document.getElementById('add-video-form');
const videoUrlInput = document.getElementById('video-url');
const videoTitleInput = document.getElementById('video-title');
const messageDiv = document.getElementById('message');
const videoList = document.getElementById('video-list');
const videoCount = document.getElementById('video-count');

// Show message
function showMessage(text, type = 'success') {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type} show`;
  setTimeout(() => {
    messageDiv.className = 'message';
  }, 5000);
}

// Load videos
async function loadVideos() {
  try {
    const response = await fetch(API_URL);
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

// Add video
addVideoForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const url = videoUrlInput.value.trim();
  const title = videoTitleInput.value.trim();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
});

// Delete video
async function deleteVideo(id) {
  if (!confirm('Are you sure you want to delete this video?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
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

// Initial load
loadVideos();
