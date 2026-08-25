import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { UUID, requireOrganizationAccess } from '../services/organization-access.js';

const CONTACT_STATUSES = new Set(['lead', 'customer', 'inactive']);
const OPPORTUNITY_STAGES = new Set(['lead', 'qualified', 'proposal', 'won', 'lost']);
const TASK_STATUSES = new Set(['open', 'done', 'cancelled']);
const CRM_WRITE_ROLES = ['owner', 'admin', 'manager', 'sales'];

function optionalText(value, maxLength) {
  if (value == null || value === '') return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false };
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) return { ok: false };
  return { ok: true, value: normalized };
}

function optionalUuid(value) {
  if (value == null || value === '') return { ok: true, value: null };
  if (typeof value !== 'string' || !UUID.test(value.trim())) return { ok: false };
  return { ok: true, value: value.trim() };
}

function optionalDate(value) {
  if (value == null || value === '') return { ok: true, value: null };
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false };
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
    ? { ok: false }
    : { ok: true, value };
}

function optionalTimestamp(value) {
  if (value == null || value === '') return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false };
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? { ok: false } : { ok: true, value: parsed.toISOString() };
}

export function validateContact(body) {
  const name = optionalText(body?.name, 160);
  const company = optionalText(body?.company, 160);
  const phone = optionalText(body?.phone, 40);
  const notes = optionalText(body?.notes, 4000);
  const status = body?.status == null ? 'lead' : String(body.status).trim().toLowerCase();
  let email = null;
  if (body?.email != null && body.email !== '') {
    if (typeof body.email !== 'string') return { ok: false };
    email = body.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false };
  }
  if (!name.ok || !name.value || !company.ok || !phone.ok || !notes.ok || !CONTACT_STATUSES.has(status)) {
    return { ok: false };
  }
  return { ok: true, value: { name: name.value, company: company.value, email, phone: phone.value, notes: notes.value, status } };
}

export function validateOpportunity(body) {
  const title = optionalText(body?.title, 200);
  const contactId = optionalUuid(body?.contactId);
  const ownerAdminId = optionalUuid(body?.ownerAdminId);
  const expectedCloseDate = optionalDate(body?.expectedCloseDate);
  const notes = optionalText(body?.notes, 4000);
  const stage = body?.stage == null ? 'lead' : String(body.stage).trim().toLowerCase();
  const valueCents = body?.valueCents == null ? 0 : body.valueCents;
  if (!title.ok || !title.value || !contactId.ok || !ownerAdminId.ok || !expectedCloseDate.ok || !notes.ok
    || !OPPORTUNITY_STAGES.has(stage) || !Number.isSafeInteger(valueCents) || valueCents < 0) return { ok: false };
  return {
    ok: true,
    value: {
      title: title.value,
      contactId: contactId.value,
      stage,
      valueCents,
      expectedCloseDate: expectedCloseDate.value,
      ownerAdminId: ownerAdminId.value,
      notes: notes.value,
    },
  };
}

export function validateTask(body) {
  const title = optionalText(body?.title, 200);
  const contactId = optionalUuid(body?.contactId);
  const opportunityId = optionalUuid(body?.opportunityId);
  const assignedTo = optionalUuid(body?.assignedTo);
  const dueAt = optionalTimestamp(body?.dueAt);
  const notes = optionalText(body?.notes, 4000);
  const status = body?.status == null ? 'open' : String(body.status).trim().toLowerCase();
  if (!title.ok || !title.value || !contactId.ok || !opportunityId.ok || !assignedTo.ok || !dueAt.ok || !notes.ok
    || !TASK_STATUSES.has(status)) return { ok: false };
  return {
    ok: true,
    value: {
      title: title.value,
      contactId: contactId.value,
      opportunityId: opportunityId.value,
      dueAt: dueAt.value,
      status,
      assignedTo: assignedTo.value,
      notes: notes.value,
    },
  };
}

export function validateOpportunityPatch(body) {
  const stage = typeof body?.stage === 'string' ? body.stage.trim().toLowerCase() : '';
  return OPPORTUNITY_STAGES.has(stage) ? { ok: true, value: { stage } } : { ok: false };
}

export function validateTaskPatch(body) {
  const status = typeof body?.status === 'string' ? body.status.trim().toLowerCase() : '';
  return TASK_STATUSES.has(status) ? { ok: true, value: { status } } : { ok: false };
}

function referenceError(error, reply) {
  if (error?.code === '23503') return reply.code(400).send({ error: 'invalid_tenant_reference' });
  return null;
}

export default async function crmRoutes(app) {
  const canRead = requireOrganizationAccess();
  const canWrite = requireOrganizationAccess({ roles: CRM_WRITE_ROLES });

  app.get(
    '/api/admin/organizations/:organizationId/crm/contacts',
    { preHandler: [requireAdmin, canRead] },
    async (request) => {
      const { rows } = await app.db.query(
        `select id,organization_id as "organizationId",name,company,email,phone,notes,status,
                created_at as "createdAt",updated_at as "updatedAt"
           from crm_contacts where organization_id=$1 order by updated_at desc,id`,
        [request.params.organizationId],
      );
      return { contacts: rows };
    },
  );

  app.post(
    '/api/admin/organizations/:organizationId/crm/contacts',
    { preHandler: [requireAdmin, canWrite] },
    async (request, reply) => {
      const parsed = validateContact(request.body);
      if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
      const id = randomUUID();
      const value = parsed.value;
      const { rows } = await app.db.query(
        `insert into crm_contacts(id,organization_id,name,company,email,phone,notes,status,created_by)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9)
         returning id,organization_id as "organizationId",name,company,email,phone,notes,status,
                   created_at as "createdAt",updated_at as "updatedAt"`,
        [id, request.params.organizationId, value.name, value.company, value.email, value.phone, value.notes, value.status, request.admin.id],
      );
      return reply.code(201).send({ contact: rows[0] });
    },
  );

  app.get(
    '/api/admin/organizations/:organizationId/crm/opportunities',
    { preHandler: [requireAdmin, canRead] },
    async (request) => {
      const { rows } = await app.db.query(
        `select id,organization_id as "organizationId",contact_id as "contactId",title,stage,
                value_cents::bigint as "valueCents",expected_close_date as "expectedCloseDate",
                owner_admin_id as "ownerAdminId",notes,created_at as "createdAt",updated_at as "updatedAt"
           from crm_opportunities where organization_id=$1 order by updated_at desc,id`,
        [request.params.organizationId],
      );
      return { opportunities: rows };
    },
  );

  app.post(
    '/api/admin/organizations/:organizationId/crm/opportunities',
    { preHandler: [requireAdmin, canWrite] },
    async (request, reply) => {
      const parsed = validateOpportunity(request.body);
      if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
      const id = randomUUID();
      const value = parsed.value;
      try {
        const { rows } = await app.db.query(
          `insert into crm_opportunities(
             id,organization_id,contact_id,title,stage,value_cents,expected_close_date,owner_admin_id,notes,created_by
           ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           returning id,organization_id as "organizationId",contact_id as "contactId",title,stage,
                     value_cents::bigint as "valueCents",expected_close_date as "expectedCloseDate",
                     owner_admin_id as "ownerAdminId",notes,created_at as "createdAt",updated_at as "updatedAt"`,
          [id, request.params.organizationId, value.contactId, value.title, value.stage, value.valueCents,
            value.expectedCloseDate, value.ownerAdminId, value.notes, request.admin.id],
        );
        return reply.code(201).send({ opportunity: rows[0] });
      } catch (error) {
        const response = referenceError(error, reply);
        if (response) return response;
        throw error;
      }
    },
  );

  app.patch(
    '/api/admin/organizations/:organizationId/crm/opportunities/:opportunityId',
    { preHandler: [requireAdmin, canWrite] },
    async (request, reply) => {
      if (!UUID.test(request.params.opportunityId ?? '')) return reply.code(400).send({ error: 'invalid_opportunity_id' });
      const parsed = validateOpportunityPatch(request.body);
      if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
      const { rows } = await app.db.query(
        `update crm_opportunities set stage=$1,updated_at=now()
          where id=$2 and organization_id=$3
          returning id,organization_id as "organizationId",contact_id as "contactId",title,stage,
                    value_cents::bigint as "valueCents",expected_close_date as "expectedCloseDate",
                    owner_admin_id as "ownerAdminId",notes,created_at as "createdAt",updated_at as "updatedAt"`,
        [parsed.value.stage, request.params.opportunityId, request.params.organizationId],
      );
      if (!rows[0]) return reply.code(404).send({ error: 'opportunity_not_found' });
      return { opportunity: rows[0] };
    },
  );

  app.get(
    '/api/admin/organizations/:organizationId/crm/tasks',
    { preHandler: [requireAdmin, canRead] },
    async (request) => {
      const { rows } = await app.db.query(
        `select id,organization_id as "organizationId",contact_id as "contactId",
                opportunity_id as "opportunityId",title,due_at as "dueAt",status,
                assigned_to as "assignedTo",notes,created_at as "createdAt",updated_at as "updatedAt"
           from crm_tasks where organization_id=$1 order by due_at nulls last,created_at desc,id`,
        [request.params.organizationId],
      );
      return { tasks: rows };
    },
  );

  app.post(
    '/api/admin/organizations/:organizationId/crm/tasks',
    { preHandler: [requireAdmin, canWrite] },
    async (request, reply) => {
      const parsed = validateTask(request.body);
      if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
      const id = randomUUID();
      const value = parsed.value;
      try {
        const { rows } = await app.db.query(
          `insert into crm_tasks(
             id,organization_id,contact_id,opportunity_id,title,due_at,status,assigned_to,notes,created_by
           ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           returning id,organization_id as "organizationId",contact_id as "contactId",
                     opportunity_id as "opportunityId",title,due_at as "dueAt",status,
                     assigned_to as "assignedTo",notes,created_at as "createdAt",updated_at as "updatedAt"`,
          [id, request.params.organizationId, value.contactId, value.opportunityId, value.title,
            value.dueAt, value.status, value.assignedTo, value.notes, request.admin.id],
        );
        return reply.code(201).send({ task: rows[0] });
      } catch (error) {
        const response = referenceError(error, reply);
        if (response) return response;
        throw error;
      }
    },
  );

  app.patch(
    '/api/admin/organizations/:organizationId/crm/tasks/:taskId',
    { preHandler: [requireAdmin, canWrite] },
    async (request, reply) => {
      if (!UUID.test(request.params.taskId ?? '')) return reply.code(400).send({ error: 'invalid_task_id' });
      const parsed = validateTaskPatch(request.body);
      if (!parsed.ok) return reply.code(400).send({ error: 'invalid_request' });
      const { rows } = await app.db.query(
        `update crm_tasks set status=$1,updated_at=now()
          where id=$2 and organization_id=$3
          returning id,organization_id as "organizationId",contact_id as "contactId",
                    opportunity_id as "opportunityId",title,due_at as "dueAt",status,
                    assigned_to as "assignedTo",notes,created_at as "createdAt",updated_at as "updatedAt"`,
        [parsed.value.status, request.params.taskId, request.params.organizationId],
      );
      if (!rows[0]) return reply.code(404).send({ error: 'task_not_found' });
      return { task: rows[0] };
    },
  );
}
