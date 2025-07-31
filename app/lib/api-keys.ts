export interface ApiKeyPermissions {
  posts: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  comments: {
    read: boolean;
    moderate: boolean;
  };
  settings: {
    read: boolean;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: ApiKeyPermissions;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface ApiKeyInput {
  name: string;
  permissions: ApiKeyPermissions;
}

// デフォルト権限
export const defaultPermissions: ApiKeyPermissions = {
  posts: {
    create: true,
    read: true,
    update: false,
    delete: false,
  },
  comments: {
    read: true,
    moderate: false,
  },
  settings: {
    read: false,
  },
};

// 全権限
export const fullPermissions: ApiKeyPermissions = {
  posts: {
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  comments: {
    read: true,
    moderate: true,
  },
  settings: {
    read: true,
  },
};

// 読み取り専用権限
export const readOnlyPermissions: ApiKeyPermissions = {
  posts: {
    create: false,
    read: true,
    update: false,
    delete: false,
  },
  comments: {
    read: true,
    moderate: false,
  },
  settings: {
    read: true,
  },
};
