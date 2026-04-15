const fileInput = document.querySelector("#proof-file");
const proofName = document.querySelector("#proof-name");
const form = document.querySelector("#removal-form");
const statusNode = document.querySelector("#removal-status");
const WHATSAPP_NUMBER = "5568992269296";

function buildRemovalWhatsappUrl() {
  const name = document.querySelector("#full-name")?.value.trim() || "";
  const contact = document.querySelector("#contact-email")?.value.trim() || "";
  const link = document.querySelector("#page-link")?.value.trim() || "";
  const reason = document.querySelector("#reason")?.value.trim() || "";
  const fileName = fileInput?.files?.[0]?.name || "";
  const lines = [
    "Olá, gostaria de solicitar revisão ou remoção de conteúdo no Catalogo Cruzeiro do Sul.",
    "",
    name ? `Nome: ${name}` : "",
    contact ? `Contato de retorno: ${contact}` : "",
    link ? `Link: ${link}` : "",
    reason ? `Motivo: ${reason}` : "",
    fileName ? `Arquivo de referência selecionado: ${fileName}` : "",
    "",
    "Enviado pelo formulário de remoção."
  ].filter(Boolean);

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

if (fileInput && proofName) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    proofName.textContent = file ? `Arquivo selecionado: ${file.name}` : "Nenhum arquivo selecionado.";
  });
}

if (form && statusNode) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.href = buildRemovalWhatsappUrl();
    statusNode.textContent =
      "Mensagem pronta no WhatsApp. Confirme o envio para 68 99226-9296.";
  });
}
