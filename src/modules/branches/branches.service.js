const prisma = require('../../config/prisma');
const { z } = require('zod');

const createBranchSchema = z.object({
  name: z.string().min(2, 'Branch name is required').max(120),
  location: z.string().min(2, 'Branch location is required').max(200),
});

const getBranches = async () => {
  const branches = await prisma.branch.findMany({
    include: {
      _count: {
        select: {
          inventory: true,
          transactions: true,
          reservations: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return branches;
};

const createBranch = async (data) => {
  const validated = createBranchSchema.parse(data);

  const branch = await prisma.branch.create({
    data: validated,
  });

  return branch;
};

module.exports = { getBranches, createBranch };
