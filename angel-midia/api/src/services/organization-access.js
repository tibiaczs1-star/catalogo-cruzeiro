export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ORGANIZATION_ROLES = new Set(['owner', 'admin', 'manager', 'sales', 'operator', 'viewer']);

export async function findOrganizationAccess(db, adminId, organizationId) {
  const { rows } = await db.query(
    `with recursive ancestors as (
       select id,parent_id,kind,name,status,0 as depth
         from organizations
        where id=$1 and status='active'
       union all
       select parent.id,parent.parent_id,parent.kind,parent.name,parent.status,ancestors.depth+1
         from organizations parent
         join ancestors on ancestors.parent_id=parent.id
        where parent.status='active'
     )
     select target.id,target.parent_id as "parentId",target.kind,target.name,target.status,
            member.role as "effectiveRole",member.organization_id as "membershipOrganizationId"
       from ancestors
       join organization_members member
         on member.organization_id=ancestors.id and member.admin_id=$2
       join organizations target on target.id=$1
      order by case member.role
        when 'owner' then 0 when 'admin' then 1 when 'manager' then 2
        when 'sales' then 3 when 'operator' then 4 else 5 end,
        ancestors.depth
      limit 1`,
    [organizationId, adminId],
  );
  return rows[0] ?? null;
}

export function requireOrganizationAccess({ roles } = {}) {
  const allowedRoles = roles ? new Set(roles) : null;
  return async function organizationAccessHandler(request, reply) {
    const organizationId = request.params?.organizationId;
    if (!UUID.test(organizationId ?? '')) {
      return reply.code(400).send({ error: 'invalid_organization_id' });
    }
    const access = await findOrganizationAccess(request.server.db, request.admin.id, organizationId);
    if (!access) return reply.code(403).send({ error: 'organization_access_denied' });
    if (allowedRoles && !allowedRoles.has(access.effectiveRole)) {
      return reply.code(403).send({ error: 'insufficient_organization_role' });
    }
    request.organizationAccess = access;
  };
}
