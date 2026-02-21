# The Analytical Stack

Personal website and developer journal for Giacomo Tarmati — a static HTML/CSS/JS site that hosts a small blog, project pages, and site components.

## Table of contents

- Project overview
- Quick start
- Local development
- Blog posts workflow
- Project structure (key files)
- Components and behavior notes
- Deploying the site
- Troubleshooting
- Contributing
- License & author

## Project overview

This repository contains a minimal, hand-crafted static website used as a developer journal and portfolio. The site is written with plain HTML, CSS and JavaScript and includes:

- A collection of static pages (Home, About, Projects, Contact)
- A small blog implemented as JSON posts in `data/posts` and rendered client-side
- A script to build `data/posts.json` from individual post files
- Reusable header/footer components dynamically injected into pages
- A GitHub Actions workflow that rebuilds the posts index on changes to `data/posts`

## Quick start

Requirements:

- Node.js (recommended v20 to match CI), Git (for `scripts/build-posts-index.js` git metadata). A simple static HTTP server is required to preview pages (file:// will not work for fetch).

To preview locally using Python (quick):

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in the browser
```

Or using a Node static server (if you have npm):

```bash
npx http-server -c-1 -p 8000
# or
npx live-server --port=8000
```

## Local development

- Start an HTTP server from the repository root so `fetch()` requests succeed.
- The site uses relative paths and a small components loader; pages in the `blog/` folder use a different base path logic (see Components and behavior notes).

### Rebuild posts index locally

The repository includes a script that reads each JSON file in `data/posts`, validates fields, and writes `data/posts.json`. To run it locally:

```bash
node scripts/build-posts-index.js
```

Notes:
- The script uses `git` to determine a file creation timestamp (used when `publishedAt` is empty). If `git` is not available, the created date may not be inferred.
- The GitHub Actions workflow `/.github/workflows/build-posts-index.yml` runs this script automatically on pushes that modify `data/posts`.

## Blog posts workflow

Add a new post by copying the template in `data/posts/_template.json`, renaming it to your-slug.json and filling the fields. Key rules:

- `id`: unique slug for the post
- `title`, `description`, `content` are required
- `tags`: non-empty array of strings
- `lang`: language code (e.g., `it` or `en`)
- `publishedAt`: optional; if empty the script will try to use git first commit timestamp

See [data/posts/README.md](data/posts/README.md) for the exact workflow and requirements.

After adding or editing posts locally, run:

```bash
node scripts/build-posts-index.js
```

And verify `data/posts.json` updated. When pushing to the remote, the repository actions will also rebuild and commit the generated index automatically.

## Project structure (key files)

- [index.html](index.html) — homepage with animated matrix canvas and hero section
- [about.html](about.html) — About page
- [projects.html](projects.html) — Projects listing
- [contact.html](contact.html) — Contact page
- [blog/index.html](blog/index.html) — Blog index (renders posts from `data/posts.json`)
- [blog/post.html](blog/post.html) — Single post viewer (reads `id` from URL)
- [blogDeveloping.html](blogDeveloping.html) — Placeholder/landing for the blog route
- [components/header.html](components/header.html) — Header component
- [components/footer.html](components/footer.html) — Footer component
- [css/style.css](css/style.css) — Site styles
- [js/components.js](js/components.js) — Component loader (injects header/footer)
- [js/blog.js](js/blog.js) — Blog rendering utilities (index + single post)
- [js/main.js](js/main.js) — Homepage utilities (matrix animation, latest posts)
- [data/posts](data/posts) — Individual post JSON files and `_template.json`
- [data/posts.json](data/posts.json) — Generated posts index used by client JS
- [scripts/build-posts-index.js](scripts/build-posts-index.js) — Script that generates `data/posts.json`
- [.github/workflows/build-posts-index.yml](.github/workflows/build-posts-index.yml) — CI workflow that rebuilds the index

## Components and behavior notes

- The header and footer are loaded dynamically by `js/components.js`. The loader uses a base path detection: pages inside `/blog/` set `basePath` to `..` so components and assets are resolved correctly.
- The site uses `fetch()` to load `data/posts.json` and components; therefore the site must be served over HTTP during development.
- Homepage matrix animation is implemented in `js/main.js` and respects `prefers-reduced-motion`.
- Icon rendering is performed using Lucide (loaded via CDN) and the component loader calls `window.lucide.createIcons()` after injecting components.

## Deploying the site

This is a static site and can be hosted on any static hosting provider (GitHub Pages, Netlify, Vercel, S3 + CloudFront, etc.).

Recommendations for GitHub Pages:

- Deploy the repository root as the site source (not the /docs folder). The files are already structured for a root deployment.
- If you use a custom domain or a subpath, double-check relative paths in `blog/*.html` and the components loader behavior.

## Troubleshooting

- Page shows blank or posts fail to load: ensure you are serving the site via HTTP, not opening files via `file://`.
- `node scripts/build-posts-index.js` fails: confirm Node.js version (use Node 20 to match CI) and that `git` is available on PATH.
- New posts not appearing on GitHub: the repository contains a workflow that runs on push and will regenerate `data/posts.json`. If the workflow does not run, check `.github/workflows/build-posts-index.yml` and Actions settings.

## Contributing

Contributions are welcome. Suggestions:

- Create a branch, make edits, and open a pull request.
- When adding posts, follow [data/posts/README.md](data/posts/README.md) formatting rules to avoid CI validation errors.

## License & author

Author: Giacomo Tarmati

If you want to add a license, create a `LICENSE` file in the repository root with the desired license text (MIT, Apache-2.0, etc.).

If you want me to also add a sample LICENSE file or set up a local dev `package.json` with scripts, tell me which license or scripts you prefer and I can add them.

---

Generated and maintained alongside the site sources. For questions, open an issue or contact the author via the links on [contact.html](contact.html).
