import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';

async function optionalImport(specifier) {
  try {
    return { value: await import(specifier) };
  } catch (error) {
    return { error };
  }
}

const organizationsImport = await optionalImport('../src/routes/organizations.js');
const crmImport = await optionalImport('../src/routes/crm.js');
const accessImport = await optionalImport('../src/services/organization-access.js');
const networkImport = await optionalImport('../src/routes/network.js');

async function migrationSql() {
  try {
    return await readFile(new URL('../migrations/010_network_organizations_crm.sql', import.meta.url), 'utf8');
  } catch {
    return '';
  }
}

test('migration models organization hierarchy, members, CRM and organization-bound resources', async () => {
  const sql = await migrationSql();
  assert.ok(sql, '010_network_organizations_crm.sql must exist');
  assert.match(sql, /create table organizations/i);
  assert.match(sql, /parent_id uuid references organizations\s*\(id\)/i);
  assert.match(sql, /kind text not null[\s\S]*matrix[\s\S]*affiliate[\s\S]*branch[\s\S]*client/i);
  assert.match(sql, /create table organization_members/i);
  assert.match(sql, /primary key \(organization_id, admin_id\)/i);
  assert.match(sql, /create table crm_contacts/i);
  assert.match(sql, /create table crm_opportunities/i);
  assert.match(sql, /create table crm_tasks/i);
  assert.match(sql, /foreign key \(organization_id, contact_id\)[\s\S]*references crm_contacts\s*\(organization_id, id\)/i);
  assert.match(sql, /alter table locations[\s\S]*organization_id uuid references organizations\s*\(id\)/i);
  assert.match(sql, /venue_type text[\s\S]*supermercado[\s\S]*varejo[\s\S]*saude[\s\S]*alimentacao[\s\S]*hotel[\s\S]*educacao[\s\S]*publico[\s\S]*escritorio[\s\S]*outro/i);
  assert.match(sql, /alter table devices[\s\S]*organization_id uuid references organizations\s*\(id\)/i);
});

test('organization validators enforce the allowed hierarchy and team roles', () => {
  assert.equal(typeof organizationsImport.value?.validateOrganization, 'function');
  assert.equal(typeof organizationsImport.value?.isChildKindAllowed, 'function');
  assert.equal(typeof organizationsImport.value?.validateMember, 'function');

  assert.deepEqual(
    organizationsImport.value.validateOrganization({ name: ' Rede Angel ', kind: 'matrix' }),
    { ok: true, value: { name: 'Rede Angel', kind: 'matrix' } },
  );
  assert.equal(organizationsImport.value.validateOrganization({ name: '', kind: 'matrix' }).ok, false);
  assert.equal(organizationsImport.value.isChildKindAllowed('matrix', 'affiliate'), true);
  assert.equal(organizationsImport.value.isChildKindAllowed('matrix', 'branch'), true);
  assert.equal(organizationsImport.value.isChildKindAllowed('affiliate', 'branch'), true);
  assert.equal(organizationsImport.value.isChildKindAllowed('branch', 'client'), true);
  assert.equal(organizationsImport.value.isChildKindAllowed('client', 'branch'), false);
  assert.equal(organizationsImport.value.isChildKindAllowed('affiliate', 'matrix'), false);
  assert.deepEqual(
    organizationsImport.value.validateMember({ adminId: '11111111-1111-4111-8111-111111111111', role: 'sales' }),
    { ok: true, value: { adminId: '11111111-1111-4111-8111-111111111111', role: 'sales' } },
  );
  assert.equal(organizationsImport.value.validateMember({ adminId: 'not-a-uuid', role: 'owner' }).ok, false);
  assert.equal(organizationsImport.value.validateMember({ adminId: '11111111-1111-4111-8111-111111111111', role: 'root' }).ok, false);
});

test('venueType accepts the requested Portuguese categories and persists canonical slugs', () => {
  assert.equal(typeof organizationsImport.value?.validateVenueType, 'function');
  const accepted = ['supermercado', 'varejo', 'saude', 'alimentacao', 'hotel', 'educacao', 'publico', 'escritorio', 'outro'];
  for (const venueType of accepted) {
    assert.deepEqual(organizationsImport.value.validateVenueType(venueType), { ok: true, value: venueType });
  }
  assert.deepEqual(organizationsImport.value.validateVenueType('saúde'), { ok: true, value: 'saude' });
  assert.deepEqual(organizationsImport.value.validateVenueType('alimentação'), { ok: true, value: 'alimentacao' });
  assert.deepEqual(organizationsImport.value.validateVenueType('público'), { ok: true, value: 'publico' });
  assert.deepEqual(organizationsImport.value.validateVenueType('escritório'), { ok: true, value: 'escritorio' });
  assert.equal(organizationsImport.value.validateVenueType('shopping').ok, false);
});

test('CRM validators reject cross-resource ambiguity and invalid pipeline values', () => {
  assert.equal(typeof crmImport.value?.validateContact, 'function');
  assert.equal(typeof crmImport.value?.validateOpportunity, 'function');
  assert.equal(typeof crmImport.value?.validateTask, 'function');

  assert.deepEqual(
    crmImport.value.validateContact({ name: ' Maria ', company: 'Mercado A', email: ' MARIA@EXAMPLE.COM ' }),
    {
      ok: true,
      value: {
        name: 'Maria', company: 'Mercado A', email: 'maria@example.com', phone: null, notes: null, status: 'lead',
      },
    },
  );
  assert.equal(crmImport.value.validateContact({ name: 'Maria', email: 'sem-arroba' }).ok, false);
  assert.equal(crmImport.value.validateOpportunity({ title: 'Campanha', valueCents: -1 }).ok, false);
  assert.equal(crmImport.value.validateOpportunity({ title: 'Campanha', stage: 'paid' }).ok, false);
  assert.equal(crmImport.value.validateTask({ title: 'Retornar', opportunityId: 'wrong-id' }).ok, false);
});

test('organization access lookup is ancestor-aware and returns no access across tenants', async () => {
  assert.equal(typeof accessImport.value?.findOrganizationAccess, 'function');
  let captured;
  const db = {
    async query(sql, params) {
      captured = { sql, params };
      return { rows: [] };
    },
  };
  const result = await accessImport.value.findOrganizationAccess(
    db,
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
  );
  assert.equal(result, null);
  assert.match(captured.sql, /with recursive ancestors/i);
  assert.match(captured.sql, /organization_members/i);
  assert.deepEqual(captured.params, [
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
  ]);
});

test('CRM API blocks an authenticated admin without membership before any tenant data query', async () => {
  assert.equal(typeof crmImport.value?.default, 'function');
  let tenantDataQueried = false;
  const db = {
    async query(sql) {
      if (/from sessions s join admins a/i.test(sql)) {
        return { rows: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Admin', email: 'admin@example.com' }] };
      }
      if (/with recursive ancestors/i.test(sql)) return { rows: [] };
      tenantDataQueried = true;
      return { rows: [] };
    },
  };
  const app = Fastify({ logger: false });
  app.decorate('db', db);
  await app.register(cookie);
  await app.register(crmImport.value.default);
  const response = await app.inject({
    method: 'GET',
    url: '/api/admin/organizations/22222222-2222-4222-8222-222222222222/crm/contacts',
    headers: { cookie: 'amp_session=test-session' },
  });
  await app.close();
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.json(), { error: 'organization_access_denied' });
  assert.equal(tenantDataQueried, false);
});

test('organization resource API exposes organization and venue type for locations and TVs', async () => {
  assert.equal(typeof organizationsImport.value?.default, 'function');
  const organizationId = '22222222-2222-4222-8222-222222222222';
  const locationId = '33333333-3333-4333-8333-333333333333';
  const deviceId = '44444444-4444-4444-8444-444444444444';
  const db = {
    async query(sql) {
      if (/from sessions s join admins a/i.test(sql)) {
        return { rows: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Admin', email: 'admin@example.com' }] };
      }
      if (/with recursive ancestors/i.test(sql)) {
        return { rows: [{ id: organizationId, kind: 'matrix', effectiveRole: 'owner' }] };
      }
      if (/from locations l/i.test(sql)) {
        return { rows: [{ id: locationId, label: 'Mercado Central', venueType: 'supermercado', orgId: organizationId }] };
      }
      if (/from devices d/i.test(sql)) {
        return { rows: [{ id: deviceId, name: 'TV 1', status: 'active', locationId, orgId: organizationId, venueType: 'supermercado' }] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
  const app = Fastify({ logger: false });
  app.decorate('db', db);
  await app.register(cookie);
  await app.register(organizationsImport.value.default);
  const response = await app.inject({
    method: 'GET',
    url: `/api/admin/organizations/${organizationId}/resources`,
    headers: { cookie: 'amp_session=test-session' },
  });
  await app.close();
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    locations: [{ id: locationId, label: 'Mercado Central', venueType: 'supermercado', orgId: organizationId }],
    devices: [{ id: deviceId, name: 'TV 1', status: 'active', locationId, orgId: organizationId, venueType: 'supermercado' }],
  });
});

test('aggregate network API requires an explicit accessible organization scope', async () => {
  assert.equal(typeof networkImport.value?.default, 'function');
  let aggregateQueried = false;
  const db = {
    async query(sql) {
      if (/from sessions s join admins a/i.test(sql)) {
        return { rows: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Admin', email: 'admin@example.com' }] };
      }
      if (/with recursive ancestors/i.test(sql)) return { rows: [] };
      aggregateQueried = true;
      return { rows: [] };
    },
  };
  const app = Fastify({ logger: false });
  app.decorate('db', db);
  await app.register(cookie);
  await app.register(networkImport.value.default);
  const missingScope = await app.inject({
    method: 'GET', url: '/api/admin/network', headers: { cookie: 'amp_session=test-session' },
  });
  const forbidden = await app.inject({
    method: 'GET',
    url: '/api/admin/network?organizationId=22222222-2222-4222-8222-222222222222',
    headers: { cookie: 'amp_session=test-session' },
  });
  await app.close();
  assert.equal(missingScope.statusCode, 400);
  assert.equal(forbidden.statusCode, 403);
  assert.equal(aggregateQueried, false);
});
