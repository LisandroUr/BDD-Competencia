require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDatabase, Campaign, Donation, Transfer } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/transfers', require('./routes/transferRoutes'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'API de Plataforma de Donaciones activa.' });
});

// Seed data function
const seedDatabase = async () => {
  const count = await Campaign.count();
  if (count === 0) {
    console.log('Seeding initial data for demonstration...');
    
    // Create Campaigns
    const c1 = await Campaign.create({
      title: 'Comedor Comunitario - Ayuda Alimentaria',
      description: 'Suministro de alimentos y raciones diarias para 150 niños y ancianos de bajos recursos en la ciudad de Goya.',
      targetAmount: 150000.00,
      status: 'active'
    });

    const c2 = await Campaign.create({
      title: 'Reconstrucción Escuela N° 4 - Techos y Aulas',
      description: 'Campaña urgente para reparar los techos dañados por la última tormenta y restaurar el sistema eléctrico escolar.',
      targetAmount: 300000.00,
      status: 'active'
    });

    const c3 = await Campaign.create({
      title: 'Equipamiento Médico - Hospital Local',
      description: 'Adquisición de un nuevo ecógrafo portátil para el área de emergencias y primeros auxilios de la localidad.',
      targetAmount: 80000.00,
      status: 'active'
    });

    // Create Donations
    await Donation.create({
      campaignId: c1.id,
      amount: 90000.00,
      donorName: 'Juan Pérez',
      comment: 'Espero que sirva de ayuda para comprar alimentos frescos.'
    });

    await Donation.create({
      campaignId: c1.id,
      amount: 60000.00,
      donorName: 'María Rodríguez',
      comment: 'Donación empresarial en apoyo a la comunidad.'
    });

    await Donation.create({
      campaignId: c2.id,
      amount: 45000.00,
      donorName: 'Vecinos Unidos de Goya',
      comment: 'Recaudación de la rifa benéfica de los fines de semana.'
    });

    await Donation.create({
      campaignId: c3.id,
      amount: 15000.00,
      donorName: 'Anónimo',
      comment: 'Mucha fuerza para todo el personal de salud.'
    });

    // Create a Transfer (Atomically transfer surplus from Comedor to Escuela)
    // Comedor has $150,000, target met, so we transfer $30,000 to Escuela to speed up repairs
    await Transfer.create({
      sourceCampaignId: c1.id,
      targetCampaignId: c2.id,
      amount: 30000.00,
      reason: 'Redirección de excedente de fondos para obra de emergencia en la escuela.'
    });

    console.log('Seed completed successfully.');
  }
};

// Initialize server
const startServer = async () => {
  try {
    // Initialize DB and VIEW
    await initDatabase();
    
    // Seed
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
