import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { Store, Mail, Lock } from 'lucide-react';
import BaseInput from '../../components/base-input/BaseInput';
import { UserEntity } from '../../components/entities/user.entity';
import { authService } from '../../services/auth.service';
import { RouteNames } from '../../routes/RouteNames';
import { UserRoleEnum } from '../../enums/UserRoleEnum';

const Login = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: UserEntity.yupLoginSchema(),
    onSubmit: async (values, { setSubmitting }) => {
      setErrorMessage(null);
      try {
        const res = await authService.login(values.email.trim(), values.password);
        if (res.user?.role === UserRoleEnum.SUPER_ADMIN || res.user?.role === 'super_admin') {
          navigate(RouteNames.SUPER_ADMIN);
        } else {
          navigate(RouteNames.DASHBOARD);
        }
      } catch (error: any) {
        setErrorMessage(error.message || 'Invalid email or password');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#edf2fb] p-4 sm:p-6 py-10">
      <div className="max-w-[420px] w-full mx-auto space-y-6 bg-white p-7 sm:p-9 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
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
            className="flex-1 py-2.5 px-4 rounded-xl bg-white shadow-xs text-sm font-semibold text-gray-900 text-center transition cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate(RouteNames.SIGN_UP)}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 text-center transition cursor-pointer"
          >
            Register Business
          </button>
        </div>

        {/* Login Form */}
        <form className="space-y-4 pt-1" onSubmit={formik.handleSubmit}>
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
              label={
                <span className="flex items-center justify-between w-full">
                  <span>Password</span>
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(RouteNames.FORGOT_PASSWORD);
                    }}
                    className="text-xs font-normal text-gray-500 hover:text-black transition cursor-pointer"
                  >
                    Forgot password?
                  </span>
                </span>
              }
              type="password"
              placeholder="Enter your password"
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

          {/* Sign In Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-3.5 px-4 bg-[#0a0d14] hover:bg-gray-800 disabled:opacity-60 text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-xs"
            >
              {formik.isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
