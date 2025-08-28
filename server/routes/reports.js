import express from "express";
import models from "../models/index.cjs"; // CJS default import is fine
const { Project, Item, Phase, Alert } = models; // <-- remove any require line
const router = express.Router();

router.get("/reports/projects/:id/progress", async (req, res) => {
  const { id } = req.params;
  const project = await Project.findByPk(id, { include: [{ model: Item, as: "Items" }] });
  if (!project) return res.status(404).json({ success: false, message: "Project not found" });

  const totalItems = project.Items.length;
  const completedItems = project.Items.filter(i => i.status === "completed").length;
  const inProgressItems = project.Items.filter(i => i.status === "in_progress").length;
  const pendingItems = project.Items.filter(i => i.status === "pending").length;
  const overdueItems = project.Items.filter(i => i.deadline < new Date() && i.status !== "completed").length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  res.json({
    success: true,
    data: {
      project_name: project.name,
      total_items: totalItems,
      completed_items: completedItems,
      in_progress_items: inProgressItems,
      pending_items: pendingItems,
      overdue_items: overdueItems,
      progress_percentage: progress,
    }
  });
});

// Get project cost report
router.get("/projects/:id/cost", async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: Item,
          as: "Items", // Adjust the alias
        },
      ],
    });

    if (!project) {
      console.log(`Project with ID ${id} not found`);
      return res.status(404).json({ message: "Project not found" });
    }

    const tender_value = project.tender_value;
    let material_cost = 0;
    let total_taxes = 0;

    project.Items.forEach((item) => {
      material_cost += item.quantity * item.unit_price;
      total_taxes += item.taxes;
    });

    const total_items = project.Items.length;

    // Calculate profit and margin
    const totalCost = material_cost + total_taxes;
    const profit = tender_value - totalCost;
    const margin = tender_value > 0 ? (profit / tender_value) * 100 : 0;

    // Get cost breakdown by category
    const cost_breakdown = {};
    project.Items.forEach((item) => {
      if (!cost_breakdown[item.type]) {
        cost_breakdown[item.type] = { cost: 0, item_count: 0 };
      }
      cost_breakdown[item.type].cost += item.quantity * item.unit_price;
      cost_breakdown[item.type].item_count++;
    });

    const cost_breakdown_array = Object.entries(cost_breakdown)
      .sort(([, a], [, b]) => b.cost - a.cost)
      .map(([type, data]) => ({ type, ...data }));

    res.json({
      success: true,
      data: {
        project_name: project.name,
        tender_value,
        material_cost,
        total_taxes,
        total_items,
        total_cost: totalCost,
        profit,
        margin: Math.round(margin * 100) / 100,
        cost_breakdown: cost_breakdown_array,
      },
    });
  } catch (error) {
    console.error("Get cost report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get dashboard overview
router.get("/dashboard", async (req, res) => {
    try {
        // Check if models are properly loaded
        if (!Project || !Item || !Alert) {
            console.error('Models not properly loaded:', { Project: !!Project, Item: !!Item, Alert: !!Alert });
            return res.status(500).json({ success: false, message: 'Database models not available' });
        }

        // Get project statistics
        const projects = await Project.findAll();
        const total_projects = projects.length;
        const active_projects = projects.filter(project => project.status === 'active').length;
        const completed_projects = projects.filter(project => project.status === 'completed').length;
        const overdue_projects = projects.filter(project => project.end_date < new Date() && project.status !== 'completed').length;

        // Get item statistics
        const items = await Item.findAll();
        const total_items = items.length;
        const completed_items = items.filter(item => item.status === 'completed').length;
        const overdue_items = items.filter(item => item.deadline < new Date() && item.status !== 'completed').length;
        let total_value = 0;
        items.forEach(item => {
            total_value += (item.quantity || 0) * (item.unit_price || 0);
        });

        //Get recent Alerts
        const alerts = await Alert.findAll({
            limit: 10,
            order: [['triggered_at', 'DESC']],
            include: [
                { model: Project, as: 'Project', required: false },
                { model: Item, as: 'Item', required: false }
            ]
        });

        res.json({
            success: true,
            data: {
                projects: {
                    total_projects,
                    active_projects,
                    completed_projects,
                    overdue_projects
                },
                items: {
                    total_items,
                    completed_items,
                    overdue_items,
                    total_value
                },
                alerts
            }
        });
    } catch (error) {
        console.error("Get dashboard overview error:", error);
        console.error("Error details:", {
            message: error.message,
            name: error.name,
            sql: error.sql,
            original: error.original
        });
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
});

export default router;