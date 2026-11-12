/**
 * KAITHAR ATELIER — Production Backend Server
 * Architecture: Node.js + Express + Atomic Atelier JSON Store
 * Port: 3000 (serves frontend, cart, admin, and REST APIs)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'kaithar2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[ATELIER API] ${req.method} ${req.path}`);
  }
  next();
});

// Admin Authentication Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers['x-admin-key'] || req.query.key;
  if (!authHeader || authHeader !== ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Invalid atelier administrator credentials.'
    });
  }
  next();
}

// ============================================================================
// PUBLIC REST API ENDPOINTS
// ============================================================================

/**
 * 1. GET /api/stats
 * Returns current allotment metrics (total 40 units, claimed, remaining)
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

/**
 * 2. POST /api/checkout
 * Processes order reservation for BURGUNDY WALLET, assigns sequential edition number (1/40)
 */
app.post('/api/checkout', (req, res) => {
  try {
    const { fullName, email, phone, country, address, items, quantity, subtotal, discount, total, promoCode } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Patron full name and email address are required.'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Please provide a valid email address.'
      });
    }

    const result = db.createReservation({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      country: country ? country.trim() : 'India',
      address: address ? address.trim() : '',
      items: items || [{ id: 'wallet', title: 'BURGUNDY WALLET', qty: 1, price: 4000 }],
      quantity: quantity || 1,
      subtotal: subtotal || 4000,
      discount: discount || 0,
      total: total || 4000,
      promoCode: promoCode || null
    });

    if (!result.success) {
      return res.status(409).json(result);
    }

    // Auto-subscribe patron to atelier dispatch updates
    db.addSubscriber(email, 'CHECKOUT_RESERVATION');

    console.log(`[ORDER CONFIRMED] ${result.reservation.certificateId} for ${fullName} (${email}) — ₹${result.reservation.total} INR`);

    res.status(201).json({
      success: true,
      message: 'Numbered atelier reservation secured successfully.',
      reservation: result.reservation
    });
  } catch (err) {
    console.error('Error in checkout:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * 3. POST /api/invitations
 * Saves patron private invitation request from homepage
 */
app.post('/api/invitations', (req, res) => {
  try {
    const { fullName, email, piece } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Full name and email are required.'
      });
    }

    const result = db.createInvitation({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      piece: piece || 'BURGUNDY WALLET'
    });

    db.addSubscriber(email, 'INVITATION_REQUEST');

    res.status(201).json({
      success: true,
      message: 'Private invitation request registered in atelier queue.',
      invitation: result.invitation
    });
  } catch (err) {
    console.error('Error creating invitation:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

/**
 * 4. POST /api/subscribe
 * Newsletter & VIP Allotment dispatch subscription
 */
app.post('/api/subscribe', (req, res) => {
  try {
    const { email, source } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'EMAIL_REQUIRED' });
    }

    const result = db.addSubscriber(email, source || 'FOOTER_NEWSLETTER');
    res.status(200).json(result);
  } catch (err) {
    console.error('Error subscribing:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ============================================================================
// ADMIN REST API ENDPOINTS (Protected with x-admin-key: kaithar2026)
// ============================================================================

/**
 * 5. GET /api/admin/reservations
 */
app.get('/api/admin/reservations', requireAdmin, (req, res) => {
  const reservations = db.getReservations();
  const stats = db.getStats();
  res.json({ success: true, stats, reservations });
});

/**
 * 6. PATCH /api/admin/reservations/:id/status
 */
app.patch('/api/admin/reservations/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['CONFIRMED', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'INVALID_STATUS' });
  }

  const updated = db.updateReservationStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  }

  res.json({ success: true, reservation: updated });
});

/**
 * 7. GET /api/admin/subscribers
 */
app.get('/api/admin/subscribers', requireAdmin, (req, res) => {
  const subscribers = db.getSubscribers();
  const invitations = db.getInvitations();
  res.json({ success: true, subscribers, invitations });
});

/**
 * 8. GET /api/admin/export-csv
 * Generates ready-to-print CSV for courier fulfillment
 */
app.get('/api/admin/export-csv', requireAdmin, (req, res) => {
  const reservations = db.getReservations();
  const headers = [
    'Edition Number',
    'Certificate ID',
    'Status',
    'Patron Name',
    'Email',
    'Phone',
    'Country',
    'Delivery Address',
    'Total (INR)',
    'Created At'
  ];

  const rows = reservations.map(r => [
    `"${r.editionLabel || r.editionNumber}"`,
    `"${r.certificateId}"`,
    `"${r.status}"`,
    `"${r.fullName.replace(/"/g, '""')}"`,
    `"${r.email}"`,
    `"${(r.phone || '').replace(/"/g, '""')}"`,
    `"${(r.country || '').replace(/"/g, '""')}"`,
    `"${(r.address || '').replace(/"/g, '""')}"`,
    `"${r.total}"`,
    `"${r.createdAt}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="kaithar-wallet-allotments.csv"');
  res.send(csvContent);
});

// ============================================================================
// STATIC FILE SERVING & ROUTING
// ============================================================================

// Static assets (CSS, JS, images, zip)
app.use(express.static(__dirname));

// HTML Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'cart.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`  KAITHAR BY ANN — ATELIER BACKEND SERVER ACTIVE`);
  console.log(`  Local URL:        http://localhost:${PORT}/`);
  console.log(`  Cart URL:         http://localhost:${PORT}/cart.html`);
  console.log(`  Admin Dashboard:  http://localhost:${PORT}/admin.html (Key: kaithar2026)`);
  console.log(`  API Status:       http://localhost:${PORT}/api/stats`);
  console.log(`================================================================`);
});
