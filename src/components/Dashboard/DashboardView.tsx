import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart, Package, Clock } from 'lucide-react';
import StatsCard from './StatsCard';
import RevenueChart from './RevenueChart';
import OrdersChart from './OrdersChart';
import { analyticsApi, ordersApi, productsApi } from '../../lib/api';
import { motion } from 'framer-motion';

export default function DashboardView() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then((res) => res.data),
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll().then((res) => res.data),
  });

  const totalRevenue = orders?.reduce((sum, order) => sum + order.price, 0) || 0;
  const pendingOrders = orders?.filter((o) => o.status === 'paid').length || 0;

  // const revenueData = [
  //   { name: 'Jan', revenue: 4000, orders: 24 },
  //   { name: 'Feb', revenue: 3000, orders: 18 },
  //   { name: 'Mar', revenue: 5000, orders: 32 },
  //   { name: 'Apr', revenue: 4500, orders: 28 },
  //   { name: 'May', revenue: 6000, orders: 38 },
  //   { name: 'Jun', revenue: 5500, orders: 35 },
  // ];

  const {data: revenueData} = useQuery({
    queryKey: ["analystics"],
    queryFn: () => analyticsApi.getRevenueData().then((resp) => resp.data)
  })

  
  const {data: ordersData} = useQuery({
    queryKey: ["analystics"],
    queryFn: () => analyticsApi.getOrdersData().then((resp) => resp.data)
  })

  // const ordersData = [
  //   { name: 'Mon', orders: 12, completed: 10 },
  //   { name: 'Tue', orders: 15, completed: 13 },
  //   { name: 'Wed', orders: 18, completed: 16 },
  //   { name: 'Thu', orders: 14, completed: 12 },
  //   { name: 'Fri', orders: 20, completed: 18 },
  //   { name: 'Sat', orders: 25, completed: 22 },
  //   { name: 'Sun', orders: 22, completed: 20 },
  // ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-600 mt-2">Welcome back to your PCExpert admin panel</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.1}
        />
        <StatsCard
          title="Total Orders"
          value={orders?.length || 0}
          icon={ShoppingCart}
          color="bg-gradient-to-br from-cyan-500 to-cyan-600"
          delay={0.2}
        />
        <StatsCard
          title="Total Products"
          value={products?.length || 0}
          icon={Package}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay={0.3}
        />
        <StatsCard
          title="Pending Orders"
          value={pendingOrders}
          icon={Clock}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <OrdersChart data={ordersData} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-slate-200"
      >
        <h3 className="text-xl font-bold text-slate-900 mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Total
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                  Date
                </th>
              </tr>
            </thead>
  <tbody>
              {orders?.sort((a, b) => b.id - a.id).slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-900">#{order.id}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{order.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900">
                    ${order.price}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
