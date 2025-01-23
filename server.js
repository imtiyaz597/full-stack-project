require('dotenv').config(); // Uncomment if using environment variables
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect(
    `${process.env.MONGO_URI}/contactForm`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// MongoDB schema and model
const ContactSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const Contact = mongoose.model('Contact', ContactSchema);

// Test Route to Check API
app.get('/', (req, res) => {
  res.status(200).send('API is working. Use POST /api/contact to submit data.');
});

// POST endpoint for form submission
app.post('/api/contact', async (req, res) => {
  const { fullName, email, phoneNumber, message } = req.body;

  // Validate input
  if (!fullName || !email || !phoneNumber || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Save to MongoDB
    const newContact = new Contact({ fullName, email, phoneNumber, message });
    await newContact.save();
    console.log('Contact saved to MongoDB:', newContact);

    // Send email using nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your App Password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO, // Recipient's email
      subject: `New Contact Form Submission from ${fullName}`,
      text: `
        Name: ${fullName}
        Email: ${email}
        Phone: ${phoneNumber}
        Message: ${message}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);

    res.status(200).json({ message: 'Form submitted successfully!' });
  } catch (err) {
    console.error('Error processing the request:', err);
    res.status(500).json({ message: 'Error submitting form. Email not sent.' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
