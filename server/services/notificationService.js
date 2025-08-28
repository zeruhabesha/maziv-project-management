import models from "../models/index.cjs";
const { Notification } = models;

export const findExistingNotification = async (user_id, type, message) => {
  return Notification.findOne({
    where: { user_id, type, message, is_read: false },
  });
};

export const createNotification = async (user_id, type, message) => {
  try {
    const existing = await findExistingNotification(user_id, type, message);
    if (existing) return existing;
    return await Notification.create({ user_id, type, message, is_read: false });
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};

export const getUserNotifications = async (user_id, limit = 20) => {
  try {
    return await Notification.findAll({
      where: { user_id },
      order: [["createdAt", "DESC"]],
      limit,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return [];
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) return null;
    // your model uses "is_read" in other places — keep it consistent:
    notification.is_read = true;
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Mark notification read error:", error);
    return null;
  }
};


