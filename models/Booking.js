const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  email:  { type: String, required: true },
  phone:  { type: String, required: true },
  movie:  { type: String, required: true },
  date:   { type: String, required: true },
  time:   { type: String, required: true },
  seat:   { type: String, required: true },
  address: { type: String, required: true },
  notes:  { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'completed', 'cancelled'] },
  assignedVendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor',
    default: null 
  },
  assignmentDate: { 
    type: Date, 
    default: null 
  },
  assignmentNotes: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);