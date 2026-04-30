const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database…')

  // Create demo users
  const pw = await bcrypt.hash('demo1234', 12)

  const alice = await prisma.user.upsert({
    where: { email: 'alice@demo.com' },
    update: {},
    create: { email: 'alice@demo.com', name: 'Alice Johnson', password: pw }
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@demo.com' },
    update: {},
    create: { email: 'bob@demo.com', name: 'Bob Smith', password: pw }
  })

  // Create a demo project
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      name: 'Website Redesign',
      description: 'Redesigning the company website for Q3 launch',
      color: '#7C6EFA',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id,   role: 'MEMBER' }
        ]
      }
    }
  })

  // Create sample tasks
  const now = new Date()
  const tasks = [
    { title: 'Design new homepage mockups', status: 'DONE',        priority: 'HIGH',   assigneeId: alice.id, creatorId: alice.id },
    { title: 'Set up component library',    status: 'IN_PROGRESS', priority: 'HIGH',   assigneeId: bob.id,   creatorId: alice.id },
    { title: 'Write API documentation',     status: 'TODO',        priority: 'MEDIUM', assigneeId: bob.id,   creatorId: alice.id,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) },
    { title: 'User testing sessions',       status: 'REVIEW',      priority: 'URGENT', assigneeId: alice.id, creatorId: bob.id,
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) },
    { title: 'Performance optimization',    status: 'TODO',        priority: 'LOW',    creatorId: alice.id,
      dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) }, // overdue
  ]

  for (const task of tasks) {
    await prisma.task.create({ data: { ...task, projectId: project.id } })
  }

  console.log('✅ Seed complete!')
  console.log('   Demo accounts:')
  console.log('   alice@demo.com / demo1234')
  console.log('   bob@demo.com   / demo1234')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
