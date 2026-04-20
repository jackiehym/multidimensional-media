const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 媒体文件相关
  async getMediaItems(): Promise<any[]> {
    return this.request<any[]>('/api/media');
  }

  async getMediaItem(id: number): Promise<any> {
    return this.request<any>(`/api/media/${id}`);
  }

  async createMediaItem(media: any): Promise<any> {
    return this.request<any>('/api/media', {
      method: 'POST',
      body: JSON.stringify(media),
    });
  }

  async bulkCreateMediaItems(items: any[]): Promise<any> {
    return this.request<any>('/api/media/bulk', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  async updateMediaItem(id: number, changes: any): Promise<any> {
    return this.request<any>(`/api/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
  }

  async deleteMediaItem(id: number): Promise<any> {
    return this.request<any>(`/api/media/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkDeleteMediaItems(ids: number[]): Promise<any> {
    return this.request<any>('/api/media/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async addTagToItems(mediaIds: number[], tagName: string, category?: string): Promise<any> {
    return this.request<any>('/api/media/add-tag', {
      method: 'POST',
      body: JSON.stringify({ media_ids: mediaIds, tag_name: tagName, category }),
    });
  }

  async removeTagFromItems(mediaIds: number[], tagName: string): Promise<any> {
    return this.request<any>('/api/media/remove-tag', {
      method: 'POST',
      body: JSON.stringify({ media_ids: mediaIds, tag_name: tagName }),
    });
  }

  async openFile(path: string): Promise<any> {
    return this.request<any>('/api/media/open-file', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  async openLocation(path: string): Promise<any> {
    return this.request<any>('/api/media/open-location', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  // 标签相关
  async getTags(): Promise<any[]> {
    return this.request<any[]>('/api/tags');
  }

  async createTag(tag: any): Promise<any> {
    return this.request<any>('/api/tags', {
      method: 'POST',
      body: JSON.stringify(tag),
    });
  }

  async updateTag(id: number, changes: any): Promise<any> {
    return this.request<any>(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
  }

  async deleteTag(id: number): Promise<any> {
    return this.request<any>(`/api/tags/${id}`, {
      method: 'DELETE',
    });
  }

  async renameTag(oldName: string, newName: string): Promise<any> {
    return this.request<any>('/api/tags/rename', {
      method: 'POST',
      body: JSON.stringify({ old_name: oldName, new_name: newName }),
    });
  }

  async mergeTags(sourceNames: string[], targetName: string): Promise<any> {
    return this.request<any>('/api/tags/merge', {
      method: 'POST',
      body: JSON.stringify({ source_names: sourceNames, target_name: targetName }),
    });
  }

  async bulkDeleteTags(names: string[]): Promise<any> {
    return this.request<any>('/api/tags/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ names }),
    });
  }

  async changeTagCategory(tagName: string, newCategory: string): Promise<any> {
    return this.request<any>('/api/tags/change-category', {
      method: 'POST',
      body: JSON.stringify({ tag_name: tagName, new_category: newCategory }),
    });
  }

  // 标签分类相关
  async getCategories(): Promise<any[]> {
    return this.request<any[]>('/api/categories');
  }

  async createCategory(category: any): Promise<any> {
    return this.request<any>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: number, changes: any): Promise<any> {
    return this.request<any>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
  }

  async deleteCategory(id: number): Promise<any> {
    return this.request<any>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async seedDefaultData(): Promise<any> {
    return this.request<any>('/api/categories/seed', {
      method: 'POST',
    });
  }

  // 文件上传
  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${this.baseUrl}/api/media/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // 删除文件
  async deleteFile(filename: string): Promise<any> {
    return this.request<any>('/api/media/delete-file', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    });
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const api = new ApiService();
