/**
 * Document API Routes
 * RESTful API for document management
 */

import { Router } from 'express';
import { documentService } from '../services/document-service.js';
import { asyncHandler } from '../services/error-handler.js';

const router = Router();

/**
 * GET /api/v1/documents - Get all documents for user
 */
router.get('/documents', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id || 'default-user';  // Get from auth middleware
  const documents = await documentService.getByUser(userId);
  res.json({ documents });
}));

/**
 * GET /api/v1/conversations/:conversationId/documents - Get documents for conversation
 */
router.get('/conversations/:conversationId/documents', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const documents = await documentService.getByConversation(conversationId);
  res.json({ documents });
}));

/**
 * GET /api/v1/documents/:id - Get single document
 */
router.get('/documents/:id', asyncHandler(async (req, res) => {
  const document = await documentService.get(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json({ document });
}));

/**
 * GET /api/v1/documents/:id/versions - Get document versions
 */
router.get('/documents/:id/versions', asyncHandler(async (req, res) => {
  const versions = await documentService.getVersions(req.params.id);
  res.json({ versions });
}));

/**
 * GET /api/v1/documents/:id/versions/:version - Get specific version
 */
router.get('/documents/:id/versions/:version', asyncHandler(async (req, res) => {
  const version = await documentService.getVersion(
    req.params.id,
    parseInt(req.params.version)
  );
  if (!version) {
    return res.status(404).json({ error: 'Version not found' });
  }
  res.json({ version });
}));

/**
 * PATCH /api/v1/documents/:id - Update document
 */
router.patch('/documents/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id || 'default-user';
  const { content, title, changeDescription } = req.body;

  const document = await documentService.update(req.params.id, {
    content,
    title,
    changeDescription: changeDescription || 'Updated by user',
    changedBy: userId
  });

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json({ document });
}));

/**
 * POST /api/v1/documents/:id/accept - Accept document
 */
router.post('/documents/:id/accept', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id || 'default-user';
  const document = await documentService.accept(req.params.id, userId);

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json({ document });
}));

/**
 * POST /api/v1/documents/:id/revert/:version - Revert to version
 */
router.post('/documents/:id/revert/:version', asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id || 'default-user';
  const document = await documentService.revertToVersion(
    req.params.id,
    parseInt(req.params.version),
    userId
  );

  if (!document) {
    return res.status(404).json({ error: 'Document or version not found' });
  }

  res.json({ document });
}));

/**
 * DELETE /api/v1/documents/:id - Delete document
 */
router.delete('/documents/:id', asyncHandler(async (req, res) => {
  const deleted = await documentService.delete(req.params.id);
  res.json({ deleted });
}));

export default router;
