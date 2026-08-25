import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import {
  ORGANIZATION_ROLES,
  UUID,
  requireOrganizationAccess,
} from '../services/organization-access.js';

const ORGANIZATION_KINDS = new Set(['matrix', 'affiliate', 'branch', 'client']);
const VENUE_TYPES = new Set([
  'supermercado', 'varejo', 'saude', 'alimentacao', 'hotel',
  'educacao', 'publico', 'escritorio', 'outro',
]);
const MANAGE_ROLES = ['owner', 'admin'];
const RESOURCE_ROLES = ['owner', 'admin', 'manager', 'operator'];

function normalizeVenueType(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function validateVenueType(value) {
  const venueType = normalizeVenueType(value);
  return VENUE_TYPES.has(venueType) ? { ok: true, value: venueType } : { ok: false };
}

export function validateOrganization(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const kind = typeof body?.kind === 'string' ? body.kind.trim().toLowerCase() : '';
  if (!name || name.length > 160 || !ORGANIZATION_KINDS.has(kind)) return { ok: false };
  return { ok: true, value: { name, kind } };
}

export function isChildKindAllowed(parentKind, childKind) {
  const allowed = {
    matrix: new Set(['affiliate', 'branch', 'client']),
    affiliate: new Set(['branch', 'client']),
    branch: new Set(['client']),
    client: new Set(),
  };
  return allowed[parentKind]?.has(childKind) ?? false;
}

export function validateMember(body) {
  const adminId = typeof body?.adminId === 'string' ? body.adminId.trim() : '';
  const role = typeof body?.role === 'string' ? body.role.trim().toLowerCase() : '';
  if (!UUID.test(adminId) || !ORGANIZATION_ROLES.has(role)) return { ok: false };
  return { ok: true, value: { adminId, role } };
}

function validateLocationLink(body) {
  const venue = validateVenueType(body?.venueType);
  return venue.ok ? { ok: true, value: { venueType: venue.value } } : { ok: false };
}

function validateDeviceLink(body) {
  if (body?.locationId == null) return { ok: true, value: { locationId: null } };
  const locationId = typeof body.locationId === 'string' ? body.locationId.trim() : '';
  return UUID.test(locationId) ? { ok: true, value: { locationId } } : { ok: false };
}

function mapConflict(error, reply) {
  if (error?.code === '23505') return reply.code(409).send({ error: 'resource_conflict' });
  if (error?.code === '23503') return reply.code(400).send({ error: 'invalid_reference' });
  return null;
}

export default async function organizationRoutes(app) {
  const canRead = requireOrganizationAccess();
  const canManage = requireOrganizationAccess({ roles: MANAGE_ROLES });
  const canManageResources = requireOrganizationAccess({ roles: RESOURCE_ROLES });

  app.get('/api/admin/organizations', { preHandler: requireAdmin }, async (request) => {
    const { rows } = await app.db.query(
      `with recursive visible as (
         select organization.id,organization.parent_id,organization.kind,organization.name,organization.status,
                member.role as "effectiveRole",0 as depth
           from organization_members member
           join organizations organization on organization.id=member.organization_id
          where member.admin_id=$1
         union all
         select child.id,child.parent_id,child.kind,child.name,child.status,
                visible."effectiveRole",visible.depth+1
           from organizations child join visible on child.parent_id=visible.id
       )
       select distinct on (id) id,parent_id as "parentId",kind,name,status,"effectiveRole",depth
         from visible
        order by id,depth`,
      [request.admin.id],
    );
    return { organizations: rows };
  });

  app.post('/api/admin/organizations', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = validateOrganization(request.body);
    if (!parsed.ok || parsed.value.kind !== 'matrix') {
      return reply.code(400).send({ error: 'invalid_root_organization' });
    }
    const client = await app.db.connect();
    const id = randomUUID();
    try {
      await client.query('begin');
      const { rows } = await client.query(
        `insert into organizations(id,parent_id,kind,name,created_by)
         values($1,null,$2,$3,$4)
         returning id,parent_id as "parentId",kind,name,status,created_at as "createdAt"`,
        [id, parsed.value.kind, parsed.value.name, request.admin.id],
      );
      await client.query(
        `insert into organization_members(organization_id,admin_id,role,created_by)
         values($1,$2,'owner',$2)`,
        [id, request.admin.id],
      );
      await client.query('commit');
      return reply.code(201).send({ organization: rows[0] });
    } catch (error) {
      await client.query('rollback');
      const response = mapConflict(error, reply);
      if (response) return response;
      throw error;
    } finally {
      client.release();
    }
  });

  app.post(
    '/api/admin/organizations/:organizationId/children',
    { preHandler: [requireAdmin, canManage] },
    async (request, reply) => {
      const parsed = validateOrganization(request.body);
      if (!parsed.ok || !isChildKindAllowed(request.organizationAccess.kind, parsed.value.kind)) {
        return reply.code(400).send({ error: 'invalid_organization_hierarchy' });
      }
      const id = randomUUID();
      const { rows } = await app.db.query(
        `insert into organizations(id,parent_id,kind,name,created_by)
         values($1,$2,$3,$4,$5)
         returning id,parent_id as "parentId",kind,name,status,created_at as "createdAt"`,
        [id, request.params.organizationId, parsed.value.kind, parsed.value.name, request.admin.id],
      );
      return reply.code(201).send({ organization: rows[0] });
    },
  );

  app.get(
    '/api/admin/organizations/:organizationId/members',
    { preHandler: [requireAdmin, canRead] },
    async (request) => {
      const { rows } = await app.db.query(
        `select member.admin_id as "adminId",admin.name,admin.email,member.role,
                member.created_at as "createdAt",member.updated_at as "updatedAt"
           from organization_members member
           join admins admin on admin.id=member.admin_id
          where member.organization_id=$1
          order by admin.name,admin.id`,
        [request.params.organizationId],
      );
      return { members: rows };
    },
  );

  app.put(
    '/api/admin/organizations/:organizationId/members',
    { preHandler: [requireAdmin, canManage] },
    async (request, reply) => {
      const parsed = validateMember(request.body);
      if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
      try {
        const { rows } = await app.db.query(
          `insert into organization_members(organization_id,admin_id,role,created_by)
           values($1,$2,$3,$4)
           on conflict(organization_id,admin_id) do update
             set role=excluded.role,updated_at=now()
           returning admin_id as "adminId",role,created_at as "createdAt",updated_at as "updatedAt"`,
          [request.params.organizationId, parsed.value.adminId, parsed.value.role, request.admin.id],
        );
        return { member: rows[0] };
      } catch (error) {
        const response = mapConflict(error, reply);
        if (response) return response;
        throw error;
      }
    },
  );

  app.get(
    '/api/admin/organizations/:organizationId/resources',
    { preHandler: [requireAdmin, canRead] },
    async (request) => {
      const organizationId = request.params.organizationId;
      const locations = await app.db.query(
        `select l.id,l.label,l.address,l.latitude,l.longitude,
                l.organization_id as "orgId",l.venue_type as "venueType",
                l.created_at as "createdAt",l.updated_at as "updatedAt"
           from locations l
          where l.organization_id=$1
          order by l.label,l.id`,
        [organizationId],
      );
      const devices = await app.db.query(
        `select d.id,d.name,d.status,d.location_id as "locationId",
                d.organization_id as "orgId",l.venue_type as "venueType",
                d.last_seen_at as "lastSeenAt",d.updated_at as "updatedAt"
           from devices d
           left join locations l on l.id=d.location_id
          where d.organization_id=$1
          order by d.name,d.id`,
        [organizationId],
      );
      return { locations: locations.rows, devices: devices.rows };
    },
  );

  app.put(
    '/api/admin/organizations/:organizationId/locations/:locationId',
    { preHandler: [requireAdmin, canManageResources] },
    async (request, reply) => {
      if (!UUID.test(request.params.locationId ?? '')) return reply.code(400).send({ error: 'invalid_location_id' });
      const parsed = validateLocationLink(request.body);
      if (!parsed.ok) return reply.code(400).send({ error: 'invalid_venue_type' });
      const client = await app.db.connect();
      try {
        await client.query('begin');
        const existing = await client.query(
          'select id,organization_id from locations where id=$1 for update',
          [request.params.locationId],
        );
        if (!existing.rows[0]) {
          await client.query('rollback');
          return reply.code(404).send({ error: 'location_not_found' });
        }
        if (existing.rows[0].organization_id && existing.rows[0].organization_id !== request.params.organizationId) {
          await client.query('rollback');
          return reply.code(409).send({ error: 'location_belongs_to_another_organization' });
        }
        const { rows } = await client.query(
          `update locations set organization_id=$1,venue_type=$2,updated_at=now()
            where id=$3
            returning id,label,address,latitude,longitude,organization_id as "orgId",
                      venue_type as "venueType",updated_at as "updatedAt"`,
          [request.params.organizationId, parsed.value.venueType, request.params.locationId],
        );
        await client.query('commit');
        return { location: rows[0] };
      } catch (error) {
        await client.query('rollback');
        throw error;
      } finally {
        client.release();
      }
    },
  );

  app.put(
    '/api/admin/organizations/:organizationId/devices/:deviceId',
    { preHandler: [requireAdmin, canManageResources] },
    async (request, reply) => {
      if (!UUID.test(request.params.deviceId ?? '')) return reply.code(400).send({ error: 'invalid_device_id' });
      const parsed = validateDeviceLink(request.body);
      if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
      const client = await app.db.connect();
      try {
        await client.query('begin');
        const existing = await client.query(
          'select id,organization_id,location_id from devices where id=$1 for update',
          [request.params.deviceId],
        );
        if (!existing.rows[0]) {
          await client.query('rollback');
          return reply.code(404).send({ error: 'device_not_found' });
        }
        if (existing.rows[0].organization_id && existing.rows[0].organization_id !== request.params.organizationId) {
          await client.query('rollback');
          return reply.code(409).send({ error: 'device_belongs_to_another_organization' });
        }
        const locationId = parsed.value.locationId ?? existing.rows[0].location_id;
        if (locationId) {
          const location = await client.query(
            'select id,organization_id from locations where id=$1 for update',
            [locationId],
          );
          if (!location.rows[0]) {
            await client.query('rollback');
            return reply.code(404).send({ error: 'location_not_found' });
          }
          if (location.rows[0].organization_id && location.rows[0].organization_id !== request.params.organizationId) {
            await client.query('rollback');
            return reply.code(409).send({ error: 'location_belongs_to_another_organization' });
          }
          if (!location.rows[0].organization_id) {
            await client.query(
              'update locations set organization_id=$1,updated_at=now() where id=$2',
              [request.params.organizationId, locationId],
            );
          }
        }
        const { rows } = await client.query(
          `update devices set organization_id=$1,location_id=$2,updated_at=now()
            where id=$3
            returning id,name,status,location_id as "locationId",organization_id as "orgId",updated_at as "updatedAt"`,
          [request.params.organizationId, locationId, request.params.deviceId],
        );
        const venue = locationId
          ? await client.query('select venue_type as "venueType" from locations where id=$1', [locationId])
          : { rows: [] };
        await client.query('commit');
        return { device: { ...rows[0], venueType: venue.rows[0]?.venueType ?? null } };
      } catch (error) {
        await client.query('rollback');
        throw error;
      } finally {
        client.release();
      }
    },
  );
}
