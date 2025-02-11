/* js/story.js */
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const file = urlParams.get("file");
  const storyContent = document.getElementById("story-content");
  const storyHeaderTitle = document.getElementById("story-header-title");
  const footerYear = document.getElementById("footer-year");

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  if (!file) {
    storyContent.innerHTML = "<p>Error: No story file specified.</p>";
    return;
  }

  // Fetch the story JSON file
  fetch(`data/${file}`)
    .then(response => response.json())
    .then(data => {
      storyHeaderTitle.textContent = data.title;

      const titleElement = document.createElement("h2");
      titleElement.textContent = data.title;
      storyContent.appendChild(titleElement);

      // Render each chapter
      for (const [chapterKey, chapterContent] of Object.entries(data.chapters)) {
        const chapterElement = document.createElement("section");
        chapterElement.className = "chapter";
        const chapterTitle = document.createElement("h3");
        chapterTitle.textContent = chapterKey.charAt(0).toUpperCase() + chapterKey.slice(1);
        const chapterText = document.createElement("p");
        chapterText.textContent = chapterContent;
        chapterElement.appendChild(chapterTitle);
        chapterElement.appendChild(chapterText);
        storyContent.appendChild(chapterElement);
      }

      // Add link to navigate to the author page
      const authorLink = document.createElement("a");
      authorLink.href = "author.html?author=" + encodeURIComponent(data.author);
      authorLink.textContent = `المزيد من القصص ل${data.author}`;
      authorLink.className = "author-link";
      storyContent.appendChild(authorLink);

      // Restore scroll position if saved
      const savedScroll = localStorage.getItem(`scroll_${file}`);
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll), behavior: "smooth" });
        }, 100);
      }

      // Save resume info for the main page
      localStorage.setItem("resumeStory", JSON.stringify({ file: file, title: data.title }));
    })
    .catch(error => {
      storyContent.innerHTML = "<p>Error loading story.</p>";
      console.error("Error loading story:", error);
    });

  // Save scroll position periodically
  let timeoutId;
  window.addEventListener("scroll", () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      localStorage.setItem(`scroll_${file}`, window.scrollY);
    }, 200);
  });
});