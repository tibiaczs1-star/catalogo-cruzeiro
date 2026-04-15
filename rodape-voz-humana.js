(() => {
  const LABELS = new Set([
    "rodape oficial do projeto",
    "rodapé oficial do projeto",
  ]);

  function normalize(text) {
    return (text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function removeFooterLabelOnly() {
    const footerRoots = document.querySelectorAll(
      "footer, .site-footer, .rodape-oficial-catalogo, [data-rodape]"
    );

    footerRoots.forEach((footer) => {
      footer.querySelectorAll("h1, h2, h3, h4, p, span, small, strong, div").forEach((el) => {
        const text = normalize(el.textContent);
        if (LABELS.has(text)) {
          el.remove();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removeFooterLabelOnly, { once: true });
  } else {
    removeFooterLabelOnly();
  }
})();

