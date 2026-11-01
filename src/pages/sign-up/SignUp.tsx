import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { Store, Mail, Lock, User, Briefcase } from 'lucide-react';
import BaseInput from '../../components/base-input/BaseInput';
import { UserEntity } from '../../components/entities/user.entity';
import { authService } from '../../services/auth.service';
import { RouteNames } from '../../routes/RouteNames';

const BUSINESS_TYPE_OPTIONS = [
  { value: 'Retail & POS', label: 'Retail & POS' },
  { value: 'Wholesale & Distribution', label: 'Wholesale & Distribution' },
  { value: 'E-Commerce & Digital', label: 'E-Commerce & Digital' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Services & Consulting', label: 'Services & Consulting' },
  { value: 'Restaurant & Hospitality', label: 'Restaurant & Hospitality' },
  { value: 'Other', label: 'Other' },
];

const SignUp = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      full_name: '',
      email: '',
      password: '',
      business_name: '',
      business_type: 'Retail & POS',
    },
    validationSchema: UserEntity.yupSignUpSchema(),
    onSubmit: async (values, { setSubmitting }) => {
      setErrorMessage(null);
      try {
        await authService.signup(values);
        navigate(RouteNames.LOGIN);
      } catch (error: any) {
        setErrorMessage(error.message || 'Registration failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#edf2fb] p-4 sm:p-6 py-10">
      <div className="max-w-[460px] w-full mx-auto space-y-6 bg-white p-7 sm:p-9 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
        {/* Store Logo Icon and Header */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-[#0a0d14] rounded-full flex items-center justify-center text-white shadow-xs">
            <Store className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900 tracking-tight">
            Business Management Hub
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Sign in to your account or register your business
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium text-center">
            {errorMessage}
          </div>
        )}

        {/* Segmented Toggle Buttons: Sign In / Register Business */}
        <div className="bg-[#eef2f6] rounded-2xl p-1 flex items-center">
          <button
            type="button"
            onClick={() => navigate(RouteNames.LOGIN)}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 text-center transition cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 px-4 rounded-xl bg-white shadow-xs text-sm font-semibold text-gray-900 text-center transition cursor-pointer"
          >
            Register Business
          </button>
        </div>

        {/* Register Form */}
        <form className="space-y-4 pt-1" onSubmit={formik.handleSubmit}>
          <div>
            <BaseInput
              name="full_name"
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={formik.values.full_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.full_name && formik.errors.full_name}
              touched={formik.touched.full_name}
              required
              icon={<User className="h-4 w-4" />}
              className="!bg-[#f0f3f8] !border-transparent focus:!border-black focus:!bg-white"
            />
          </div>

          <div>
            <BaseInput
              name="business_name"
              label="Business Name"
              type="text"
              placeholder="Enter your business name"
              value={formik.values.business_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.business_name && formik.errors.business_name}
              touched={formik.touched.business_name}
              required
              icon={<Store className="h-4 w-4" />}
              className="!bg-[#f0f3f8] !border-transparent focus:!border-black focus:!bg-white"
            />
          </div>

          <div>
            <BaseInput
              name="business_type"
              label="Business Type"
              type="select"
              value={formik.values.business_type}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.business_type && formik.errors.business_type}
              touched={formik.touched.business_type}
              required
              options={BUSINESS_TYPE_OPTIONS}
              icon={<Briefcase className="h-4 w-4" />}
              className="!bg-[#f0f3f8] !border-transparent focus:!border-black focus:!bg-white"
            />
          </div>

          <div>
            <BaseInput
              name="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && formik.errors.email}
              touched={formik.touched.email}
              required
              icon={<Mail className="h-4 w-4" />}
              className="!bg-[#f0f3f8] !border-transparent focus:!border-black focus:!bg-white"
            />
          </div>

          <div>
            <BaseInput
              name="password"
              label="Password"
              type="password"
              placeholder="Create a password (min. 6 characters)"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && formik.errors.password}
              touched={formik.touched.password}
              required
              icon={<Lock className="h-4 w-4" />}
              className="!bg-[#f0f3f8] !border-transparent focus:!border-black focus:!bg-white"
            />
          </div>

          {/* Register Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-3.5 px-4 bg-[#0a0d14] hover:bg-gray-800 disabled:opacity-60 text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-xs"
            >
              {formik.isSubmitting ? 'Registering...' : 'Register Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
