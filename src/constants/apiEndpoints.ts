// src/constants/apiEndpoints.ts
export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    SIGNUP: '/Auth/Signup',
    LOGIN: '/Auth/Login',
    GET_COMPANY_LOGO: (companyId: number) => `/Auth/GetCompanyLogoUrl/${companyId}`,
    GET_COMPANY_LOGO_THUMBNAIL: (companyId: number) => `/Auth/GetCompanyLogoThumbnailUrl/${companyId}`,
    CHECK_DUPLICATE_EMAIL: '/Auth/CheckDuplicateEmail', // ✅ NEW
  },

  // Item endpoints
  items: {
    GET_LIST: '/Item/GetList',
    GET_LOOKUP_LIST: '/Item/GetLookupList',
    GET_BY_ID: (id: number) => `/Item/${id}`,
    CREATE: '/Item', // POST
    UPDATE: '/Item', // PUT
    DELETE: (id: number) => `/Item/${id}`, // DELETE
    GET_PICTURE: (id: number) => `/Item/Picture/${id}`,
    GET_PICTURE_THUMBNAIL: (id: number) => `/Item/PictureThumbnail/${id}`,
     UPDATE_PICTURE: '/Item/UpdateItemPicture', 
    CHECK_DUPLICATE_NAME: '/Item/CheckDuplicateItemName',
  },

  // Invoice endpoints
  invoices: {
    GET_LIST: '/Invoice/GetList',
    GET_BY_ID: (id: number) => `/Invoice/${id}`,
    CREATE: '/Invoice/', // POST
    UPDATE: '/Invoice', // PUT
    DELETE: (id:any) => `/Invoice/${id}`, // DELETE
    GET_METRICS: '/Invoice/GetMetrices', // Note: API has typo "Metrices"
    GET_TREND_12M: '/Invoice/GetTrend12m',
    GET_TOP_ITEMS: '/Invoice/TopItems',
  },
};