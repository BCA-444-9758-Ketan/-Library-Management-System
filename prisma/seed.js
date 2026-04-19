const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;

const branchesSeed = [
  { name: 'Main Branch', location: 'CIMAGE Boring Road Patna' },
  { name: 'North Campus', location: 'Patna North' },
  { name: 'East Wing', location: 'Patna East' },
];

const categories = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Management',
  'Literature',
  'Engineering',
];

const booksSeed = [
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '9780132350884',
    category: 'Computer Science',
    description: 'A handbook of agile software craftsmanship.',
    publishedYear: 2008,
  },
  {
    title: 'Design Patterns',
    author: 'Erich Gamma',
    isbn: '9780201633610',
    category: 'Computer Science',
    description: 'Elements of reusable object-oriented software.',
    publishedYear: 1994,
  },
  {
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    isbn: '9780262046305',
    category: 'Computer Science',
    description: 'Comprehensive guide to modern algorithms.',
    publishedYear: 2022,
  },
  {
    title: 'Discrete Mathematics and Its Applications',
    author: 'Kenneth Rosen',
    isbn: '9780073383095',
    category: 'Mathematics',
    description: 'Core concepts in discrete math.',
    publishedYear: 2018,
  },
  {
    title: 'Linear Algebra Done Right',
    author: 'Sheldon Axler',
    isbn: '9783319110790',
    category: 'Mathematics',
    description: 'A clear and conceptual linear algebra text.',
    publishedYear: 2015,
  },
  {
    title: 'Calculus',
    author: 'James Stewart',
    isbn: '9781285740621',
    category: 'Mathematics',
    description: 'Standard calculus reference for engineering and science.',
    publishedYear: 2015,
  },
  {
    title: 'Concepts of Physics Volume 1',
    author: 'H. C. Verma',
    isbn: '9788177091878',
    category: 'Physics',
    description: 'Foundational physics concepts and problems.',
    publishedYear: 2017,
  },
  {
    title: 'University Physics',
    author: 'Hugh D. Young',
    isbn: '9780135159552',
    category: 'Physics',
    description: 'Comprehensive university-level physics.',
    publishedYear: 2019,
  },
  {
    title: 'Fundamentals of Physics',
    author: 'David Halliday',
    isbn: '9781119454014',
    category: 'Physics',
    description: 'Classic textbook for physics students.',
    publishedYear: 2020,
  },
  {
    title: 'Principles of Management',
    author: 'P. C. Tripathi',
    isbn: '9781259004933',
    category: 'Management',
    description: 'Core principles of organizational management.',
    publishedYear: 2019,
  },
  {
    title: 'Marketing Management',
    author: 'Philip Kotler',
    isbn: '9789352863020',
    category: 'Management',
    description: 'Strategies and frameworks in modern marketing.',
    publishedYear: 2021,
  },
  {
    title: 'Financial Management',
    author: 'I. M. Pandey',
    isbn: '9789332586840',
    category: 'Management',
    description: 'Financial planning and corporate decision making.',
    publishedYear: 2020,
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    isbn: '9780062315007',
    category: 'Literature',
    description: 'A philosophical novel on destiny and purpose.',
    publishedYear: 2014,
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    category: 'Literature',
    description: 'An American classic set in the Jazz Age.',
    publishedYear: 2004,
  },
  {
    title: 'Train to Pakistan',
    author: 'Khushwant Singh',
    isbn: '9780143065883',
    category: 'Literature',
    description: 'A moving narrative during the partition era.',
    publishedYear: 2009,
  },
  {
    title: 'Engineering Mechanics',
    author: 'R. C. Hibbeler',
    isbn: '9780133918922',
    category: 'Engineering',
    description: 'Statics and dynamics for engineering students.',
    publishedYear: 2015,
  },
  {
    title: 'Basic Electrical Engineering',
    author: 'V. K. Mehta',
    isbn: '9788121924375',
    category: 'Engineering',
    description: 'Fundamentals of electrical engineering.',
    publishedYear: 2018,
  },
  {
    title: 'Strength of Materials',
    author: 'R. K. Rajput',
    isbn: '9788131808146',
    category: 'Engineering',
    description: 'Material behavior under different stresses.',
    publishedYear: 2019,
  },
  {
    title: 'You Dont Know JS Yet',
    author: 'Kyle Simpson',
    isbn: '9781098124045',
    category: 'Computer Science',
    description: 'Deep dive into core JavaScript behavior.',
    publishedYear: 2020,
  },
  {
    title: 'Deep Work',
    author: 'Cal Newport',
    isbn: '9781455586691',
    category: 'Management',
    description: 'Rules for focused success in a distracted world.',
    publishedYear: 2016,
  },
];

async function main() {
  console.log('Starting seed...');

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.reservation.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.book.deleteMany(),
    prisma.branch.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@smartlibrary.in',
      password: passwordHash,
      role: 'ADMIN',
      borrowingLimit: 10,
    },
  });

  const librarian = await prisma.user.create({
    data: {
      name: 'Ram Librarian',
      email: 'librarian@smartlibrary.in',
      password: passwordHash,
      role: 'LIBRARIAN',
      borrowingLimit: 7,
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Student',
      email: 'rahul@smartlibrary.in',
      password: passwordHash,
      role: 'STUDENT',
      borrowingLimit: 3,
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Student',
      email: 'priya@smartlibrary.in',
      password: passwordHash,
      role: 'STUDENT',
      borrowingLimit: 3,
    },
  });

  const branches = [];
  for (const branchData of branchesSeed) {
    const branch = await prisma.branch.create({ data: branchData });
    branches.push(branch);
  }

  const books = [];
  for (const bookData of booksSeed) {
    const book = await prisma.book.create({ data: bookData });
    books.push(book);
  }

  for (const book of books) {
    for (const branch of branches) {
      const totalQuantity = ((book.id + branch.id) % 6) + 2;
      const availableQuantity = Math.max(1, totalQuantity - ((book.id * branch.id) % 2));

      await prisma.inventory.create({
        data: {
          bookId: book.id,
          branchId: branch.id,
          totalQuantity,
          availableQuantity,
        },
      });
    }
  }

  const today = Date.now();

  const activeIssue = await prisma.transaction.create({
    data: {
      userId: rahul.id,
      bookId: books[0].id,
      branchId: branches[0].id,
      status: 'ISSUED',
      dueDate: new Date(today + 10 * DAY_MS),
    },
  });

  await prisma.inventory.update({
    where: {
      bookId_branchId: {
        bookId: books[0].id,
        branchId: branches[0].id,
      },
    },
    data: {
      availableQuantity: {
        decrement: 1,
      },
    },
  });

  const overdueIssue = await prisma.transaction.create({
    data: {
      userId: priya.id,
      bookId: books[1].id,
      branchId: branches[1].id,
      status: 'ISSUED',
      dueDate: new Date(today - 3 * DAY_MS),
    },
  });

  await prisma.inventory.update({
    where: {
      bookId_branchId: {
        bookId: books[1].id,
        branchId: branches[1].id,
      },
    },
    data: {
      availableQuantity: {
        decrement: 1,
      },
    },
  });

  const returnedTx = await prisma.transaction.create({
    data: {
      userId: rahul.id,
      bookId: books[2].id,
      branchId: branches[2].id,
      status: 'RETURNED',
      issuedAt: new Date(today - 20 * DAY_MS),
      dueDate: new Date(today - 6 * DAY_MS),
      returnedAt: new Date(today - 2 * DAY_MS),
      fineAmount: 20,
    },
  });

  await prisma.inventory.update({
    where: {
      bookId_branchId: {
        bookId: books[5].id,
        branchId: branches[1].id,
      },
    },
    data: {
      availableQuantity: 0,
    },
  });

  const pendingReservation = await prisma.reservation.create({
    data: {
      userId: rahul.id,
      bookId: books[5].id,
      branchId: branches[1].id,
      status: 'PENDING',
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'SEED_ISSUE_CREATED',
        entity: 'transactions',
        entityId: activeIssue.id,
        userId: librarian.id,
        metadata: { note: 'Sample active issue for demo' },
      },
      {
        action: 'SEED_OVERDUE_CREATED',
        entity: 'transactions',
        entityId: overdueIssue.id,
        userId: librarian.id,
        metadata: { note: 'Sample overdue issue for demo' },
      },
      {
        action: 'SEED_RETURNED_CREATED',
        entity: 'transactions',
        entityId: returnedTx.id,
        userId: librarian.id,
        metadata: { note: 'Sample returned transaction with fine' },
      },
      {
        action: 'SEED_RESERVATION_CREATED',
        entity: 'reservations',
        entityId: pendingReservation.id,
        userId: rahul.id,
        metadata: { note: 'Sample pending reservation for queue demo' },
      },
    ],
  });

  console.log('Seed complete.');
  console.log('Demo users (password: password123):');
  console.log('- ADMIN: admin@smartlibrary.in');
  console.log('- LIBRARIAN: librarian@smartlibrary.in');
  console.log('- STUDENT: rahul@smartlibrary.in');
  console.log('- STUDENT: priya@smartlibrary.in');
  console.log(`Created ${categories.length} categories and ${books.length} books.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
