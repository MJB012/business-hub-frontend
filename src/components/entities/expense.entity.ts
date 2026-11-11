import * as yup from 'yup';

export class ExpenseEntity {
  _id?: string;
  id?: number | string;
  description: string = '';
  amount: number | '' = '';
  date: string = '';
  category: string = '';
  payment_method: string = 'Cash';
  vendor?: string = '';
  receipt_no?: string = '';
  notes?: string = '';
  business_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;

  static yupSchema() {
    return yup.object().shape({
      description: yup
        .string()
        .trim()
        .required('Description is required'),
      amount: yup
        .number()
        .transform((value, originalValue) =>
          originalValue === '' || originalValue === null || originalValue === undefined
            ? undefined
            : value
        )
        .typeError('Amount must be a valid number')
        .positive('Amount must be greater than zero')
        .required('Amount is required'),
      date: yup
        .string()
        .trim()
        .required('Date is required'),
      category: yup
        .string()
        .trim()
        .required('Category is required'),
      payment_method: yup
        .string()
        .trim()
        .optional(),
      vendor: yup
        .string()
        .trim()
        .optional(),
      receipt_no: yup
        .string()
        .trim()
        .optional(),
      notes: yup
        .string()
        .trim()
        .optional(),
    });
  }
}
