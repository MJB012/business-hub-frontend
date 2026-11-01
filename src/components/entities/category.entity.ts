import * as yup from "yup";

export class CategoryEntity {
  _id?: string;
  id?: number | string;
  name: string = "";
  description: string = "";
  products_count: number = 0;

  static yupSchema() {
    return yup.object().shape({
      name: yup
        .string()
        .trim()
        .required("Category name is required"),
      description: yup
        .string()
        .trim()
        .optional(),
      products_count: yup
        .number()
        .min(0)
        .optional(),
    });
  }
}
