import * as yup from "yup";

export class ProductEntity {
  _id?: string;
  id?: number | string;
  product_type: string = 'single';
  name: string = '';
  sku: string = '';
  category: string = '';
  price: number | '' = '';
  quantity: number | '' = '';
  supplier: string = '';
  description: string = '';
  low_stock_threshold?: number | '' = '';

  static yupSchema() {
    return yup.object().shape({
      product_type: yup.string().required('Product type is required'),
      name: yup.string().trim().required('Product name is required'),
      sku: yup.string().trim().required('SKU is required'),
      category: yup.string().trim().required('Category is required'),
      price: yup
        .number()
        .transform((value, originalValue) =>
          originalValue === '' || originalValue === null || originalValue === undefined
            ? undefined
            : value
        )
        .typeError('Price must be a valid number')
        .min(0, 'Price cannot be negative')
        .required('Price is required'),
      quantity: yup
        .number()
        .transform((value, originalValue) =>
          originalValue === '' || originalValue === null || originalValue === undefined
            ? undefined
            : value
        )
        .typeError('Quantity must be an integer')
        .integer('Quantity must be an integer')
        .min(0, 'Quantity cannot be negative')
        .required('Quantity is required'),
      supplier: yup.string().optional(),
      description: yup.string().optional(),
      low_stock_threshold: yup
        .number()
        .transform((value, originalValue) =>
          originalValue === '' || originalValue === null || originalValue === undefined
            ? undefined
            : value
        )
        .typeError('Threshold must be a valid number')
        .min(0, 'Threshold cannot be negative')
        .nullable()
        .optional(),
    });
  }
}
