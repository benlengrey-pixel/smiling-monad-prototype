export type Tile = {
  id: string;
  type: string;
  title: string;

  summary?: string;
  filePath?: string;

  status: "draft" | "ready" | "active" | "archived";

  visible: boolean;

  createdAt: string;
  updatedAt: string;

  priority: number;
};