/**
 * KAITHAR ATELIER — Persistent Lightweight Database Engine
 * Atomic JSON storage engine with sequential numbered edition allocation (1 to 40)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'atelier.json');

const INITIAL_STATE = {
  settings: {
    brand: 'KAITHAR BY ANN',
    productName: 'BURGUNDY WALLET',
    totalEdition: 40,
    price: 4000,
    currency: 'INR'
  },
  reservations: [],
  invitations: [],
  subscribers: []
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read database
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(INITIAL_STATE);
      return JSON.parse(JSON.stringify(INITIAL_STATE));
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DB] Read error, resetting to initial state:', err);
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }
}

// Write database atomically
function writeDb(data) {
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, DB_FILE);
}

// API Methods
const db = {
  // Get Allotment Stats
  getStats() {
    const data = readDb();
    const total = data.settings.totalEdition || 40;
    const allocated = data.reservations.length;
    const remaining = Math.max(0, total - allocated);
    const totalRevenue = data.reservations.reduce((sum, r) => sum + (r.total || 4000), 0);

    return {
      productName: data.settings.productName,
      price: data.settings.price,
      currency: data.settings.currency,
      totalEdition: total,
      allocatedCount: allocated,
      remainingCount: remaining,
      totalRevenue,
      subscribersCount: data.subscribers.length,
      invitationsCount: data.invitations.length
    };
  },

  // Create Wallet Reservation (Checkout)
  createReservation(payload) {
    const data = readDb();
    const totalEdition = data.settings.totalEdition || 40;
    const currentCount = data.reservations.length;

    if (currentCount >= totalEdition) {
      return {
        success: false,
        error: 'ALLOTMENT_EXHAUSTED',
        message: 'The inaugural 40 numbered pieces have been fully allocated.'
      };
    }

    const editionNumber = currentCount + 1;
    const formattedEdition = String(editionNumber).padStart(2, '0');
    const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certificateId = `KT-${formattedEdition}/40-${randomHash}`;

    const newReservation = {
      id: `res_${Date.now()}_${randomHash.toLowerCase()}`,
      editionNumber,
      editionLabel: `EDITION ${formattedEdition} OF ${totalEdition}`,
      certificateId,
      fullName: payload.fullName || 'Anonymous Patron',
      email: payload.email,
      phone: payload.phone || '',
      country: payload.country || 'India',
      address: payload.address || '',
      items: payload.items || [{ id: 'wallet', title: 'BURGUNDY WALLET', qty: 1, price: 4000 }],
      quantity: payload.quantity || 1,
      subtotal: payload.subtotal || 4000,
      discount: payload.discount || 0,
      total: payload.total || 4000,
      currency: 'INR',
      promoCode: payload.promoCode || null,
      status: 'CONFIRMED', // CONFIRMED | IN_PRODUCTION | DISPATCHED | CANCELLED
      paymentMethod: payload.paymentMethod || 'ATELIER_INVOICE_ON_DELIVERY',
      paymentStatus: 'SECURED_PENDING_DISPATCH',
      createdAt: new Date().toISOString()
    };

    data.reservations.push(newReservation);
    writeDb(data);

    return {
      success: true,
      reservation: newReservation
    };
  },

  // Get All Reservations (Admin)
  getReservations() {
    const data = readDb();
    return data.reservations;
  },

  // Update Reservation Status (Admin)
  updateReservationStatus(id, newStatus) {
    const data = readDb();
    const item = data.reservations.find(r => r.id === id || r.certificateId === id);
    if (!item) return null;
    item.status = newStatus;
    item.updatedAt = new Date().toISOString();
    writeDb(data);
    return item;
  },

  // Create Private Invitation Request
  createInvitation(payload) {
    const data = readDb();
    const newInvitation = {
      id: `inv_${Date.now()}`,
      fullName: payload.fullName,
      email: payload.email,
      piece: payload.piece || 'BURGUNDY WALLET',
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString()
    };

    data.invitations.push(newInvitation);
    writeDb(data);

    return {
      success: true,
      invitation: newInvitation
    };
  },

  // Get All Invitations (Admin)
  getInvitations() {
    const data = readDb();
    return data.invitations;
  },

  // Subscribe Newsletter / VIP List
  addSubscriber(email, source = 'FOOTER_NEWSLETTER') {
    const data = readDb();
    const normalized = email.toLowerCase().trim();
    const exists = data.subscribers.find(s => s.email === normalized);

    if (exists) {
      return { success: true, message: 'Already subscribed to atelier dispatches.', existing: true };
    }

    const newSub = {
      id: `sub_${Date.now()}`,
      email: normalized,
      source,
      createdAt: new Date().toISOString()
    };

    data.subscribers.push(newSub);
    writeDb(data);

    return { success: true, message: 'Successfully subscribed to atelier dispatches.', subscriber: newSub };
  },

  // Get All Subscribers (Admin)
  getSubscribers() {
    const data = readDb();
    return data.subscribers;
  }
};

module.exports = db;
