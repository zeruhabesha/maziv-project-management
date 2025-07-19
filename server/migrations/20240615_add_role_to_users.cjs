'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.STRING,
      defaultValue: 'user',
      allowNull: false,
    });
    await queryInterface.addColumn('Users', 'manager_ids', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'role');
    await queryInterface.removeColumn('Users', 'manager_ids');
  }
}; 