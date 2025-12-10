import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Order } from '../../types';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

  let products = [];
  try {
    products = JSON.parse(order.products);
  } catch (e) {
    products = [];
  }

  const adress = JSON.parse(order.adress)

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">
                  Order #{order.id}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Customer Email</p>
                    <p className="text-slate-900">{order.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Order Date</p>
                    <p className="text-slate-900">{order.date}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' || order.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ${order.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Delivery Address</p>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{[adress.city, adress.country, adress.line1, adress.line2, adress.postal_code, adress.state].join(", ")}</p>
                </div>

                {order.token && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Payment Token</p>
                    <p className="text-slate-900 bg-slate-50 p-3 rounded-lg font-mono text-sm break-all">
                      {order.token}
                    </p>
                  </div>
                )}

                {order.metaid && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Meta ID</p>
                    <p className="text-slate-900 bg-slate-50 p-3 rounded-lg font-mono text-sm break-all">
                      {order.metaid}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Products</p>
                  <div className="bg-slate-50 rounded-lg p-4">
                    {Array.isArray(products) && products.length > 0 ? (
                      <div className="space-y-2">
                        {products.map((product: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0"
                          >
                            <div>
                              <p className="font-medium text-slate-900">
                                {product.title || product.name || `Product ${index + 1}`}
                              </p>
                              {product.quantity && (
                                <p className="text-sm text-slate-600">
                                  Quantity: {product.quantity}
                                </p>
                              )}
                            </div>
                            {product.price && (
                              <p className="font-semibold text-slate-900">
                                ${product.price.toFixed(2)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-center py-4">
                        No product details available
                      </p>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
