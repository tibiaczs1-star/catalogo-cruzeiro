const fileInput = document.querySelector("#proof-file");
const proofName = document.querySelector("#proof-name");
const form = document.querySelector("#removal-form");
const statusNode = document.querySelector("#removal-status");

if (fileInput && proofName) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    proofName.textContent = file ? `Arquivo selecionado: ${file.name}` : "Nenhum arquivo selecionado.";
  });
}

if (form && statusNode) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    statusNode.textContent =
      "Pedido registrado no protótipo. Para funcionar de verdade, essa página ainda precisa de backend ou integração com formulário.";
  });
}
