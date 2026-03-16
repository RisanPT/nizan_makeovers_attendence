const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { upload, uploadToCloudinary } = require('../middleware/upload');
const { getDescriptor } = require('../utils/faceRecognition');

// GET /api/employees/ — list all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().select('-face_descriptor');
    // Format to match Django serializer (id as number, etc.)
    const data = employees.map(emp => ({
      id: emp._id,
      name: emp.name,
      profile_picture: emp.profile_picture || null,
    }));
    res.json(data);
  } catch (err) {
    console.error('❌ Employee route error:', err);
    res.status(500).json({ error: err.message, detail: err.stack });
  }
});

// POST /api/employees/ — create employee
router.post('/', upload.single('profile_picture'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    let profile_picture = '';
    let face_descriptor = [];

    if (req.file) {
      // Upload image to Cloudinary
      profile_picture = await uploadToCloudinary(req.file.buffer, 'nizan_employees');

      // Extract face descriptor
      const descriptor = await getDescriptor(req.file.buffer);
      if (!descriptor) return res.status(400).json({ error: 'No face detected in the uploaded image. Please use a clear face photo.' });
      face_descriptor = Array.from(descriptor);
    } else {
      return res.status(400).json({ error: 'Profile picture is required' });
    }

    const emp = await Employee.create({ name, profile_picture, face_descriptor });
    res.status(201).json({
      id: emp._id,
      name: emp.name,
      profile_picture: emp.profile_picture,
    });
  } catch (err) {
    console.error('❌ Employee route error:', err);
    res.status(500).json({ error: err.message, detail: err.stack });
  }
});

// GET /api/employees/:id/ — get single employee
router.get('/:id/', async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id).select('-face_descriptor');
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json({ id: emp._id, name: emp.name, profile_picture: emp.profile_picture });
  } catch (err) {
    console.error('❌ Employee route error:', err);
    res.status(500).json({ error: err.message, detail: err.stack });
  }
});

// PUT /api/employees/:id/ — update employee
router.put('/:id/', upload.single('profile_picture'), async (req, res) => {
  try {
    const { name } = req.body;
    const updateData = {};
    if (name) updateData.name = name;

    if (req.file) {
      updateData.profile_picture = await uploadToCloudinary(req.file.buffer, 'nizan_employees');
      const descriptor = await getDescriptor(req.file.buffer);
      if (descriptor) updateData.face_descriptor = Array.from(descriptor);
    }

    const emp = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-face_descriptor');
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json({ id: emp._id, name: emp.name, profile_picture: emp.profile_picture });
  } catch (err) {
    console.error('❌ Employee route error:', err);
    res.status(500).json({ error: err.message, detail: err.stack });
  }
});

// DELETE /api/employees/:id/ — delete employee
router.delete('/:id/', async (req, res) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.status(204).send();
  } catch (err) {
    console.error('❌ Employee route error:', err);
    res.status(500).json({ error: err.message, detail: err.stack });
  }
});

module.exports = router;
