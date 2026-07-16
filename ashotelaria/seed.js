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
      { id: "room-type-superior-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", name: "Superior", capacity: 3, nightlyRate: 25_900 },
      { id: "room-type-family-suite-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", name: "Suíte Família", capacity: 5, nightlyRate: 34_900 },
      { id: "room-type-standard-rio-moa", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", name: "Standard", capacity: 3, nightlyRate: 15_900 },
    ],
    rooms: [
      { id: "room-101", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-standard-jurua", number: "101", status: "available", photoUrl: "" },
      { id: "room-102", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-standard-jurua", number: "102", status: "available", photoUrl: "" },
      { id: "room-103", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-standard-jurua", number: "103", status: "inspected", photoUrl: "" },
      { id: "room-104", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-standard-jurua", number: "104", status: "dirty", photoUrl: "" },
      { id: "room-201", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-superior-jurua", number: "201", status: "occupied", photoUrl: "" },
      { id: "room-202", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-superior-jurua", number: "202", status: "available", photoUrl: "" },
      { id: "room-203", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-superior-jurua", number: "203", status: "maintenance", photoUrl: "" },
      { id: "room-204", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-superior-jurua", number: "204", status: "inspected", photoUrl: "" },
      { id: "room-301", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-family-suite-jurua", number: "301", status: "dirty", photoUrl: "" },
      { id: "room-302", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-family-suite-jurua", number: "302", status: "available", photoUrl: "" },
      { id: "room-303", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-family-suite-jurua", number: "303", status: "blocked", photoUrl: "" },
      { id: "room-304", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomTypeId: "room-type-family-suite-jurua", number: "304", status: "available", photoUrl: "" },
      { id: "room-moa-01", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", roomTypeId: "room-type-standard-rio-moa", number: "01", status: "available", photoUrl: "" },
    ],
    guests: [
      { id: "guest-jurua-01", tenantId: "tenant-czs", propertyId: "property-jurua-palace", name: "João da Costa", email: "joao@example.com", phone: "+55 68 99901-0101", document: "111.222.333-44" },
      { id: "guest-jurua-02", tenantId: "tenant-czs", propertyId: "property-jurua-palace", name: "Maria Oliveira", email: "maria@example.com", phone: "+55 68 99902-0202", document: "222.333.444-55" },
      { id: "guest-jurua-03", tenantId: "tenant-czs", propertyId: "property-jurua-palace", name: "Paulo Lima", email: "paulo@example.com", phone: "+55 68 99903-0303", document: "333.444.555-66" },
      { id: "guest-jurua-04", tenantId: "tenant-czs", propertyId: "property-jurua-palace", name: "Carla Souza", email: "carla@example.com", phone: "+55 68 99904-0404", document: "444.555.666-77" },
      { id: "guest-moa-01", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", name: "Ana Souza", email: "ana@example.com", phone: "+55 68 99905-0505", document: "555.666.777-88" },
    ],
    reservations: [
      { id: "reservation-jurua-active", tenantId: "tenant-czs", propertyId: "property-jurua-palace", guestId: "guest-jurua-01", roomTypeId: "room-type-standard-jurua", roomId: "room-101", checkIn: "2026-07-20", checkOut: "2026-07-22", adults: 2, children: 0, nightlyRate: 18_900, total: 37_800, status: "confirmed" },
      { id: "reservation-jurua-arrival-20260714", tenantId: "tenant-czs", propertyId: "property-jurua-palace", guestId: "guest-jurua-01", roomTypeId: "room-type-standard-jurua", roomId: "room-102", checkIn: "2026-07-14", checkOut: "2026-07-16", adults: 2, children: 0, nightlyRate: 18_900, total: 37_800, status: "confirmed" },
      { id: "reservation-jurua-inhouse", tenantId: "tenant-czs", propertyId: "property-jurua-palace", guestId: "guest-jurua-02", roomTypeId: "room-type-superior-jurua", roomId: "room-201", checkIn: "2026-07-13", checkOut: "2026-07-15", adults: 2, children: 0, nightlyRate: 25_900, total: 51_800, status: "checked_in" },
      { id: "reservation-jurua-completed", tenantId: "tenant-czs", propertyId: "property-jurua-palace", guestId: "guest-jurua-03", roomTypeId: "room-type-family-suite-jurua", roomId: "room-301", checkIn: "2026-07-10", checkOut: "2026-07-12", adults: 2, children: 2, nightlyRate: 34_900, total: 69_800, status: "checked_out" },
      { id: "reservation-jurua-cancelled", tenantId: "tenant-czs", propertyId: "property-jurua-palace", guestId: "guest-jurua-04", roomTypeId: "room-type-family-suite-jurua", roomId: "room-302", checkIn: "2026-08-10", checkOut: "2026-08-12", adults: 2, children: 1, nightlyRate: 34_900, total: 69_800, status: "cancelled" },
      { id: "reservation-moa-seed", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", guestId: "guest-moa-01", roomTypeId: "room-type-standard-rio-moa", roomId: "room-moa-01", checkIn: "2026-07-01", checkOut: "2026-07-02", adults: 1, children: 0, nightlyRate: 15_900, total: 15_900, status: "checked_out" },
    ],
    housekeepingTasks: [
      { id: "housekeeping-jurua-01", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomId: "room-104", status: "pending", assignedUsername: "admin", assignedRole: "camareira" },
      { id: "housekeeping-jurua-02", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomId: "room-301", status: "in_progress", assignedUsername: "admin", assignedRole: "camareira" },
      { id: "housekeeping-moa-01", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", roomId: "room-moa-01", status: "done", assignedUsername: "admin", assignedRole: "camareira" },
    ],
    maintenanceOrders: [
      { id: "maintenance-jurua-01", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomId: "room-203", status: "open", title: "Revisar ar-condicionado" },
      { id: "maintenance-jurua-02", tenantId: "tenant-czs", propertyId: "property-jurua-palace", roomId: "room-303", status: "in_progress", title: "Revisar ponto hidráulico" },
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
      { id: "membership-manager-jurua", userId: "user-admin-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", role: "gerente" },
      { id: "membership-maid-jurua", userId: "user-maid-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", role: "camareira" },
      { id: "membership-governance-jurua", userId: "user-maid-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", role: "supervisor_governanca" },
      { id: "membership-accountant-jurua", userId: "user-accountant-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", role: "contador" },
      { id: "membership-maintenance-jurua", userId: "user-admin-jurua", tenantId: "tenant-czs", propertyId: "property-jurua-palace", role: "manutencao" },
      { id: "membership-admin-moa", userId: "user-admin-rio-moa", tenantId: "tenant-vale-demo", propertyId: "property-rio-moa", role: "administrador" },
    ],
    roomPhotos: [],
    credentialProfiles: [],
    auditEvents: [],
  };
}

module.exports = { createSeed };
