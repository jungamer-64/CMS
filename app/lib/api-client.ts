// スタブファイル - api-client
export class ApiClientError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
  }
}

export const apiClient = {
  get: async () => { throw new Error('Not implemented'); },
  post: async () => { throw new Error('Not implemented'); },
  put: async () => { throw new Error('Not implemented'); },
  delete: async () => { throw new Error('Not implemented'); }
};
