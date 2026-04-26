import React, { useState, useEffect, useCallback } from 'react';
import { getOrdersByDistributor } from '../api/Data';
import { useAuth } from '../context/AuthContext';
import { Package, Receipt } from 'lucide-react';

const DistributorOrderHistory = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(() => {
        getOrdersByDistributor(user.id, 'confirmed').then(data => {
            setOrders(data);
            setLoading(false);
        });
    }, [user.id]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const generateBill = (order) => {
        const billWindow = window.open('', '_blank');
        const invoiceNo  = `INV-${String(order.id).padStart(5, '0')}`;
        const orderDate  = new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const orderTime  = new Date(order.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const itemRows = order.items.map((item, i) => `
            <tr>
                <td class="center">${i + 1}</td>
                <td>${item.product.name}<br><span class="muted">${item.label || item.quantityType}</span></td>
                <td class="center">${item.count}</td>
                <td class="right">₹${(item.subtotal / item.count).toFixed(2)}</td>
                <td class="right bold">₹${item.subtotal.toFixed(2)}</td>
            </tr>
        `).join('');

        billWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice ${invoiceNo}</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; padding: 2rem; color: #1a1a2e; }

                .page { background: white; max-width: 820px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }

                /* ── Header ── */
                .header { background: linear-gradient(135deg, #6c47ff, #9c27b0); color: white; padding: 2rem 2.5rem; display: flex; justify-content: space-between; align-items: flex-start; }
                .brand { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.5px; }
                .brand span { opacity: 0.75; font-weight: 400; font-size: 1rem; display: block; margin-top: 0.25rem; }
                .invoice-tag { text-align: right; }
                .invoice-tag h2 { font-size: 1.1rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; opacity: 0.85; }
                .invoice-tag .inv-no { font-size: 1.5rem; font-weight: 800; margin-top: 0.25rem; }

                /* ── Meta strip ── */
                .meta { background: #f8f7ff; border-bottom: 1px solid #ede9fe; padding: 1.25rem 2.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
                .meta-item label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #888; font-weight: 600; display: block; margin-bottom: 0.2rem; }
                .meta-item span { font-size: 0.95rem; font-weight: 600; color: #1a1a2e; }

                /* ── Parties ── */
                .parties { display: flex; gap: 2rem; padding: 1.75rem 2.5rem; border-bottom: 1px solid #f0f0f0; }
                .party { flex: 1; }
                .party-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #6c47ff; font-weight: 700; margin-bottom: 0.5rem; }
                .party-name { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.2rem; }
                .party-sub { font-size: 0.85rem; color: #666; }

                /* ── Table ── */
                .table-wrap { padding: 1.75rem 2.5rem; }
                table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
                thead tr { background: #6c47ff; color: white; }
                thead th { padding: 0.75rem 1rem; font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; }
                tbody tr { border-bottom: 1px solid #f0f0f0; transition: background 0.15s; }
                tbody tr:last-child { border-bottom: none; }
                tbody tr:hover { background: #faf8ff; }
                td { padding: 0.85rem 1rem; vertical-align: middle; }
                .muted { font-size: 0.78rem; color: #999; margin-top: 0.15rem; }

                /* ── Totals ── */
                .totals { padding: 0 2.5rem 1.75rem; display: flex; justify-content: flex-end; }
                .totals-box { width: 280px; }
                .totals-row { display: flex; justify-content: space-between; padding: 0.4rem 0; font-size: 0.9rem; color: #555; border-bottom: 1px dashed #eee; }
                .totals-row:last-child { border-bottom: none; }
                .totals-grand { display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #6c47ff, #9c27b0); color: white; border-radius: 8px; margin-top: 0.75rem; font-weight: 700; font-size: 1.05rem; }

                /* ── Footer ── */
                .footer { background: #f8f7ff; border-top: 1px solid #ede9fe; padding: 1.25rem 2.5rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #888; }
                .footer strong { color: #6c47ff; }
                .status-badge { background: #fef08a; color: #854d0e; padding: 0.3rem 0.85rem; border-radius: 999px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }

                /* ── Utilities ── */
                .center { text-align: center; }
                .right  { text-align: right; }
                .bold   { font-weight: 700; }

                /* ── Print ── */
                @media print {
                    body { background: white; padding: 0; }
                    .page { box-shadow: none; border-radius: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="page">

                <!-- Header -->
                <div class="header">
                    <div class="brand">
                        FMCG Connect
                        <span>Distribution Management Platform</span>
                    </div>
                    <div class="invoice-tag">
                        <h2>Tax Invoice</h2>
                        <div class="inv-no">${invoiceNo}</div>
                    </div>
                </div>

                <!-- Meta strip -->
                <div class="meta">
                    <div class="meta-item">
                        <label>Invoice Date</label>
                        <span>${orderDate}</span>
                    </div>
                    <div class="meta-item">
                        <label>Time</label>
                        <span>${orderTime}</span>
                    </div>
                    <div class="meta-item">
                        <label>Order ID</label>
                        <span>#${order.id}</span>
                    </div>
                    <div class="meta-item">
                        <label>Payment</label>
                        <span>Stripe · ${order.transactionId ? order.transactionId.substring(0, 16) + '...' : 'N/A'}</span>
                    </div>
                    <div class="meta-item">
                        <label>Status</label>
                        <span class="status-badge" style="background:#bbf7d0;color:#166534;">Confirmed</span>
                    </div>
                </div>

                <!-- Parties -->
                <div class="parties">
                    <div class="party">
                        <div class="party-label">📤 Billed From (Distributor)</div>
                        <div class="party-name">${user.name}</div>
                        <div class="party-sub">Distributor · ID #${user.id}</div>
                    </div>
                    <div class="party">
                        <div class="party-label">📥 Billed To (Shop)</div>
                        <div class="party-name">${order.shopName}</div>
                        <div class="party-sub">Shop · ID #${order.shopId}</div>
                    </div>
                </div>

                <!-- Items Table -->
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th class="center" style="width:40px">#</th>
                                <th>Product</th>
                                <th class="center">Qty</th>
                                <th class="right">Unit Price</th>
                                <th class="right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemRows}
                        </tbody>
                    </table>
                </div>

                <!-- Totals -->
                <div class="totals">
                    <div class="totals-box">
                        <div class="totals-grand">
                            <span>Grand Total</span>
                            <span>₹${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <span>Generated by <strong>FMCG Connect</strong> · ${orderDate}</span>
                    <span>Thank you for your business! 🙏</span>
                </div>

            </div>

            <!-- Print button (hidden on print) -->
            <div class="no-print" style="text-align:center; margin-top: 1.5rem;">
                <button onclick="window.print()" style="padding: 0.75rem 2rem; background: linear-gradient(135deg,#6c47ff,#9c27b0); color:white; border:none; border-radius:8px; font-size:1rem; font-weight:700; cursor:pointer;">
                    🖨️ Print / Save as PDF
                </button>
            </div>

            <script> window.onload = function() { window.print(); } </script>
        </body>
        </html>
        `);
        billWindow.document.close();
    };

    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>Confirmed Order History</h2>

            {loading ? (
                <div className="flex-center" style={{ minHeight: '300px' }}>Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="card flex-center" style={{ flexDirection: 'column', height: '300px', color: 'hsl(var(--text-muted))' }}>
                    <Package size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>No confirmed orders in history.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {orders.map(order => (
                        <div key={order.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Order #{order.id}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>Shop: {order.shopName}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>{new Date(order.date).toLocaleString()}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                                        ₹{order.total}
                                    </div>
                                    {/* ✅ Bill button — only on confirmed orders */}
                                    <button
                                        onClick={() => generateBill(order)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                                    >
                                        <Receipt size={16} /> Bill
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
                                    {order.items.map((item, i) => (
                                        <div key={i}>{item.count} pcs x {item.product.name}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DistributorOrderHistory;
