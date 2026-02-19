// Shared components loader for header and footer.
async function loadComponent(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Errore nel caricamento di ${path}`);
  return response.text();
}

async function mountLayoutComponents() {
  const isBlogPage = window.location.pathname.includes("/blog/");
  const basePath = isBlogPage ? ".." : ".";

  try {
    const [headerHtml, footerHtml] = await Promise.all([
      loadComponent(`${basePath}/components/header.html`),
      loadComponent(`${basePath}/components/footer.html`),
    ]);

    document.body.insertAdjacentHTML("afterbegin", headerHtml);
    document.body.insertAdjacentHTML("beforeend", footerHtml);
    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (error) {
    console.error("Component loader error:", error);
  }
}

document.addEventListener("DOMContentLoaded", mountLayoutComponents);
