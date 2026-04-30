const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireProjectMember, requireProjectAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── Get tasks for a project ──────────────────────────────────────
router.get('/project/:projectId', authenticate, requireProjectMember, async (req, res) => {
  try {
    const { status, priority, assigneeId } = req.query;

    // Auto-update overdue logic: tasks past due that are not DONE become effectively overdue
    // We compute this on read rather than storing it, to avoid cron jobs
    const tasks = await prisma.task.findMany({
      where: {
        projectId: req.params.projectId,
        ...(status && status !== 'ALL' && { status }),
        ...(priority && { priority }),
        ...(assigneeId && { assigneeId })
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        creator: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });

    // Mark overdue in-memory
    const now = new Date();
    const enriched = tasks.map(t => ({
      ...t,
      isOverdue: t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Create task ──────────────────────────────────────────────────
router.post('/project/:projectId', authenticate, requireProjectMember, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title required'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional({ nullable: true }).isISO8601().toDate()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, status, priority, dueDate, assigneeId } = req.body;

  try {
    // Validate assignee is a project member
    if (assigneeId) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: req.params.projectId, userId: assigneeId } }
      });
      const isOwner = req.project.ownerId === assigneeId;
      if (!membership && !isOwner) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: req.params.projectId,
        creatorId: req.user.id,
        assigneeId: assigneeId || null
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        creator: { select: { id: true, name: true, avatar: true } }
      }
    });

    const now = new Date();
    res.status(201).json({
      ...task,
      isOverdue: task.dueDate && new Date(task.dueDate) < now && task.status !== 'DONE'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update task ──────────────────────────────────────────────────
router.put('/project/:projectId/:taskId', authenticate, requireProjectMember, [
  body('title').optional().trim().isLength({ min: 1 }),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional({ nullable: true })
], async (req, res) => {
  const { taskId, projectId } = req.params;

  try {
    const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Members can only update tasks they created or are assigned to
    const isAdmin = req.userRole === 'ADMIN';
    const isOwnerOfTask = task.creatorId === req.user.id || task.assigneeId === req.user.id;
    if (!isAdmin && !isOwnerOfTask) {
      return res.status(403).json({ error: 'No permission to update this task' });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null })
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        creator: { select: { id: true, name: true, avatar: true } }
      }
    });

    const now = new Date();
    res.json({
      ...updated,
      isOverdue: updated.dueDate && new Date(updated.dueDate) < now && updated.status !== 'DONE'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Delete task ──────────────────────────────────────────────────
router.delete('/project/:projectId/:taskId', authenticate, requireProjectMember, async (req, res) => {
  const { taskId, projectId } = req.params;

  try {
    const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isAdmin = req.userRole === 'ADMIN';
    if (!isAdmin && task.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'No permission to delete this task' });
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
