import { sequelize } from '../models/index.cjs';
import { execSync } from 'child_process';

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Syncing database in development mode...');
      await sequelize.sync({ alter: true }); // Safer than force: true
    } else {
      console.log('🔄 Running migrations in production...');
      execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    }

    console.log('✅ Database synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();