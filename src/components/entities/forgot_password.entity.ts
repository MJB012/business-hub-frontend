import * as yup from "yup";

export class ForgotPasswordEntity {
  email: string = "";
  code: string = "";
  new_password: string = "";
  confirm_password: string = "";

  static emailSchema() {
    return yup.object().shape({
      email: yup
        .string()
        .trim()
        .email("Invalid email format")
        .required("Email is required"),
    });
  }

  static codeSchema() {
    return yup.object().shape({
      code: yup
        .string()
        .trim()
        .min(4, "Verification code must be at least 4 digits")
        .max(8, "Verification code must be at most 8 digits")
        .required("Verification code is required"),
    });
  }

  static resetPasswordSchema() {
    return yup.object().shape({
      new_password: yup
        .string()
        .min(6, "Password must be at least 6 characters")
        .required("New password is required"),
      confirm_password: yup
        .string()
        .oneOf([yup.ref("new_password")], "Passwords must match")
        .required("Please confirm your new password"),
    });
  }
}
