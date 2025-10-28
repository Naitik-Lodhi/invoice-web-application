// src/services/itemService.ts - Complete update
import axiosInstance from '../api/axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export interface ItemFormData {
  itemName: string;
  description?: string;
  saleRate: number;
  discountPct?: number;
  updatedOn?: string | null;
}

export interface Item {
  itemID: number;
  itemName: string;
  description?: string;
  salesRate: number;
  discountPct: number;
  pictureUrl?: string;
  thumbnailUrl?: string;
  updatedOn?: string;
}

export const itemService = {
  getList: async (): Promise<Item[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.items.GET_LIST);
    return response.data;
  },

  getById: async (itemId: number): Promise<Item> => {
    const response = await axiosInstance.get(API_ENDPOINTS.items.GET_BY_ID(itemId));
    return response.data;
  },

  getLookupList: async (): Promise<Array<{
  itemID: number; 
  itemName: string; 
  salesRate: number;     
  discountPct: number;   
}>> => {
  const response = await axiosInstance.get(API_ENDPOINTS.items.GET_LOOKUP_LIST);
  
  // ✅ Detailed logging to check exact field names
  console.log("🔍 Item lookup RAW response:", response.data);
  if (response.data && response.data.length > 0) {
    console.log("📋 First item structure:", response.data[0]);
    console.log("🔑 Available keys:", Object.keys(response.data[0]));
  }
  
  return response.data;
},

create: async (data: ItemFormData): Promise<Item> => {
  const payload = {
    itemID: 0,
    itemName: data.itemName.trim(),
    description: data.description?.trim() || '',
    salesRate: data.saleRate,
    discountPct: data.discountPct || 0,
  };
  
  const response = await axiosInstance.post(
    API_ENDPOINTS.items.CREATE, 
    payload
  );
  
  // ✅ FIXED: Backend returns primaryKeyID
  return {
    itemID: response.data.primaryKeyID, // ✅ Use this
    itemName: payload.itemName,
    description: payload.description,
    salesRate: payload.salesRate,
    discountPct: payload.discountPct,
    updatedOn: response.data.updatedOn,
  } as Item;
},

  update: async (itemId: number, data: ItemFormData): Promise<Item> => {
    const payload = {
      itemID: itemId,
      itemName: data.itemName.trim(),
      description: data.description?.trim() || '',
      salesRate: data.saleRate,
      discountPct: data.discountPct || 0,
      updatedOn: data.updatedOn || null,
    };
    const response = await axiosInstance.put(API_ENDPOINTS.items.UPDATE, payload);
    return response.data;
  },

  delete: async (itemId: number): Promise<{success: boolean}> => {
    const response = await axiosInstance.delete(API_ENDPOINTS.items.DELETE(itemId));
    return response.data;
  },

  getPicture: async (itemId: number): Promise<string> => {
    const response = await axiosInstance.get(API_ENDPOINTS.items.GET_PICTURE(itemId));
    return response.data;
  },

  getPictureThumbnail: async (itemId: number): Promise<string> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.items.GET_PICTURE_THUMBNAIL(itemId)
    );
    return response.data;
  },

  checkDuplicateName: async (
    itemName: string, 
    excludeId?: number
  ): Promise<boolean> => {
    const params: any = { ItemName: itemName };
    if (excludeId) {
      params.ExcludeID = excludeId;
    }
    
    const response = await axiosInstance.get(
      API_ENDPOINTS.items.CHECK_DUPLICATE_NAME,
      { params }
    );
    return response.data;
  },
};