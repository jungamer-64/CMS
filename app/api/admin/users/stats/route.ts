import { NextRequest } from 'next/server';
import { getAllUsersWithFilters } from '@/app/lib/users';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/app/lib/api-utils';

export const GET = withAuth(async (request: NextRequest, user) => {
  console.log('アカウント統計API呼び出し - ユーザー:', user.username);
  
  try {
    // 全ユーザーを取得
    const allUsers = await getAllUsersWithFilters();
    
    // 統計を計算
    const stats = {
      totalUsers: allUsers.length,
      adminUsers: allUsers.filter(u => u.role === 'admin').length,
      regularUsers: allUsers.filter(u => u.role === 'user').length,
      activeUsers: allUsers.filter(u => u.isActive).length,
      usersWithDarkMode: allUsers.filter(u => u.darkMode).length,
      recentUsers: allUsers.filter(u => {
        const createdAt = new Date(u.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length,
      usersByMonth: allUsers.reduce((acc, u) => {
        const month = new Date(u.createdAt).toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    console.log('アカウント統計:', stats);
    return createSuccessResponse(stats);
  } catch (error) {
    console.error('アカウント統計取得エラー:', error);
    return createErrorResponse('アカウント統計の取得に失敗しました', 500);
  }
});
