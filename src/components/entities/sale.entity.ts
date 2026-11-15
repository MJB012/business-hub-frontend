import * as yup from "yup";

export interface SaleItemEntity {
  product_id?: string;
  product_name: string;
  quantity: number | '';
  unit_price: number | '';
  original_price?: number | '';
  discount?: number | '';
  total_amount?: number | '';
}

export class SaleEntity {
  _id?: string;
  id?: number | string;
  items?: SaleItemEntity[];
  product_id?: string;
  product_name: string = '';
  quantity: number | '' = 1;
  original_price?: number | '';
  unit_price: number | '' = '';
  discount?: number | '';
  total_amount?: number | '';
  payment_method: string = 'Cash';
  customer_name?: string = 'Walk-in Customer';
  customer_phone?: string = '';
  notes?: string = '';
  date?: string;
  receipt_no?: string;

  static yupSchema() {
    return yup.object().shape({
      items: yup
        .array()
        .of(
          yup.object().shape({
            product_name: yup
              .string()
              .trim()
              .required('Product name is required'),
            quantity: yup
              .number()
              .transform((value, originalValue) =>
                originalValue === '' || originalValue === null || originalValue === undefined
                  ? undefined
                  : value
              )
              .typeError('Quantity must be an integer')
              .integer('Quantity must be an integer')
              .min(1, 'Quantity must be at least 1')
              .required('Quantity is required'),
            unit_price: yup
              .number()
              .transform((value, originalValue) =>
                originalValue === '' || originalValue === null || originalValue === undefined
                  ? undefined
                  : value
              )
              .typeError('Unit price must be a valid number')
              .min(0, 'Unit price cannot be negative')
              .required('Unit price is required'),
            original_price: yup
              .number()
              .transform((value, originalValue) =>
                originalValue === '' || originalValue === null || originalValue === undefined
                  ? undefined
                  : value
              )
              .typeError('Original price must be a valid number')
              .min(0, 'Original price cannot be negative')
              .nullable()
              .optional(),
            discount: yup
              .number()
              .transform((value, originalValue) =>
                originalValue === '' || originalValue === null || originalValue === undefined
                  ? undefined
                  : value
              )
              .typeError('Discount must be a valid number')
              .min(0, 'Discount cannot be negative')
              .nullable()
              .optional(),
          })
        )
        .min(1, 'At least one product item is required')
        .optional(),
      product_name: yup.string().trim().optional(),
      quantity: yup.mixed().optional(),
      unit_price: yup.mixed().optional(),
      customer_name: yup.string().trim().optional(),
      customer_phone: yup.string().trim().optional(),
      notes: yup.string().trim().optional(),
      payment_method: yup
        .string()
        .trim()
        .required('Payment method is required'),
    });
  }
}
