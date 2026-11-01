import * as yup from "yup";

export class SupplierEntity {
  _id?: string;
  id?: number | string;
  name: string = "";
  contact_person: string = "";
  email: string = "";
  phone: string = "";
  address: string = "";
  notes: string = "";
  products_count: number = 0;
  status: "active" | "inactive" = "active";

  static yupSchema() {
    return yup.object().shape({
      name: yup
        .string()
        .trim()
        .required("Supplier name is required"),
      contact_person: yup
        .string()
        .trim()
        .optional(),
      email: yup
        .string()
        .trim()
        .email("Invalid email format")
        .optional(),
      phone: yup
        .string()
        .trim()
        .optional(),
      address: yup
        .string()
        .trim()
        .optional(),
      notes: yup
        .string()
        .trim()
        .optional(),
      status: yup
        .string()
        .oneOf(["active", "inactive"])
        .default("active"),
    });
  }
}
