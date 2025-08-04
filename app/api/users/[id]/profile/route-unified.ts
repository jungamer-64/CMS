import { NextRequest } from 'next/server';
import { createGetHandler, createPutHandler } from '@/app/lib/api-factory';
import type { UserEntity } from '@/app/lib/core/types';
import { UserRepository } from '@/app/lib/data/repositories/user-repository';

// GET /api/users/[id]/profile - Get user profile
export const GET = createRestGetHandler<UserEntity>(
  async (request: NextRequest, currentUser?: UserEntity) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/')[3]; // Extract user ID from path

    if (!id) {
      throw new Error('User ID is required');
    }

    // Check if user can access this profile
    if (!currentUser || (currentUser.id !== id && currentUser.role !== 'admin')) {
      throw new Error('Access denied');
    }

    const result = await getUserById(id);
    if (!result.success || !result.data) {
      throw new Error('User not found');
    }

    return result.data;
  },
  {
    requireAuth: true
  }
);

// PUT /api/users/[id]/profile - Update user profile
export const PUT = createRestPutHandler<{ displayName?: string; email?: string }, UserEntity>(
  async (request: NextRequest, body: { displayName?: string; email?: string }, currentUser?: UserEntity) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/')[3]; // Extract user ID from path

    if (!id) {
      throw new Error('User ID is required');
    }

    // Check if user can update this profile
    if (!currentUser || (currentUser.id !== id && currentUser.role !== 'admin')) {
      throw new Error('Access denied');
    }

    const updateData: Partial<UserEntity> = {};
    if (body.displayName) updateData.displayName = body.displayName;
    if (body.email) updateData.email = body.email;

    const result = await updateUser(id, updateData);
    if (!result.success || !result.data) {
      throw new Error('Failed to update user');
    }

    return result.data;
  },
  {
    displayName: { type: 'string', required: false, minLength: 1, maxLength: 100 },
    email: { type: 'string', required: false, format: 'email' }
  },
  {
    requireAuth: true
  }
);
