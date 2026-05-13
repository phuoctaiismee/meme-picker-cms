export interface MemeTag {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  usage_count?: number;
}

export interface ManagedTag extends MemeTag {
  usage_count: number;
}

export interface TagManagementData {
  tags: ManagedTag[];
}
