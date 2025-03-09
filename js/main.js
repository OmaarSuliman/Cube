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
    const searchQuery = searchInput.value.toLowerCase();
    const searchWords = searchQuery.split(/\s+/).filter(word => word.length > 0);
    
    storiesArray.forEach(story => {
      const card = document.createElement("div");
      card.className = "story-card";
      
      // Helper function to highlight matched text
      const highlightMatches = (text) => {
        if (!searchQuery) return text;
        let highlighted = text;
        searchWords.forEach(word => {
          if (word.length > 0) {
            const regex = new RegExp(`(${word})`, 'gi');
            highlighted = highlighted.replace(regex, '<mark>$1</mark>');
          }
        });
        return highlighted;
      };

      // Build card content with highlighted matches
      card.innerHTML = `
        <div class="card-content">
          <div class="card-header">
            <h2 class="card-title">${highlightMatches(story.title)}</h2>
            <p class="card-author"> (ة) للكاتب : ${highlightMatches(story.author)}</p>
          </div>
          <div class="card-snippet">
            <p>${highlightMatches(story.snippet)}</p>
          </div>
        </div>
      `;
      
      card.addEventListener("click", () => {
        window.location.href = "story.html?file=" + encodeURIComponent(story.file);
      });
      storiesList.appendChild(card);
    });
  }

  // Enhanced search functionality
  searchInput.addEventListener("input", debounce(() => {
    const query = searchInput.value.toLowerCase();
    
    // If search is empty, show all stories
    if (!query.trim()) {
      renderStories(stories);
      return;
    }
    
    const searchWords = query.split(/\s+/).filter(word => word.length > 0);
    
    const getSearchScore = (story) => {
      if (searchWords.length === 0) return 0;
      let totalScore = 0;
      
      // Helper function to check word matches
      const checkWordMatches = (text, word) => {
        if (!text) return 0;
        text = text.toLowerCase();
        let score = 0;
        
        // Exact match
        if (text === word) score += 100;
        // Contains word
        if (text.includes(word)) score += 50;
        // Starts with word
        if (text.startsWith(word)) score += 25;
        // Word similarity (basic)
        if (levenshteinDistance(text, word) <= 2) score += 15;
        
        return score;
      };

      searchWords.forEach(word => {
        // Check title (highest weight)
        totalScore += checkWordMatches(story.title, word) * 2;
        
        // Check author
        totalScore += checkWordMatches(story.author, word) * 1.5;
        
        // Check tags
        if (story.tags) {
          story.tags.forEach(tag => {
            totalScore += checkWordMatches(tag, word) * 1.3;
          });
        }
        
        // Check keywords
        if (story.keywords) {
          story.keywords.forEach(keyword => {
            totalScore += checkWordMatches(keyword, word);
          });
        }
        
        // Check description
        if (story.description) {
          totalScore += checkWordMatches(story.description, word) * 0.8;
        }
        
        // Check story content (chapters)
        Object.values(story.chapters).forEach(chapter => {
          const words = chapter.toLowerCase().split(/\s+/);
          if (words.some(w => checkWordMatches(w, word) > 0)) {
            totalScore += 5;
          }
        });
      });

      return totalScore / searchWords.length; // Normalize by number of search words
    };

    // Levenshtein distance for fuzzy matching
    function levenshteinDistance(str1, str2) {
      const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));
      for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
      }
      for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
      }
      for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          track[j][i] = Math.min(
            track[j][i - 1] + 1,
            track[j - 1][i] + 1,
            track[j - 1][i - 1] + indicator
          );
        }
      }
      return track[str2.length][str1.length];
    }

    const filteredStories = stories
      .map(story => ({
        ...story,
        searchScore: getSearchScore(story)
      }))
      .filter(story => story.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore);

    renderStories(filteredStories);
  }, 300));

  // Debounce helper function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Resume reading functionality
  function checkResume() {
    const resumeData = localStorage.getItem("resumeStory");
    const resumeSection = document.getElementById("resume-section");
    const resumeTitle = document.getElementById("resume-title");
    
    if (resumeData) {
      const resumeObj = JSON.parse(resumeData);
      const lastRead = localStorage.getItem(`scroll_${resumeObj.file}`);
      
      if (lastRead) {
        resumeTitle.textContent = resumeObj.title;
        resumeSection.classList.remove("hidden");
        resumeSection.classList.add("visible");
        
        resumeSection.addEventListener("click", () => {
          window.location.href = "story.html?file=" + encodeURIComponent(resumeObj.file);
        });
      }
    }
  }

  // Add this to the DOMContentLoaded event listener
  document.addEventListener("mousemove", (e) => {
    document.querySelectorAll(".story-card").forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });
});
