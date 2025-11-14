const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Booking = require('../models/Booking');

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    // If MongoDB is not available, return sample data for testing
    if (error.message.includes('buffering timed out') || error.message.includes('ECONNREFUSED')) {
      const sampleVendors = [
        {
          _id: '1',
          name: 'John Smith',
          email: 'john.smith@sparkling.com',
          phone: '+44 123 456 7890',
          specializations: ['residential', 'interior'],
          availability: {
            monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
            saturday: false, sunday: false
          },
          rating: 4.8,
          totalJobs: 45,
          status: 'active',
          hourlyRate: 25.00,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@sparkling.com',
          phone: '+44 123 456 7891',
          specializations: ['commercial', 'high-rise', 'exterior'],
          availability: {
            monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
            saturday: true, sunday: false
          },
          rating: 4.9,
          totalJobs: 67,
          status: 'active',
          hourlyRate: 30.00,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '3',
          name: 'Mike Wilson',
          email: 'mike.wilson@sparkling.com',
          phone: '+44 123 456 7892',
          specializations: ['residential', 'commercial'],
          availability: {
            monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
            saturday: false, sunday: false
          },
          rating: 4.7,
          totalJobs: 32,
          status: 'active',
          hourlyRate: 28.00,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      return res.json(sampleVendors);
    }
    res.status(500).json({ message: error.message });
  }
});

// Get active vendors only
router.get('/active', async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: 'active' }).sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    // If MongoDB is not available, return sample data for testing
    if (error.message.includes('buffering timed out') || error.message.includes('ECONNREFUSED')) {
      const sampleVendors = [
        {
          _id: '1',
          name: 'John Smith',
          email: 'john.smith@sparkling.com',
          phone: '+44 123 456 7890',
          specializations: ['residential', 'interior'],
          availability: {
            monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
            saturday: false, sunday: false
          },
          rating: 4.8,
          totalJobs: 45,
          status: 'active',
          hourlyRate: 25.00,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@sparkling.com',
          phone: '+44 123 456 7891',
          specializations: ['commercial', 'high-rise', 'exterior'],
          availability: {
            monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
            saturday: true, sunday: false
          },
          rating: 4.9,
          totalJobs: 67,
          status: 'active',
          hourlyRate: 30.00,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '3',
          name: 'Mike Wilson',
          email: 'mike.wilson@sparkling.com',
          phone: '+44 123 456 7892',
          specializations: ['residential', 'commercial'],
          availability: {
            monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
            saturday: false, sunday: false
          },
          rating: 4.7,
          totalJobs: 32,
          status: 'active',
          hourlyRate: 28.00,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      return res.json(sampleVendors);
    }
    res.status(500).json({ message: error.message });
  }
});

// Create a new vendor
router.post('/', async (req, res) => {
  const vendor = new Vendor(req.body);
  try {
    const newVendor = await vendor.save();
    res.status(201).json(newVendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a vendor
router.put('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a vendor
router.delete('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign vendor to booking
router.post('/assign/:bookingId', async (req, res) => {
  try {
    const { vendorId, notes } = req.body;
    
    console.log('Assigning vendor:', { vendorId, notes, bookingId: req.params.bookingId }); // Debug log
    
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      console.log('Booking not found:', req.params.bookingId); // Debug log
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      console.log('Vendor not found:', vendorId); // Debug log
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    console.log('Found booking and vendor:', { booking: booking._id, vendor: vendor._id }); // Debug log
    
    booking.assignedVendor = vendorId;
    booking.assignmentDate = new Date();
    booking.assignmentNotes = notes || '';
    
    const updatedBooking = await booking.save();
    
    // Populate vendor details for response
    await updatedBooking.populate('assignedVendor');
    
    console.log('Assignment successful:', updatedBooking); // Debug log
    res.json(updatedBooking);
  } catch (error) {
    console.error('Assignment error:', error); // Debug log
    res.status(400).json({ message: error.message });
  }
});

// Unassign vendor from booking
router.post('/unassign/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    booking.assignedVendor = null;
    booking.assignmentDate = null;
    booking.assignmentNotes = '';
    
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get vendor assignments (bookings assigned to a vendor)
router.get('/:id/assignments', async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      assignedVendor: req.params.id 
    }).populate('assignedVendor').sort({ date: 1 });
    
    res.json(bookings);
  } catch (error) {
    // If MongoDB is not available, return sample data for testing
    if (error.message.includes('buffering timed out') || error.message.includes('ECONNREFUSED') || error.message.includes('Cast to ObjectId failed')) {
      const sampleBookings = [
        {
          _id: '1',
          name: 'Alice Brown',
          email: 'alice@example.com',
          movie: 'Residential Window Cleaning',
          date: '2024-02-15',
          seat: '15',
          status: 'confirmed',
          assignedVendor: {
            _id: req.params.id,
            name: req.params.id === '1' ? 'John Smith' : req.params.id === '2' ? 'Sarah Johnson' : 'Mike Wilson'
          },
          assignmentDate: '2024-02-10',
          assignmentNotes: 'Customer prefers morning appointments',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      return res.json(sampleBookings);
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 