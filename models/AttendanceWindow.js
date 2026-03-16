const mongoose = require('mongoose');

const attendanceWindowSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radius_meters: { type: Number, default: 500 },
});

module.exports = mongoose.model('AttendanceWindow', attendanceWindowSchema);
