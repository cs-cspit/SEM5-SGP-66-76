const express = require('express');
const Booking = require('../models/Booking');
const router = express.Router();

// Get all bookings (for admin)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('assignedVendor')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Create new booking
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, movie, date, time, seat, address, notes } = req.body;
    if (!name || !email || !phone || !movie || !date || !time || !seat || !address)
      return res.status(400).json({ message: 'All required fields must be provided.' });

    const booking = new Booking({ 
      name, 
      email, 
      phone, 
      movie, 
      date, 
      time, 
      seat, 
      address, 
      notes: notes || '' 
    });
    await booking.save();

    res.status(201).json({ message: 'Booking successful!', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update booking status (for admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    
    res.json({ message: 'Booking status updated successfully!', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;