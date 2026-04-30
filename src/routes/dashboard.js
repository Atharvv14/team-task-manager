const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/dashboard — overview stats for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Projects the user is part of
    const memberships = await prisma.projectMember.findMany({ where: { userId } });
    const ownedIds = (await prisma.project.findMany({
      where: { ownerId: userId }, select: { id: true }
    })).map(p => p.id);

    const projectIds = [...new Set([
      ...memberships.map(m => m.projectId),
      ...ownedIds
    ])];

    // All tasks in those projects
    const allTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Tasks assigned to me
    const myTasks = allTasks.filter(t => t.assigneeId === userId);

    // Overdue = past due date, not DONE
    const overdueTasks = allTasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    // Due soon (next 3 days, not done)
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const dueSoon = allTasks.filter(t =>
      t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= threeDays && t.status !== 'DONE'
    );

    // Status breakdown
    const statusBreakdown = {
      TODO: allTasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
      REVIEW: allTasks.filter(t => t.status === 'REVIEW').length,
      DONE: allTasks.filter(t => t.status === 'DONE').length
    };

    // Priority breakdown
    const priorityBreakdown = {
      LOW: allTasks.filter(t => t.priority === 'LOW').length,
      MEDIUM: allTasks.filter(t => t.priority === 'MEDIUM').length,
      HIGH: allTasks.filter(t => t.priority === 'HIGH').length,
      URGENT: allTasks.filter(t => t.priority === 'URGENT').length
    };

    // Recent activity (last 5 updated tasks)
    const recentActivity = allTasks.slice(0, 8).map(t => ({
      ...t,
      isOverdue: t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    }));

    // Projects summary
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        _count: { select: { tasks: true, members: true } }
      }
    });

    res.json({
      stats: {
        totalProjects: projectIds.length,
        totalTasks: allTasks.length,
        myTasks: myTasks.length,
        overdueTasks: overdueTasks.length,
        dueSoon: dueSoon.length,
        completionRate: allTasks.length > 0
          ? Math.round((statusBreakdown.DONE / allTasks.length) * 100)
          : 0
      },
      statusBreakdown,
      priorityBreakdown,
      overdueTasks: overdueTasks.slice(0, 5).map(t => ({
        ...t,
        isOverdue: true
      })),
      dueSoon: dueSoon.slice(0, 5),
      recentActivity,
      myTasks: myTasks.slice(0, 10).map(t => ({
        ...t,
        isOverdue: t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
      })),
      projects
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
