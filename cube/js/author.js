/* js/author.js */
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const authorName = urlParams.get("author");
  const authorNameHeader = document.getElementById("author-name");
  const authorStoriesSection = document.getElementById("author-stories");
  const supportContainer = document.getElementById("support-container");
  const footerYear = document.getElementById("footer-year");

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  if (!authorName) {
    authorStoriesSection.innerHTML = "<p>Error: No author specified.</p>";
    return;
  }

  authorNameHeader.textContent = authorName;

  fetch("data/manifest.json")
    .then(response => response.json())
    .then(manifest => {
      const storyFiles = manifest.stories;
      const fetchPromises = storyFiles.map(file =>
        fetch(`data/${file}`)
        .then(res => res.json())
        .then(data => {
          data.file = file;
          // Also calculate a snippet from the first chapter for author cards
          const chapters = Object.values(data.chapters);
          data.snippet = chapters.length > 0 ? chapters[0].substring(0, 150) + "..." : "";
          return data;
        })
      );
      return Promise.all(fetchPromises);
    })
    .then(stories => {
      const authorStories = stories.filter(story =>
        story.author.trim().toLowerCase() === authorName.trim().toLowerCase()
      );
      if (authorStories.length === 0) {
        authorStoriesSection.innerHTML = "<p>No stories found for this author.</p>";
        return;
      }
      renderAuthorStories(authorStories);

      // From the first story, if supportLink exists, add a support button
      const firstStory = authorStories[0];
      if (firstStory.supportLink) {
        const supportBtn = document.createElement("button");
        supportBtn.textContent = "Support Author";
        supportBtn.addEventListener("click", () => {
          window.open(firstStory.supportLink, "_blank");
        });
        supportContainer.appendChild(supportBtn);
      }
    })
    .catch(error => console.error("Error loading stories for author:", error));

  function renderAuthorStories(storiesArray) {
    authorStoriesSection.innerHTML = "";
    storiesArray.forEach(story => {
      const card = document.createElement("div");
      card.className = "story-card";
      card.innerHTML = `
        <div class="card-header">
          <h2 class="card-title">${story.title}</h2>
          <p class="card-author">By ${story.author}</p>
        </div>
        <div class="card-snippet">
          <p>${story.snippet}</p>
        </div>
      `;
      card.addEventListener("click", () => {
        window.location.href = "story.html?file=" + encodeURIComponent(story.file);
      });
      authorStoriesSection.appendChild(card);
    });
  }
});