'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('suppliers', 'company', {
      type: Sequelize.STRING,
      allowNull: true // Change to false if you want it required
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('suppliers', 'company');
  }
}; 