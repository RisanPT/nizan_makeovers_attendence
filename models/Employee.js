const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  profile_picture: { type: String, default: '' }, // Cloudinary URL
  face_descriptor: { type: [Number], default: [] }, // 128-float face encoding
}, { timestamps: true });
const Employee = mongoose.model('Employee', employeeSchema);

// Sync indexes to automatically drop the old 'employee_id' unique index from the database
Employee.syncIndexes().catch(err => console.error('Error syncing indexes:', err));

module.exports = Employee;
