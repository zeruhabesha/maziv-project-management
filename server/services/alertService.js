import nodemailer from "nodemailer";
import pkg from "../config/database.cjs";
const { getSequelize } = pkg;
import { Op } from 'sequelize';

const { models } = getSequelize();
const { Item, Project, Alert, User } = models;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const checkDeadlines = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Check for items approaching deadline (3 days)
    const approachingItems = await Item.findAll({
      where: {
        deadline: {
          [Op.between]: [now, threeDaysFromNow],
        },
        status: { [Op.ne]: "completed" },
      },
      include: [Project, {model: User, as: 'AssignedTo'}],
    });

    //Check for overdue items
    const overdueItems = await Item.findAll({
      where: {
        deadline: {
          [Op.lt]: now,
        },
        status: { [Op.ne]: "completed" },
      },
      include: [Project, {model: User, as: 'AssignedTo'}],
    });

    // Create alerts for approaching deadlines
    for (const item of approachingItems) {
      try {
        // Check if an alert has already been created today
        const existingAlert = await Alert.findOne({
          where: {
            item_id: item.id,
            type: "deadline_approaching",
            triggered_at: {
              [Op.gte]: new Date(
                new Date().setHours(0, 0, 0, 0)
              ),
            },
          },
        });
        if (!existingAlert) {
          // Create the alert
          const alert = await Alert.create({
            item_id: item.id,
            project_id: item.project_id,
            type: "deadline_approaching",
            message: `Item "${item.name}" deadline approaching in ${Math.ceil(
              (new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24)
            )} days`,
            severity: "medium",
          });

          // Send email if user is assigned
          if (item.AssignedTo && item.AssignedTo.email) {
            await sendDeadlineEmail(item, "approaching");
          }
        }
      } catch (error) {
        console.error(
          `Error creating alert for approaching deadline for item ${item.id}:`,
          error
        );
      }
    }

    for (const item of overdueItems) {
      try {
        // Check if an alert has already been created today
        const existingAlert = await Alert.findOne({
          where: {
            item_id: item.id,
            type: "overdue",
            triggered_at: {
              [Op.gte]: new Date(
                new Date().setHours(0, 0, 0, 0)
              ),
            },
          },
        });
        if (!existingAlert) {
          // Create the alert
          const alert = await Alert.create({
            item_id: item.id,
            project_id: item.project_id,
            type: "overdue",
            message: `Item "${item.name}" is overdue by ${Math.ceil(
              (new Date() - new Date(item.deadline)) / (1000 * 60 * 60 * 24)
            )} days`,
            severity: "high",
          });

          // Send email if user is assigned
          if (item.AssignedTo && item.AssignedTo.email) {
            await sendDeadlineEmail(item, "overdue");
          }
        }
      } catch (error) {
        console.error(
          `Error creating alert for overdue item ${item.id}:`,
          error
        );
      }
    }

    console.log(
      `Created ${approachingItems.length} approaching deadline alerts`
    );
    console.log(`Created ${overdueItems.length} overdue alerts`);
  } catch (error) {
    console.error("Check deadlines error:", error);
  }
};

export const createAlert = async (userId, type, message, projectId = null, severity = 'medium') => {
  try {
    const alert = await Alert.create({
      user_id: userId,
      project_id: projectId,
      type,
      message,
      severity,
      triggered_at: new Date(),
      is_read: false
    });
    return alert;
  } catch (error) {
    console.error('Create alert error:', error);
    return null;
  }
};

const sendDeadlineEmail = async (item, type) => {
  try {
    if (
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      !process.env.SMTP_FROM
    ) {
      console.warn("SMTP credentials missing.  Skipping email.");
      return;
    }

    const subject =
      type === "approaching"
        ? `Deadline Approaching: ${item.name}`
        : `Overdue Alert: ${item.name}`;

    const html = `
            <h2>${subject}</h2>
            <p><strong>Project:</strong> ${item.Project.name}</p>
            <p><strong>Item:</strong> ${item.name}</p>
            <p><strong>Deadline:</strong> ${new Date(
              item.deadline
            ).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${item.status}</p>
            <p>Please take appropriate action to complete this item.</p>
        `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: item.AssignedTo.email,
      subject,
      html,
    });

    console.log(`Email sent to ${item.AssignedTo.email} for item ${item.id}`);
  } catch (error) {
    console.error("Send email error:", error);
  }
};
