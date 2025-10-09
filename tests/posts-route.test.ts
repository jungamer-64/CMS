import { describe, expect, it } from 'vitest';
import type { User } from '../app/lib/core/types';
import type { PostDocument } from '../app/lib/database/models/post';
import { buildFindAllOptions, mapPostsToFrontend } from '../app/lib/helpers/posts-helpers';


describe('posts route helpers', () => {
    it('buildFindAllOptions parses params and applies admin rules', () => {
        const params = new URLSearchParams();
        params.set('page', '2');
        params.set('limit', '10');
        params.set('search', '  hello  ');
        params.set('status', 'published');
        params.set('authorId', '  author-1  ');
        params.set('tags', 'a, b, ,c');
        params.set('categories', 'x,');
        params.set('includeDeleted', 'true');
        params.set('sortBy', 'updatedAt');
        params.set('sortOrder', 'asc');

        const adminUser: User = {
            id: 'u1',
            createdAt: new Date(),
            updatedAt: new Date(),
            username: 'admin',
            email: 'admin@example.com',
            passwordHash: 'hash',
            displayName: 'Admin',
            role: 'admin',
            darkMode: false,
        } as User;
        const optsAdmin = buildFindAllOptions(params, adminUser);
        expect(optsAdmin.page).toBe(2);
        expect(optsAdmin.limit).toBe(10);
        expect(optsAdmin.search).toBe('hello');
        expect(optsAdmin.status).toBe('published');
        expect(optsAdmin.authorId).toBe('author-1');
        expect(optsAdmin.tags).toEqual(['a', 'b', 'c']);
        expect(optsAdmin.categories).toEqual(['x']);
        expect(optsAdmin.includeDeleted).toBe(true);
        expect(optsAdmin.sortBy).toBe('updatedAt');
        expect(optsAdmin.sortOrder).toBe('asc');

        const normalUser: User = {
            id: 'u2',
            createdAt: new Date(),
            updatedAt: new Date(),
            username: 'user',
            email: 'user@example.com',
            passwordHash: 'hash',
            displayName: 'User',
            role: 'user',
            darkMode: false,
        } as User;
        const optsUser = buildFindAllOptions(params, normalUser);
        expect(optsUser.status).toBe('published');
        expect(optsUser.includeDeleted).toBe(false);
    });

    it('mapPostsToFrontend maps PostDocument to FrontendPost', () => {
        const post: PostDocument = {
            id: 'p1',
            title: 'T',
            content: 'C',
            slug: 's',
            status: 'published',
            authorId: 'a1',
            authorName: 'Author',
            tags: ['t1'],
            categories: ['c1'],
            isDeleted: false,
            createdAt: new Date('2020-01-01T00:00:00Z'),
            updatedAt: new Date('2020-01-02T00:00:00Z')
        } as PostDocument;

        const result = mapPostsToFrontend([post]);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('p1');
        expect(result[0].author).toBe('Author');
        expect(result[0].published).toBe(true);
        expect(result[0].tags).toEqual(['t1']);
    });
});
