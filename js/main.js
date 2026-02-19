function getPostTimestamp(post) {
  const source = post.publishedAt || post.date;
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return 0;
  return parsed.getTime();
}

function normalizePosts(posts) {
  return [...posts].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));
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

// Home page: render latest posts from JSON.
async function renderLatestPosts() {
  const latestPostsContainer = document.getElementById("latest-posts");
  if (!latestPostsContainer) return;

  const renderIcons = () => {
    if (window.lucide) window.lucide.createIcons();
  };

  try {
    const response = await fetch("./data/posts.json");
    if (!response.ok) throw new Error("Unable to read posts.json");

    const posts = normalizePosts(await response.json());
    const latest = posts.slice(0, 3);

    if (!latest.length) {
      latestPostsContainer.innerHTML = `
        <article class="card">
          <h3>No articles available</h3>
          <p class="muted">New posts will be published soon.</p>
        </article>
      `;
      renderIcons();
      return;
    }

    latestPostsContainer.innerHTML = latest
      .map(
        (post) => `
          <article class="card">
            <h3>${post.title}</h3>
            <p class="muted card-meta">
              <i data-lucide="calendar-days" class="icon icon-inline icon-violet" aria-hidden="true"></i>
              <span>${formatPostDate(post)}</span>
            </p>
            <p>${post.description}</p>
            <div class="tag-list">
              <span class="tag">${(post.lang || "en").toUpperCase()}</span>
            </div>
            <a class="inline-link" href="blog/post.html?id=${post.id}">
              <i data-lucide="arrow-right" class="icon icon-inline icon-accent" aria-hidden="true"></i>
              <span>Read article</span>
            </a>
          </article>
        `
      )
      .join("");

    renderIcons();
  } catch (error) {
    latestPostsContainer.innerHTML = `
      <article class="card">
        <h3>Loading error</h3>
        <p class="muted">I cannot load articles right now.</p>
      </article>
    `;
    renderIcons();
    console.error(error);
  }
}

// Matrix-style animated background generated in canvas.
function initMatrixCard() {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const glyphs = ["0", "1"];

  let dpr = window.devicePixelRatio || 1;
  let width = 0;
  let height = 0;
  let fontSize = 14;
  let columns = [];
  let rafId = 0;
  let lastFrame = 0;

  function resetCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));

    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.textBaseline = "top";

    fontSize = Math.max(13, Math.floor(width / 82));
    const columnCount = Math.ceil(width / fontSize);
    columns = Array.from({ length: columnCount }, () => Math.random() * -25);

    context.fillStyle = "#020603";
    context.fillRect(0, 0, width, height);
  }

  function drawStaticFrame() {
    context.fillStyle = "#020603";
    context.fillRect(0, 0, width, height);

    context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

    for (let x = 0; x < width; x += fontSize) {
      for (let y = 0; y < height; y += fontSize) {
        if (Math.random() > 0.72) {
          context.fillStyle = Math.random() > 0.9 ? "#9dffb0" : "#2ddf55";
          context.fillText(glyphs[Math.floor(Math.random() * 2)], x, y);
        }
      }
    }
  }

  function drawFrame(timestamp) {
    if (timestamp - lastFrame < 45) {
      rafId = window.requestAnimationFrame(drawFrame);
      return;
    }
    lastFrame = timestamp;

    context.fillStyle = "rgba(2, 6, 3, 0.2)";
    context.fillRect(0, 0, width, height);

    context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

    for (let index = 0; index < columns.length; index += 1) {
      const x = index * fontSize;
      const y = columns[index] * fontSize;

      const isHighlight = Math.random() > 0.92;
      context.fillStyle = isHighlight ? "#b2ffc4" : "#2ddf55";
      context.fillText(glyphs[Math.floor(Math.random() * 2)], x, y);

      if (y > height + Math.random() * height * 0.35) {
        columns[index] = Math.random() * -30;
      }

      columns[index] += isHighlight ? 1.35 : 1;
    }

    rafId = window.requestAnimationFrame(drawFrame);
  }

  function start() {
    window.cancelAnimationFrame(rafId);

    if (reduceMotion.matches) {
      drawStaticFrame();
      return;
    }

    lastFrame = 0;
    rafId = window.requestAnimationFrame(drawFrame);
  }

  function handleVisibility() {
    if (document.hidden) {
      window.cancelAnimationFrame(rafId);
      return;
    }
    start();
  }

  resetCanvasSize();
  start();

  window.addEventListener("resize", () => {
    resetCanvasSize();
    start();
  });

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", start);
  }

  document.addEventListener("visibilitychange", handleVisibility);
}

document.addEventListener("DOMContentLoaded", () => {
  renderLatestPosts();
  initMatrixCard();
});
