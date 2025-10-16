// src/types/itemTypes.ts

export interface Item {
  itemID: number; 
  id: string;
  itemPicture: string | null;
  itemName: string;
  description: string;
  salesRate: number;
  discountPct: number;
  createdAt: Date;
  updatedAt: Date;
  updatedOn?: string;
}

export interface ItemFormData {
  itemPicture: File | string | null;
  itemName: string;
  description: string;
  saleRate: number;
  discountPct: number;
  updatedOnPrev?: string | null; 
   imageRemoved?: boolean; 
}

export interface ItemEditorProps {
  open: boolean;
  mode: 'new' | 'edit';
  itemData?: Item;
  onClose: () => void;
  onSave: (data: ItemFormData) => Promise<void>;
}

export interface ItemDataGridProps {
  items: Item[];
  visibleColumns: string[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  searchText?: string;
  companyCurrency?: string;
}