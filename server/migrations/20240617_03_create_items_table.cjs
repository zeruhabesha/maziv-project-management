"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("items", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "projects", key: "id" },
        onDelete: "CASCADE",
      },
      phase_id: {
        type: Sequelize.INTEGER,
        references: { model: "phases", key: "id" },
        onDelete: "SET NULL",
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      brand: Sequelize.STRING,
      model: Sequelize.STRING,
      specifications: Sequelize.TEXT,
      unit: Sequelize.STRING,
      quantity: Sequelize.DECIMAL(10, 2),
      unit_price: Sequelize.DECIMAL(15, 2),
      supplier_id: {
        type: Sequelize.INTEGER,
        references: { model: "suppliers", key: "id" },
        onDelete: "SET NULL",
      },
      deadline: Sequelize.DATE,
      assigned_to: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
      },
      shipment_date: Sequelize.DATE,
      arrival_date: Sequelize.DATE,
      taxes: Sequelize.DECIMAL(15, 2),
      tracking_no: Sequelize.STRING,
      contractor: Sequelize.STRING,
      production_start_date: Sequelize.DATE,
      production_end_date: Sequelize.DATE,
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'on_hold', 'cancelled'),
        defaultValue: 'pending',
      },
      description: Sequelize.TEXT,
      file: Sequelize.STRING,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("items");
  },
};
