const prisma = require('../../config/prisma');
const { z } = require('zod');

const getAuditLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: z.string().trim().min(1).optional(),
  entity: z.string().trim().min(1).optional(),
  userId: z.coerce.number().int().positive().optional(),
});

const getAuditLogs = async (query) => {
  const validated = getAuditLogsSchema.parse(query || {});

  const where = {};
  if (validated.action) {
    where.action = { contains: validated.action, mode: 'insensitive' };
  }
  if (validated.entity) {
    where.entity = { contains: validated.entity, mode: 'insensitive' };
  }
  if (validated.userId) {
    where.userId = validated.userId;
  }

  const skip = (validated.page - 1) * validated.limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: validated.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const userIds = [...new Set(logs.map((log) => log.userId).filter((id) => typeof id === 'number'))];

  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : [];

  const userById = new Map(users.map((user) => [user.id, user]));

  const enrichedLogs = logs.map((log) => {
    const user = typeof log.userId === 'number' ? userById.get(log.userId) : null;

    return {
      ...log,
      userName: user?.name || (log.userId ? `User #${log.userId}` : 'System'),
      userEmail: user?.email || null,
    };
  });

  return {
    logs: enrichedLogs,
    total,
    page: validated.page,
    limit: validated.limit,
  };
};

module.exports = { getAuditLogs };
