import { apiRequest } from './api.config';
import { ShopSettingsEntity } from '../components/entities/shop_settings.entity';

export const businessService = {
  async getCurrentBusiness(): Promise<any> {
    return apiRequest('/businesses/current', {
      method: 'GET',
    });
  },

  async updateCurrentBusiness(data: Partial<ShopSettingsEntity>): Promise<any> {
    const payload: any = {};
    if (data.shop_name !== undefined) payload.name = data.shop_name;
    if (data.business_type !== undefined) payload.type = data.business_type;
    if (data.shop_logo !== undefined) payload.logo = data.shop_logo;
    if (data.contact_email !== undefined) payload.contact_email = data.contact_email;
    if (data.contact_phone !== undefined) payload.contact_phone = data.contact_phone;
    if (data.currency !== undefined) payload.currency = data.currency;
    if (data.address !== undefined) payload.address = data.address;
    if (data.low_stock_threshold !== undefined) payload.low_stock_threshold = data.low_stock_threshold;

    return apiRequest('/businesses/current', {
      method: 'PATCH',
      data: payload,
    });
  },
};
