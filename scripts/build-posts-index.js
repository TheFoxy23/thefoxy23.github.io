#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const postsDir = path.join(repoRoot, "data", "posts");
const outputFile = path.join(repoRoot, "data", "posts.json");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function toIsoDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function getGitCreatedAt(filePath) {
  const relativeFilePath = path.relative(repoRoot, filePath).split(path.sep).join("/");

  try {
    const output = execFileSync(
      "git",
      [
        "-C",
        repoRoot,
        "log",
        "--diff-filter=A",
        "--follow",
        "--format=%cI",
        "-1",
        "--",
        relativeFilePath,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();

    return output || null;
  } catch {
    return null;
  }
}

function validatePost(raw, sourceFile) {
  const requiredFields = ["id", "title", "description", "content"];
  for (const field of requiredFields) {
    if (!isNonEmptyString(raw[field])) {
      throw new Error(`${sourceFile}: missing required field \"${field}\"`);
    }
  }

  if (!Array.isArray(raw.tags) || raw.tags.length === 0) {
    throw new Error(`${sourceFile}: \"tags\" must be a non-empty array`);
  }

  const invalidTag = raw.tags.find((tag) => !isNonEmptyString(tag));
  if (invalidTag !== undefined) {
    throw new Error(`${sourceFile}: \"tags\" must contain only non-empty strings`);
  }
}

async function loadPosts() {
  const entries = await fs.readdir(postsDir, { withFileTypes: true });

  const postFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(".json"))
    .filter((name) => !name.startsWith("_"))
    .sort();

  if (postFiles.length === 0) {
    return [];
  }

  const posts = [];
  const seenIds = new Set();

  for (const fileName of postFiles) {
    const absolutePath = path.join(postsDir, fileName);
    const fileBody = await fs.readFile(absolutePath, "utf8");

    let rawPost;
    try {
      rawPost = JSON.parse(fileBody);
    } catch (error) {
      throw new Error(`${fileName}: invalid JSON (${error.message})`);
    }

    validatePost(rawPost, fileName);

    if (seenIds.has(rawPost.id)) {
      throw new Error(`${fileName}: duplicate id \"${rawPost.id}\"`);
    }
    seenIds.add(rawPost.id);

    const gitCreatedAt = getGitCreatedAt(absolutePath);
    const stat = await fs.stat(absolutePath);

    const publishedCandidate =
      rawPost.publishedAt || rawPost.date || gitCreatedAt || stat.mtime.toISOString();

    const publishedAt = toIsoDate(publishedCandidate);
    if (!publishedAt) {
      throw new Error(`${fileName}: invalid publication date value`);
    }

    posts.push({
      ...rawPost,
      id: rawPost.id.trim(),
      title: rawPost.title.trim(),
      description: rawPost.description.trim(),
      content: rawPost.content.trim(),
      tags: rawPost.tags.map((tag) => tag.trim()),
      lang: isNonEmptyString(rawPost.lang) ? rawPost.lang.trim().toLowerCase() : "en",
      publishedAt,
      date: publishedAt,
      source: `data/posts/${fileName}`,
    });
  }

  posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  return posts;
}

async function main() {
  const posts = await loadPosts();
  const output = `${JSON.stringify(posts, null, 2)}\n`;

  await fs.writeFile(outputFile, output, "utf8");
  console.log(`Generated data/posts.json with ${posts.length} posts.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
