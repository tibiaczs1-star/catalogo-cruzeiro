"use strict";

const API = "/api/ashotelaria/v1";
const booking = {
  propertySlug: propertySlugFromLocation(),
  property: null,
  portal: null,
  search: null,
  roomType: null,
  idempotencyKey: null,
};
const elements = {};

document.addEventListener("DOMContentLoaded", initBooking);

function initBooking() {
  Object.assign(elements, {
    banner: document.querySelector("#connection-banner"),
    propertyName: document.querySelector("#booking-property-name"),
    availabilityForm: document.querySelector("#availability-form"),
    roomStep: document.querySelector("#room-step"),
    roomOptions: document.querySelector("#room-options"),
    guestForm: document.querySelector("#guest-form"),
    confirmation: document.querySelector("#confirmation-step"),
    error: document.querySelector("#booking-error"),
    cleaningForm: document.querySelector("#cleaning-form"),
    roomServiceForm: document.querySelector("#room-service-form"),
    guestMessageForm: document.querySelector("#guest-message-form"),
    partnerList: document.querySelector("#partner-list"),
    foodMenuSelect: document.querySelector("#food-menu-select"),
    portalMessage: document.querySelector("#portal-message"),
  });
  elements.availabilityForm.addEventListener("submit", searchAvailability);
  elements.guestForm.addEventListener("submit", createReservation);
  elements.cleaningForm?.addEventListener("submit", scheduleCleaning);
  elements.roomServiceForm?.addEventListener("submit", orderRoomService);
  elements.guestMessageForm?.addEventListener("submit", sendGuestMessage);
  document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => showStep(Number(button.dataset.back))));
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  updateConnection();
  setDefaultDates();
  bindTooltips(document);
  loadProperty();
  loadClientPortal();
}

async function request(path, options = {}) {
  const headers = { accept: "application/json", ...(options.headers ?? {}) };
  if (options.body) headers["content-type"] = "application/json";
  let response;
  try {
    response = await fetch(`${API}${path}`, { ...options, headers, cache: "no-store", credentials: "same-origin" });
  } catch {
    updateConnection(false);
    throw new Error("Não foi possível conectar ao hotel. Verifique sua conexão.");
  }
  updateConnection(true);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const messages = {
      INVENTORY_CONFLICT: "Este quarto acabou de ser reservado. Consulte a disponibilidade novamente.",
      INVALID_STAY_RANGE: "Confira as datas de entrada e saída.",
      INVALID_RESERVATION: "Confira os dados informados.",
      INVALID_REQUEST: "Confira os dados informados.",
      IDEMPOTENCY_KEY_REQUIRED: "Atualize a página e tente novamente.",
      INVALID_IDEMPOTENCY_KEY: "Atualize a página e tente novamente.",
      NOT_FOUND: "Hotel ou acomodação não encontrado.",
      SERVICE_REQUEST_NOT_ALLOWED: "Este serviço exige uma reserva hospedada no hotel.",
    };
    throw new Error(messages[payload?.error?.code] ?? "Não foi possível concluir. Tente novamente.");
  }
  return payload;
}

async function loadProperty() {
  try {
    const payload = await request(`/public/properties/${encodeURIComponent(booking.propertySlug)}`);
    booking.property = payload.property;
    elements.propertyName.textContent = `Reserve no ${booking.property.name}.`;
    document.title = `Reservar no ${booking.property.name} — AShotelaria`;
  } catch (error) {
    showError(error.message);
  }
}

async function loadClientPortal() {
  try {
    const payload = await request(`/public/client-portal?propertySlug=${encodeURIComponent(booking.propertySlug)}`);
    booking.portal = payload.portal;
    renderPartners(booking.portal?.partners ?? []);
    renderFoodMenu(booking.portal?.foodMenu ?? []);
  } catch (error) {
    showPortalMessage(error.message, true);
  }
}

async function searchAvailability(event) {
  event.preventDefault();
  if (!navigator.onLine) return showError("Conecte-se à internet para consultar os quartos.");
  const values = Object.fromEntries(new FormData(elements.availabilityForm));
  showError("");
  setBusy(elements.availabilityForm, true);
  booking.search = { ...values, adults: Number(values.adults), children: Number(values.children) };
  const query = new URLSearchParams({ propertySlug: booking.propertySlug, ...values });
  try {
    const payload = await request(`/public/availability?${query}`);
    const roomTypes = (payload.availability?.roomTypes ?? []).filter((room) => room.availableUnits > 0);
    if (!roomTypes.length) throw new Error("Não há quartos disponíveis para essas datas.");
    renderRooms(roomTypes, payload.availability.nights);
    showStep(2);
  } catch (error) {
    showError(error.message);
  } finally {
    setBusy(elements.availabilityForm, false);
  }
}

function renderRooms(roomTypes, nights) {
  elements.roomOptions.replaceChildren(...roomTypes.map((room) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "room-option";
    button.dataset.help = `Opção ${room.name}: capacidade para ${room.capacity} hóspede(s), ${room.availableUnits} unidade(s) e total de ${money(room.total)}.`;
    button.innerHTML = `<span><strong>${escapeHtml(room.name)}</strong><small>Até ${room.capacity} hóspede(s) · ${room.availableUnits} unidade(s) · ${nights} noite(s)</small></span><span class="room-option__price">${money(room.total)}</span><span class="room-option__arrow">→</span>`;
    button.addEventListener("click", () => {
      booking.roomType = room;
      booking.idempotencyKey = globalThis.crypto?.randomUUID?.()
        ?? `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      showStep(3);
    });
    return button;
  }));
  bindTooltips(elements.roomOptions);
}

async function createReservation(event) {
  event.preventDefault();
  if (!booking.search || !booking.roomType) return showStep(1);
  if (!navigator.onLine) return showError("Conecte-se à internet para confirmar a reserva.");
  const guest = Object.fromEntries(new FormData(elements.guestForm));
  showError("");
  setBusy(elements.guestForm, true);
  const body = {
    propertySlug: booking.propertySlug,
    roomTypeId: booking.roomType.id,
    checkIn: booking.search.checkIn,
    checkOut: booking.search.checkOut,
    adults: booking.search.adults,
    children: booking.search.children,
    guestName: guest.guestName,
    guestEmail: guest.guestEmail,
    guestPhone: guest.guestPhone,
    document: guest.document,
  };
  try {
    const payload = await request("/public/reservations", {
      method: "POST",
      headers: { "idempotency-key": booking.idempotencyKey },
      body: JSON.stringify(body),
    });
    renderConfirmation(payload.reservation);
    showStep(4);
  } catch (error) {
    showError(error.message);
  } finally {
    setBusy(elements.guestForm, false);
  }
}

function renderConfirmation(reservation) {
  document.querySelector("#confirmation-message").textContent = `Sua hospedagem no ${booking.property?.name ?? "hotel"} foi registrada no sistema.`;
  const details = [
    ["Reserva", reservation.id],
    ["Acomodação", booking.roomType.name],
    ["Entrada", formatDate(reservation.checkIn)],
    ["Saída", formatDate(reservation.checkOut)],
    ["Total", money(reservation.total)],
    ["Pagamento", "Na hospedagem"],
  ];
  document.querySelector("#confirmation-details").innerHTML = details.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
}

async function scheduleCleaning(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const body = { propertySlug: booking.propertySlug, ...Object.fromEntries(new FormData(form)) };
  showPortalMessage("");
  setBusy(form, true);
  try {
    const payload = await request("/public/service-requests", { method: "POST", body: JSON.stringify(body) });
    showPortalMessage(`Solicitação enviada: quarto ${payload.task.roomId}, ${payload.task.awayFrom || "sem horário"} até ${payload.task.awayUntil || "sem horário"}.`);
  } catch (error) {
    showPortalMessage(error.message, true);
  } finally {
    setBusy(form, false);
  }
}

async function orderRoomService(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  const body = {
    propertySlug: booking.propertySlug,
    reservationId: values.reservationId,
    note: values.note,
    items: [{ itemId: values.itemId, quantity: Number(values.quantity || 1) }],
  };
  showPortalMessage("");
  setBusy(form, true);
  try {
    const payload = await request("/public/room-service-orders", { method: "POST", body: JSON.stringify(body) });
    showPortalMessage(`Pedido enviado para o quarto: ${money(payload.order.total)}.`);
  } catch (error) {
    showPortalMessage(error.message, true);
  } finally {
    setBusy(form, false);
  }
}

async function sendGuestMessage(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const body = { propertySlug: booking.propertySlug, ...Object.fromEntries(new FormData(form)) };
  showPortalMessage("");
  setBusy(form, true);
  try {
    await request("/public/messages", { method: "POST", body: JSON.stringify(body) });
    form.elements.message.value = "";
    showPortalMessage("Mensagem enviada para o hotel.");
  } catch (error) {
    showPortalMessage(error.message, true);
  } finally {
    setBusy(form, false);
  }
}

function renderPartners(partners) {
  if (!elements.partnerList) return;
  elements.partnerList.innerHTML = partners.length ? partners.map((partner) => `<article class="partner-card" tabindex="0" data-help="Parceiro ${escapeHtml(partner.name)}: ${escapeHtml(partner.discountLabel)}.">
    <strong>${escapeHtml(partner.name)}</strong>
    <span>${escapeHtml(partner.category)}</span>
    <p>${escapeHtml(partner.description)}</p>
    <small>${escapeHtml(partner.discountLabel)} · ${escapeHtml(partner.contact)}</small>
  </article>`).join("") : `<p class="muted-text">Nenhum parceiro ativo agora.</p>`;
  bindTooltips(elements.partnerList);
}

function renderFoodMenu(foodMenu) {
  if (!elements.foodMenuSelect) return;
  elements.foodMenuSelect.replaceChildren(...foodMenu.map((item) => new Option(`${item.name} · ${money(item.price)}`, item.id)));
}

function showPortalMessage(message, isError = false) {
  if (!elements.portalMessage) return;
  elements.portalMessage.textContent = message;
  elements.portalMessage.classList.toggle("form-error", Boolean(message && isError));
}

function showStep(step) {
  document.querySelectorAll("[data-step]").forEach((panel) => { panel.hidden = Number(panel.dataset.step) !== step; });
  document.querySelectorAll("[data-step-marker]").forEach((marker) => marker.classList.toggle("active", Number(marker.dataset.stepMarker) <= step));
  showError("");
  document.querySelector(".booking-flow").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateConnection(forced) {
  const online = typeof forced === "boolean" ? forced : navigator.onLine;
  elements.banner.hidden = online;
  document.querySelectorAll("button[type=submit], .room-option").forEach((button) => { button.disabled = !online; });
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = !message;
}

function bindTooltips(root) {
  root?.querySelectorAll("[data-help]").forEach((element) => {
    if (element.dataset.helpBound === "true") return;
    element.dataset.helpBound = "true";
    if (!element.matches("button, input, select, a, [tabindex]")) element.tabIndex = 0;
    let timer = null;
    let tooltip = null;
    const hide = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      tooltip?.remove();
      tooltip = null;
    };
    const show = () => {
      hide();
      timer = setTimeout(() => {
        tooltip = document.createElement("div");
        tooltip.className = "help-tooltip";
        tooltip.setAttribute("role", "tooltip");
        tooltip.textContent = element.dataset.help;
        document.body.appendChild(tooltip);
        const rect = element.getBoundingClientRect();
        const width = tooltip.offsetWidth;
        const left = Math.min(Math.max(10, rect.left), window.innerWidth - width - 10);
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${Math.min(window.innerHeight - tooltip.offsetHeight - 10, rect.bottom + 10)}px`;
        requestAnimationFrame(() => tooltip?.classList.add("visible"));
      }, 650);
    };
    element.addEventListener("mouseenter", show);
    element.addEventListener("mouseleave", hide);
    element.addEventListener("focus", show);
    element.addEventListener("blur", hide);
  });
}

function setBusy(container, busy) { container.querySelectorAll("input, select, textarea, button").forEach((element) => { element.disabled = busy; }); }
function money(cents) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100); }
function formatDate(value) { const [year, month, day] = String(value).slice(0, 10).split("-"); return `${day}/${month}/${year}`; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]); }
function propertySlugFromLocation() {
  const match = window.location.pathname.match(/^\/reservar\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : new URLSearchParams(window.location.search).get("hotel") || "hotel-jurua-palace";
}
function toDateInput(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function setDefaultDates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 1);
  elements.availabilityForm.elements.checkIn.value = toDateInput(checkIn);
  elements.availabilityForm.elements.checkIn.min = toDateInput(new Date());
  elements.availabilityForm.elements.checkOut.value = toDateInput(checkOut);
  elements.availabilityForm.elements.checkOut.min = toDateInput(checkIn);
  elements.availabilityForm.elements.checkIn.addEventListener("change", () => {
    const minimum = new Date(`${elements.availabilityForm.elements.checkIn.value}T12:00:00`);
    minimum.setDate(minimum.getDate() + 1);
    elements.availabilityForm.elements.checkOut.min = toDateInput(minimum);
    if (elements.availabilityForm.elements.checkOut.value < elements.availabilityForm.elements.checkOut.min) {
      elements.availabilityForm.elements.checkOut.value = elements.availabilityForm.elements.checkOut.min;
    }
  });
}
