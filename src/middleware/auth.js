const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, avatar: true }
    });

    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Check if user is ADMIN in a project
const requireProjectAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } }
    });

    // Owner always has admin rights
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.ownerId !== userId && (!membership || membership.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.project = project;
    req.membership = membership;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// Check if user is a member (or admin/owner) of the project
const requireProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.ownerId === userId) {
      req.project = project;
      req.userRole = 'ADMIN';
      return next();
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } }
    });

    if (!membership) return res.status(403).json({ error: 'Not a project member' });

    req.project = project;
    req.membership = membership;
    req.userRole = membership.role;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { authenticate, requireProjectAdmin, requireProjectMember };
