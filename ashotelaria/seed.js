"use strict";

function createSeed(today = "2026-07-14") {
  return {
    generatedAt: today,
    tenants: [
      { id: "tenant-czs", name: "CZS Labs Hotelaria" },
      { id: "tenant-vale-demo", name: "Vale do Juruá Hotéis" },
    ],
    properties: [
      {
        id: "property-jurua-palace",
        tenantId: "tenant-czs",
        name: "Hotel Juruá Palace",
        slug: "hotel-jurua-palace",
        timeZone: "America/Rio_Branco",
      },
      {
        id: "property-rio-moa",
        tenantId: "tenant-vale-demo",
        name: "Hotel Rio Moa",
        slug: "hotel-rio-moa",
        timeZone: "America/Rio_Branco",
      },
    ],
    roomTypes: [
      { id: "room-type-standard-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", name: "Standard", capacity: 3, nightlyRate: 18_900 },
      { id: "room-type-standard-rio-moa", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", name: "Standard", capacity: 3, nightlyRate: 15_900 },
    ],
    rooms: [
      { id: "room-101", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-standard-jurua", number: "101", status: "available" },
      { id: "room-102", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-standard-jurua", number: "102", status: "available" },
      { id: "room-moa-01", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", roomTypeId: "room-type-standard-rio-moa", number: "01", status: "available" },
    ],
    guests: [
      { id: "guest-jurua-01", tenantId: "tenant-czs", propertyId: "property-jurua-palace", name: "João da Costa", email: "joao@example.com", document: "111.222.333-44" },
      { id: "guest-moa-01", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", name: "Ana Souza", email: "ana@example.com", document: "555.666.777-88" },
    ],
    reservations: [
      { id: "reservation-jurua-active", tenantId: "tenant-czs", propertyId: "property-jurua-palace", guestId: "guest-jurua-01", roomTypeId: "room-type-standard-jurua", roomId: "room-101", checkIn: "2026-07-20", checkOut: "2026-07-22", adults: 2, children: 0, nightlyRate: 18_900, total: 37_800, status: "confirmed" },
      { id: "reservation-jurua-cancelled", tenantId: "tenant-czs", propertyId: "property-jurua-palace", guestId: "guest-jurua-01", roomTypeId: "room-type-standard-jurua", roomId: "room-101", checkIn: "2026-08-10", checkOut: "2026-08-12", adults: 1, children: 0, nightlyRate: 18_900, total: 37_800, status: "cancelled" },
      { id: "reservation-moa-seed", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", guestId: "guest-moa-01", roomTypeId: "room-type-standard-rio-moa", roomId: "room-moa-01", checkIn: "2026-07-01", checkOut: "2026-07-02", adults: 1, children: 0, nightlyRate: 15_900, total: 15_900, status: "checked_out" },
    ],
    housekeepingTasks: [
      { id: "housekeeping-jurua-01", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomId: "room-102", status: "pending", assignedUsername: "admin", assignedRole: "camareira" },
      { id: "housekeeping-moa-01", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", roomId: "room-moa-01", status: "done", assignedUsername: "admin", assignedRole: "camareira" },
    ],
    maintenanceOrders: [
      { id: "maintenance-jurua-01", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomId: "room-102", status: "open", title: "Revisar ar-condicionado" },
      { id: "maintenance-moa-01", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", roomId: "room-moa-01", status: "closed", title: "Trocar lâmpada" },
    ],
    integrations: [
      { id: "integration-jurua-payment", tenantId: "tenant-czs", propertyId: "property-jurua-palace", provider: "payments", status: "sandbox" },
      { id: "integration-moa-payment", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", provider: "payments", status: "sandbox" },
    ],
    users: [
      { id: "user-admin-jurua", name: "Admin Juruá", email: "admin@jurua.example" },
      { id: "user-reception-jurua", name: "Recepção Juruá", email: "recepcao@jurua.example" },
      { id: "user-maid-jurua", name: "Camareira Juruá", email: "camareira@jurua.example" },
      { id: "user-accountant-jurua", name: "Contador Juruá", email: "contador@jurua.example" },
      { id: "user-admin-rio-moa", name: "Admin Rio Moa", email: "admin@riomoa.example" },
    ],
    memberships: [
      { id: "membership-admin-jurua", userId: "user-admin-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", role: "administrador" },
      { id: "membership-reception-jurua", userId: "user-reception-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", role: "recepcionista" },
      { id: "membership-maid-jurua", userId: "user-maid-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", role: "camareira" },
      { id: "membership-accountant-jurua", userId: "user-accountant-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", role: "contador" },
      { id: "membership-admin-moa", userId: "user-admin-rio-moa", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", role: "administrador" },
    ],
    credentialProfiles: [],
    auditEvents: [],
  };
}

module.exports = { createSeed };
