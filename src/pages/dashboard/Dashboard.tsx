import { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Box,
} from "lucide-react";

import { StatCard } from "../../components/stat-card/StatCard";
import { BaseCard } from "../../components/base-card/BaseCard";
import { saleService } from "../../services/sale.service";
import { productService } from "../../services/product.service";
import { SaleEntity } from "../../components/entities/sale.entity";
import { ProductEntity } from "../../components/entities/product.entity";
import { useCurrency } from "../../services/currency.service";
import SuperAdminDashboard from "../super-admin/SuperAdminDashboard";
import { UserRoleEnum } from "../../enums/UserRoleEnum";

export default function Dashboard() {
  // If Super Admin, render the platform Super Admin Dashboard directly
  const isSuperAdmin = useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.role === UserRoleEnum.SUPER_ADMIN || u.role === 'super_admin';
      }
    } catch {
      // fallback
    }
    return false;
  }, []);

  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  const currencySymbol = useCurrency();
  const [sales, setSales] = useState<SaleEntity[]>([]);
  const [products, setProducts] = useState<ProductEntity[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const salesData = await saleService.getSales();
        if (Array.isArray(salesData)) {
          setSales(salesData);
        }
      } catch (err) {
        console.warn('Backend sales fetch failed:', err);
      }

      try {
        const prodsData = await productService.getProducts();
        if (Array.isArray(prodsData)) {
          setProducts(prodsData);
        }
      } catch (err) {
        console.warn('Backend products fetch failed:', err);
      }
    };

    loadDashboardData();
  }, []);

  const getUserInfo = () => {
    try {
      const storedShop = localStorage.getItem('shop_settings');
      const shopParsed = storedShop ? JSON.parse(storedShop) : null;
      const stored = localStorage.getItem('user');
      if (stored || shopParsed) {
        const parsed = stored ? JSON.parse(stored) : {};
        return {
          name: parsed.full_name || parsed.name || 'User',
          businessName:
            shopParsed?.shop_name ||
            shopParsed?.shopName ||
            parsed.business_name ||
            parsed.businessName ||
            'Business Hub',
        };
      }
    } catch {
      // fallback
    }
    return {
      name: 'User',
      businessName: 'Business Hub',
    };
  };

  const user = getUserInfo();

  // Calculated Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.date && s.date.startsWith(todayStr));
  const todayTotal = todaySales.reduce(
    (sum, s) => sum + Number(s.quantity || 1) * Number(s.unit_price || 0),
    0
  );
  const totalSales = sales.reduce(
    (sum, s) => sum + Number(s.quantity || 1) * Number(s.unit_price || 0),
    0
  );

  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.quantity || 0) * Number(p.price || 0),
    0
  );

  const lowStockProducts = products.filter(
    (p) => Number(p.quantity || 0) <= Number(p.low_stock_threshold || 10)
  );

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Welcome back, {user.name}!
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Here&apos;s an overview of {user.businessName}
        </p>
      </div>

      {/* Top Stat Cards - 1 col on mobile, 2 cols on tablet, 4 cols on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Sales"
          value={`${currencySymbol}${totalSales.toFixed(2)}`}
          subtitle={`${currencySymbol}${todayTotal.toFixed(2)} today`}
          icon={<DollarSign />}
        />
        <StatCard
          title="Total Orders"
          value={sales.length}
          subtitle={`${todaySales.length} orders today`}
          icon={<TrendingUp />}
        />
        <StatCard
          title="Active Products"
          value={products.length}
          subtitle={`${lowStockProducts.length} low stock`}
          icon={<Box />}
        />
        <StatCard
          title="Inventory Value"
          value={`${currencySymbol}${inventoryValue.toFixed(2)}`}
          subtitle={`${products.reduce((acc, p) => acc + Number(p.quantity || 0), 0)} items in stock`}
          icon={<Box />}
        />
      </div>

      {/* Bottom Cards - 1 col on mobile/tablet, 2 cols on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Sales */}
        <BaseCard title="Recent Sales" subtitle="Latest transactions">
          <div className="space-y-4">
            {sales.slice(0, 3).map((sale, idx) => (
              <div
                key={sale._id || sale.id || idx}
                className="flex justify-between items-start sm:items-center"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">
                    {sale.product_name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {sale.date ? sale.date.split('T')[0] : 'Today'} · {sale.payment_method || 'Cash'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">
                    {currencySymbol}{(Number(sale.quantity || 1) * Number(sale.unit_price || 0)).toFixed(2)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Qty: {sale.quantity || 1}
                  </p>
                </div>
              </div>
            ))}
            {sales.length === 0 && (
              <p className="text-sm text-gray-500 py-2">No transactions recorded yet.</p>
            )}
          </div>
        </BaseCard>

        {/* Inventory Alerts */}
        <BaseCard
          title="Inventory Alerts"
          subtitle="Items that need attention"
        >
          <div className="space-y-4">
            {lowStockProducts.slice(0, 3).map((prod, idx) => (
              <div
                key={prod._id || prod.id || idx}
                className="flex justify-between items-center gap-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    {prod.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {prod.sku ? `SKU: ${prod.sku} · ` : ''}Threshold: {prod.low_stock_threshold || 10}
                  </p>
                </div>
                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs sm:text-sm shrink-0 font-medium">
                  {prod.quantity || 0} left
                </span>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <p className="text-sm text-gray-500 py-2">All stock levels are optimal.</p>
            )}
          </div>
        </BaseCard>
      </div>
    </div>
  );
}
