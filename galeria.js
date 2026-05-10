const filterButtons = [...document.querySelectorAll("[data-gallery-filter]")];
const items = [...document.querySelectorAll("[data-gallery-item]")];
const lightbox = document.querySelector("[data-gallery-lightbox]");
const preview = document.querySelector("[data-gallery-preview]");
const categoryNode = document.querySelector("[data-gallery-category]");
const titleNode = document.querySelector("[data-gallery-title]");
const summaryNode = document.querySelector("[data-gallery-summary]");
const closeButton = document.querySelector("[data-gallery-close]");

const getCssPhoto = (item) => item.style.getPropertyValue("--photo").trim();

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.galleryFilter || "todos";
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    items.forEach((item) => {
      const categories = String(item.dataset.category || "");
      item.hidden = filter !== "todos" && !categories.includes(filter);
    });
  });
});

items.forEach((item) => {
  item.addEventListener("click", () => {
    if (!lightbox || !preview) return;
    preview.style.setProperty("--preview", getCssPhoto(item));
    if (categoryNode) categoryNode.textContent = item.querySelector("span")?.textContent || "Galeria";
    if (titleNode) titleNode.textContent = item.dataset.title || "Foto da região";
    if (summaryNode) summaryNode.textContent = item.dataset.summary || "Imagem selecionada da galeria.";
    lightbox.hidden = false;
  });
});

const closeLightbox = () => {
  if (lightbox) lightbox.hidden = true;
};

closeButton?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});
