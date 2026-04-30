const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── Get all projects for current user ───────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true, avatar: true } },
            _count: { select: { tasks: true, members: true } }
          }
        }
      }
    });

    const ownedProjects = await prisma.project.findMany({
      where: { ownerId: req.user.id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { tasks: true, members: true } }
      }
    });

    // Merge: owned + member, deduplicate
    const memberProjectIds = new Set(memberships.map(m => m.project.id));
    const combined = [
      ...ownedProjects.map(p => ({ ...p, userRole: 'ADMIN' })),
      ...memberships
        .filter(m => !ownedProjects.find(p => p.id === m.project.id))
        .map(m => ({ ...m.project, userRole: m.role }))
    ];

    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Create project ───────────────────────────────────────────────
router.post('/', authenticate, [
  body('name').trim().isLength({ min: 1 }).withMessage('Project name required'),
  body('description').optional().trim(),
  body('color').optional().isHexColor()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, color } = req.body;

  try {
    const project = await prisma.project.create({
      data: {
        name, description, color: color || '#6366F1',
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { tasks: true, members: true } }
      }
    });

    res.status(201).json({ ...project, userRole: 'ADMIN' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get single project ───────────────────────────────────────────
router.get('/:projectId', authenticate, requireProjectMember, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } }
          }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true, avatar: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ ...project, userRole: req.userRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update project ───────────────────────────────────────────────
router.put('/:projectId', authenticate, requireProjectAdmin, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('color').optional().isHexColor()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, color } = req.body;

  try {
    const project = await prisma.project.update({
      where: { id: req.params.projectId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color })
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { tasks: true, members: true } }
      }
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Delete project ───────────────────────────────────────────────
router.delete('/:projectId', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id) return res.status(403).json({ error: 'Only owner can delete project' });

    await prisma.project.delete({ where: { id: req.params.projectId } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Add member ───────────────────────────────────────────────────
router.post('/:projectId/members', authenticate, requireProjectAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['ADMIN', 'MEMBER'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, role = 'MEMBER' } = req.body;

  try {
    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found with that email' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.projectId, userId: userToAdd.id } }
    });
    if (existing) return res.status(409).json({ error: 'User is already a member' });

    const member = await prisma.projectMember.create({
      data: { projectId: req.params.projectId, userId: userToAdd.id, role },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
    });

    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update member role ───────────────────────────────────────────
router.patch('/:projectId/members/:userId', authenticate, requireProjectAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['ADMIN', 'MEMBER'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  try {
    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: req.params.projectId, userId: req.params.userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Remove member ────────────────────────────────────────────────
router.delete('/:projectId/members/:userId', authenticate, requireProjectAdmin, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (project.ownerId === req.params.userId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.projectId, userId: req.params.userId } }
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
