import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { findOrganizationAccess, UUID } from '../services/organization-access.js';
import { isChildKindAllowed, validateMember, validateOrganization } from './organizations.js';
import { validateContact, validateOpportunity, validateTask } from './crm.js';

const MANAGE_ROLES = new Set(['owner', 'admin']);
const CRM_WRITE_ROLES = new Set(['owner', 'admin', 'manager', 'sales']);

async function scopedAccess(app, request, reply, organizationId, roles) {
  if (!UUID.test(organizationId ?? '')) {
    reply.code(400).send({ error: 'invalid_organization_id' });
    return null;
  }
  const access = await findOrganizationAccess(app.db, request.admin.id, organizationId);
  if (!access) {
    reply.code(403).send({ error: 'organization_access_denied' });
    return null;
  }
  if (roles && !roles.has(access.effectiveRole)) {
    reply.code(403).send({ error: 'insufficient_organization_role' });
    return null;
  }
  return access;
}

function referenceError(error, reply) {
  if (error?.code === '23503') return reply.code(400).send({ error: 'invalid_tenant_reference' });
  if (error?.code === '23505') return reply.code(409).send({ error: 'resource_conflict' });
  return null;
}

export default async function networkRoutes(app) {
  app.get('/api/admin/network', { preHandler: requireAdmin }, async (request, reply) => {
    const organizationId = request.query?.organizationId;
    const access = await scopedAccess(app, request, reply, organizationId);
    if (!access) return;

    const organizationResult = await app.db.query(
      `with recursive tree as (
         select id,parent_id,kind,name,status,created_at,updated_at,0 as depth
           from organizations where id=$1
         union all
         select child.id,child.parent_id,child.kind,child.name,child.status,
                child.created_at,child.updated_at,tree.depth+1
           from organizations child join tree on child.parent_id=tree.id
       )
       select id,parent_id as "parentId",kind,name,status,depth,
              created_at as "createdAt",updated_at as "updatedAt"
         from tree order by depth,name,id`,
      [organizationId],
    );
    const organizationIds = organizationResult.rows.map((organization) => organization.id);

    const [members, contacts, opportunities, tasks, locations, devices] = await Promise.all([
      app.db.query(
        `select member.organization_id as "organizationId",member.admin_id as "adminId",
                admin.name,admin.email,member.role,member.created_at as "createdAt",member.updated_at as "updatedAt"
           from organization_members member join admins admin on admin.id=member.admin_id
          where member.organization_id=any($1::uuid[])
          order by member.organization_id,admin.name,admin.id`,
        [organizationIds],
      ),
      app.db.query(
        `select id,organization_id as "organizationId",name,company,email,phone,notes,status,
                created_at as "createdAt",updated_at as "updatedAt"
           from crm_contacts where organization_id=any($1::uuid[])
          order by organization_id,updated_at desc,id`,
        [organizationIds],
      ),
      app.db.query(
        `select id,organization_id as "organizationId",contact_id as "contactId",title,stage,
                value_cents::bigint as "valueCents",expected_close_date as "expectedCloseDate",
                owner_admin_id as "ownerAdminId",notes,created_at as "createdAt",updated_at as "updatedAt"
           from crm_opportunities where organization_id=any($1::uuid[])
          order by organization_id,updated_at desc,id`,
        [organizationIds],
      ),
      app.db.query(
        `select id,organization_id as "organizationId",contact_id as "contactId",
                opportunity_id as "opportunityId",title,due_at as "dueAt",status,
                assigned_to as "assignedTo",notes,created_at as "createdAt",updated_at as "updatedAt"
           from crm_tasks where organization_id=any($1::uuid[])
          order by organization_id,due_at nulls last,created_at desc,id`,
        [organizationIds],
      ),
      app.db.query(
        `select id,label,address,latitude,longitude,organization_id as "orgId",venue_type as "venueType",
                created_at as "createdAt",updated_at as "updatedAt"
           from locations where organization_id=any($1::uuid[])
          order by organization_id,label,id`,
        [organizationIds],
      ),
      app.db.query(
        `select device.id,device.name,device.status,device.location_id as "locationId",
                device.organization_id as "orgId",location.venue_type as "venueType",
                device.last_seen_at as "lastSeenAt",device.updated_at as "updatedAt"
           from devices device left join locations location on location.id=device.location_id
          where device.organization_id=any($1::uuid[])
          order by device.organization_id,device.name,device.id`,
        [organizationIds],
      ),
    ]);
    return {
      organizations: organizationResult.rows,
      members: members.rows,
      contacts: contacts.rows,
      opportunities: opportunities.rows,
      tasks: tasks.rows,
      locations: locations.rows,
      devices: devices.rows,
    };
  });

  app.post('/api/admin/network/organizations', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = validateOrganization(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
    const parentId = request.body?.organizationId ?? null;
    if (!parentId) {
      if (parsed.value.kind !== 'matrix') return reply.code(400).send({ error: 'invalid_root_organization' });
      const client = await app.db.connect();
      const id = randomUUID();
      try {
        await client.query('begin');
        const { rows } = await client.query(
          `insert into organizations(id,parent_id,kind,name,created_by) values($1,null,$2,$3,$4)
           returning id,parent_id as "parentId",kind,name,status,created_at as "createdAt",updated_at as "updatedAt"`,
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
        const response = referenceError(error, reply);
        if (response) return response;
        throw error;
      } finally {
        client.release();
      }
    }
    const access = await scopedAccess(app, request, reply, parentId, MANAGE_ROLES);
    if (!access) return;
    if (!isChildKindAllowed(access.kind, parsed.value.kind)) {
      return reply.code(400).send({ error: 'invalid_organization_hierarchy' });
    }
    const { rows } = await app.db.query(
      `insert into organizations(id,parent_id,kind,name,created_by) values($1,$2,$3,$4,$5)
       returning id,parent_id as "parentId",kind,name,status,created_at as "createdAt",updated_at as "updatedAt"`,
      [randomUUID(), parentId, parsed.value.kind, parsed.value.name, request.admin.id],
    );
    return reply.code(201).send({ organization: rows[0] });
  });

  app.post('/api/admin/network/members', { preHandler: requireAdmin }, async (request, reply) => {
    const organizationId = request.body?.organizationId;
    const access = await scopedAccess(app, request, reply, organizationId, MANAGE_ROLES);
    if (!access) return;
    const parsed = validateMember(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
    try {
      const { rows } = await app.db.query(
        `insert into organization_members(organization_id,admin_id,role,created_by)
         values($1,$2,$3,$4)
         on conflict(organization_id,admin_id) do update set role=excluded.role,updated_at=now()
         returning organization_id as "organizationId",admin_id as "adminId",role,
                   created_at as "createdAt",updated_at as "updatedAt"`,
        [organizationId, parsed.value.adminId, parsed.value.role, request.admin.id],
      );
      return reply.code(201).send({ member: rows[0] });
    } catch (error) {
      const response = referenceError(error, reply);
      if (response) return response;
      throw error;
    }
  });

  app.post('/api/admin/network/contacts', { preHandler: requireAdmin }, async (request, reply) => {
    const organizationId = request.body?.organizationId;
    const access = await scopedAccess(app, request, reply, organizationId, CRM_WRITE_ROLES);
    if (!access) return;
    const parsed = validateContact(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
    const value = parsed.value;
    const { rows } = await app.db.query(
      `insert into crm_contacts(id,organization_id,name,company,email,phone,notes,status,created_by)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning id,organization_id as "organizationId",name,company,email,phone,notes,status,
                 created_at as "createdAt",updated_at as "updatedAt"`,
      [randomUUID(), organizationId, value.name, value.company, value.email, value.phone, value.notes, value.status, request.admin.id],
    );
    return reply.code(201).send({ contact: rows[0] });
  });

  app.post('/api/admin/network/opportunities', { preHandler: requireAdmin }, async (request, reply) => {
    const organizationId = request.body?.organizationId;
    const access = await scopedAccess(app, request, reply, organizationId, CRM_WRITE_ROLES);
    if (!access) return;
    const parsed = validateOpportunity(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
    const value = parsed.value;
    try {
      const { rows } = await app.db.query(
        `insert into crm_opportunities(
           id,organization_id,contact_id,title,stage,value_cents,expected_close_date,owner_admin_id,notes,created_by
         ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         returning id,organization_id as "organizationId",contact_id as "contactId",title,stage,
                   value_cents::bigint as "valueCents",expected_close_date as "expectedCloseDate",
                   owner_admin_id as "ownerAdminId",notes,created_at as "createdAt",updated_at as "updatedAt"`,
        [randomUUID(), organizationId, value.contactId, value.title, value.stage, value.valueCents,
          value.expectedCloseDate, value.ownerAdminId, value.notes, request.admin.id],
      );
      return reply.code(201).send({ opportunity: rows[0] });
    } catch (error) {
      const response = referenceError(error, reply);
      if (response) return response;
      throw error;
    }
  });

  app.post('/api/admin/network/tasks', { preHandler: requireAdmin }, async (request, reply) => {
    const organizationId = request.body?.organizationId;
    const access = await scopedAccess(app, request, reply, organizationId, CRM_WRITE_ROLES);
    if (!access) return;
    const parsed = validateTask(request.body);
    if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
    const value = parsed.value;
    try {
      const { rows } = await app.db.query(
        `insert into crm_tasks(
           id,organization_id,contact_id,opportunity_id,title,due_at,status,assigned_to,notes,created_by
         ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         returning id,organization_id as "organizationId",contact_id as "contactId",
                   opportunity_id as "opportunityId",title,due_at as "dueAt",status,
                   assigned_to as "assignedTo",notes,created_at as "createdAt",updated_at as "updatedAt"`,
        [randomUUID(), organizationId, value.contactId, value.opportunityId, value.title,
          value.dueAt, value.status, value.assignedTo, value.notes, request.admin.id],
      );
      return reply.code(201).send({ task: rows[0] });
    } catch (error) {
      const response = referenceError(error, reply);
      if (response) return response;
      throw error;
    }
  });
}
