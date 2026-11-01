import * as yup from "yup";

export class ShopSettingsEntity {
  _id?: string;
  shop_name: string = "";
  shop_logo: string | null = null;
  business_type: string = "Retail & POS";
  contact_email: string = "";
  contact_phone: string = "";
  currency: string = "USD ($)";
  address: string = "";
  low_stock_threshold: number = 10;

  static yupSchema() {
    return yup.object().shape({
      shop_name: yup
        .string()
        .trim()
        .required("Shop name is required"),
      business_type: yup
        .string()
        .trim()
        .required("Business type is required"),
      contact_email: yup
        .string()
        .trim()
        .email("Invalid email address")
        .optional(),
      contact_phone: yup
        .string()
        .trim()
        .optional(),
      currency: yup
        .string()
        .trim()
        .required("Currency is required"),
      address: yup
        .string()
        .trim()
        .optional(),
      low_stock_threshold: yup
        .number()
        .min(0, "Threshold cannot be negative")
        .required("Low stock threshold is required"),
    });
  }
}
