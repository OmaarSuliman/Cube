/* js/main.js */
document.addEventListener("DOMContentLoaded", () => {
  const storiesList = document.getElementById("stories-list");
  const searchInput = document.getElementById("search-input");
  const resumeSection = document.getElementById("resume-section");
  const resumeTitle = document.getElementById("resume-title");
  const footerYear = document.getElementById("footer-year");

  // Update footer year automatically
  footerYear.textContent = new Date().getFullYear();

  let stories = [];

  // Fisher-Yates Shuffle Algorithm to randomize the stories array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Load manifest file to get the list of story files
  fetch("data/manifest.json")
    .then(response => response.json())
    .then(manifest => {
      const storyFiles = manifest.stories;
      const fetchPromises = storyFiles.map(file =>
        fetch(`data/${file}`)
        .then(res => res.json())
        .then(data => {
          data.file = file;
          // Get a snippet from the first chapter (first 150 characters)
          const chapters = Object.values(data.chapters);
          data.snippet = chapters.length > 0 ? chapters[0].substring(0, 150) + "..." : "";
          return data;
        })
      );
      return Promise.all(fetchPromises);
    })
    .then(loadedStories => {
      stories = loadedStories;
      shuffleArray(stories); // Randomize the order of stories
      renderStories(stories);
      checkResume();
    })
    .catch(error => console.error("Error loading manifest or stories:", error));

  function renderStories(storiesArray) {
    storiesList.innerHTML = "";
    storiesArray.forEach(story => {
      const card = document.createElement("div");
      card.className = "story-card";
      // Build card content with title, author, and snippet
      card.innerHTML = `
        <div class="card-header">
          <h2 class="card-title">${story.title}</h2>
          <p class="card-author">للكاتب : ${story.author}</p>
        </div>
        <div class="card-snippet">
          <p>${story.snippet}</p>
        </div>
      `;
      card.addEventListener("click", () => {
        window.location.href = "story.html?file=" + encodeURIComponent(story.file);
      });
      storiesList.appendChild(card);
    });
  }

  // Search functionality
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filteredStories = stories.filter(story =>
      story.title.toLowerCase().includes(query) ||
      story.author.toLowerCase().includes(query)
    );
    renderStories(filteredStories);
  });

  // Resume reading functionality
  function checkResume() {
    const resumeData = localStorage.getItem("resumeStory");
    if (resumeData) {
      const resumeObj = JSON.parse(resumeData);
      resumeTitle.textContent = resumeObj.title;
      resumeSection.classList.remove("hidden");
      resumeSection.addEventListener("click", () => {
        window.location.href = "story.html?file=" + encodeURIComponent(resumeObj.file);
      });
    }
  }
});