function getBlogBasePath() {
  return window.location.pathname.includes("/blog/") ? ".." : ".";
}

function normalizePosts(posts) {
  return [...posts].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));
}

function getPostTimestamp(post) {
  const source = post.publishedAt || post.date;
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return 0;
  return parsed.getTime();
}

function getPostLocale(post) {
  if (typeof post.lang !== "string") return "en-US";
  return post.lang.toLowerCase().startsWith("it") ? "it-IT" : "en-US";
}

function formatPostDate(post) {
  const timestamp = getPostTimestamp(post);
  if (!timestamp) return "Unknown publication date";

  return new Intl.DateTimeFormat(getPostLocale(post), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

async function getPosts() {
  const basePath = getBlogBasePath();
  const response = await fetch(`${basePath}/data/posts.json`);
  if (!response.ok) throw new Error("Unable to read posts.json");

  const posts = await response.json();
  return normalizePosts(posts);
}

function createTags(tags, selectedLang) {
  const params = new URLSearchParams();
  if (selectedLang) params.set("lang", selectedLang);

  return tags
    .map((tag) => {
      const tagParams = new URLSearchParams(params);
      tagParams.set("tag", tag);
      return `<a class="tag" href="index.html?${tagParams.toString()}">${tag}</a>`;
    })
    .join("");
}

function createLanguageBadge(lang) {
  const language = typeof lang === "string" && lang.trim() ? lang.toUpperCase() : "EN";
  return `<span class="tag">${language}</span>`;
}

function renderFilterIndicator(indicator, selectedTag, selectedLang) {
  if (!indicator) return;

  const parts = [];
  if (selectedTag) parts.push(`<span class="tag">#${selectedTag}</span>`);
  if (selectedLang) parts.push(`<span class="tag">${selectedLang.toUpperCase()}</span>`);

  if (!parts.length) {
    indicator.textContent = "Technical notes, study methods, and personal reflections.";
    return;
  }

  indicator.innerHTML = `Active filters: ${parts.join(" ")}`;
}

async function renderBlogIndex() {
  const listContainer = document.getElementById("blog-post-list");
  if (!listContainer) return;

  const params = new URLSearchParams(window.location.search);
  const selectedTag = params.get("tag");
  const selectedLang = params.get("lang");
  const indicator = document.getElementById("tag-indicator");

  try {
    const posts = await getPosts();

    const filteredPosts = posts.filter((post) => {
      const tagMatch = selectedTag
        ? post.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())
        : true;

      const langMatch = selectedLang
        ? (post.lang || "").toLowerCase() === selectedLang.toLowerCase()
        : true;

      return tagMatch && langMatch;
    });

    renderFilterIndicator(indicator, selectedTag, selectedLang);

    if (!filteredPosts.length) {
      listContainer.innerHTML = `
        <article class="card">
          <h2>No matching posts</h2>
          <p class="muted">Try removing one or more filters.</p>
          <a class="inline-link" href="index.html">Reset filters</a>
        </article>
      `;
      return;
    }

    listContainer.innerHTML = filteredPosts
      .map(
        (post) => `
          <article class="card">
            <h2>${post.title}</h2>
            <p class="muted">${formatPostDate(post)}</p>
            <p>${post.description}</p>
            <div class="tag-list">
              ${createLanguageBadge(post.lang)}
              ${createTags(post.tags, selectedLang)}
            </div>
            <a class="inline-link" href="post.html?id=${post.id}">Read article</a>
          </article>
        `
      )
      .join("");
  } catch (error) {
    listContainer.innerHTML = `
      <article class="card">
        <h2>Loading error</h2>
        <p class="muted">I cannot load blog posts right now.</p>
      </article>
    `;
    console.error(error);
  }
}

async function renderSinglePost() {
  const postContainer = document.getElementById("post-content");
  if (!postContainer) return;

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  if (!postId) {
    postContainer.innerHTML = `
      <div class="card">
        <h1>Post not found</h1>
        <p class="muted">Missing id in URL query string.</p>
        <a class="inline-link" href="index.html">Back to blog</a>
      </div>
    `;
    return;
  }

  try {
    const posts = await getPosts();
    const post = posts.find((item) => item.id === postId);

    if (!post) {
      postContainer.innerHTML = `
        <div class="card">
          <h1>Post not found</h1>
          <p class="muted">The requested article does not exist.</p>
          <a class="inline-link" href="index.html">Back to blog</a>
        </div>
      `;
      return;
    }

    const paragraphs = post.content
      .split("\n\n")
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("");

    postContainer.innerHTML = `
      <header class="section">
        <h1>${post.title}</h1>
        <p class="muted">${formatPostDate(post)}</p>
        <div class="tag-list">
          ${createLanguageBadge(post.lang)}
          ${post.tags
            .map(
              (tag) => `<a class="tag" href="index.html?tag=${encodeURIComponent(tag)}">${tag}</a>`
            )
            .join("")}
        </div>
      </header>
      <section class="card post-body">
        ${paragraphs}
      </section>
    `;
  } catch (error) {
    postContainer.innerHTML = `
      <div class="card">
        <h1>Loading error</h1>
        <p class="muted">I cannot load this article right now.</p>
      </div>
    `;
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderBlogIndex();
  renderSinglePost();
});
