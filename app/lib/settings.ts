export type Settings = {
  apiAccess: boolean;
  apiKey: string;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  maxPostsPerPage: number;
  allowComments: boolean;
  requireApproval: boolean;
  userHomeUrl: string;
  adminHomeUrl: string;
};

// デフォルト設定
const defaultSettings: Readonly<Settings> = {
  apiAccess: true,
  apiKey: '',
  emailNotifications: true,
  maintenanceMode: false,
  maxPostsPerPage: 10,
  allowComments: true,
  requireApproval: false,
  userHomeUrl: '/',
  adminHomeUrl: '/admin',
};


import { getDatabase } from './mongodb';
import type { Collection } from 'mongodb';



const SETTINGS_COLLECTION = 'settings';
const SETTINGS_ID = 'singleton' as const; // 固定IDで1ドキュメントのみ管理

type SettingsDoc = Settings & { _id: typeof SETTINGS_ID };

export async function getSettings(): Promise<Settings> {
  const db = await getDatabase();
  const collection: Collection<SettingsDoc> = db.collection(SETTINGS_COLLECTION);
  const doc = await collection.findOne({ _id: SETTINGS_ID });
  if (doc) {
    // _idを除外して返す
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...settings } = doc;
    return settings;
  } else {
    // なければデフォルトを保存して返す
    const insertDoc: SettingsDoc = { ...defaultSettings, _id: SETTINGS_ID };
    await collection.insertOne(insertDoc);
    return { ...defaultSettings };
  }
}

export async function updateSettings(newSettings: Partial<Settings>): Promise<Settings> {
  const db = await getDatabase();
  const collection: Collection<SettingsDoc> = db.collection(SETTINGS_COLLECTION);
  // 現在の設定取得
  const current = await getSettings();
  const updated: Settings = { ...current, ...newSettings };
  const updateDoc: Partial<SettingsDoc> = { ...updated };
  await collection.updateOne(
    { _id: SETTINGS_ID },
    { $set: updateDoc },
    { upsert: true }
  );
  return updated;
}

