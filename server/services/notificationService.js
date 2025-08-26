// import pkg from "../models/index.cjs";
// const { Notification } = pkg;

// export const findExistingNotification = async (user_id, type, message) => {
//   return await Notification.findOne({
//     where: {
//       user_id,
//       type,
//       message,
//       is_read: false,
//     },
//   });
// };

// export const createNotification = async (user_id, type, message) => {
//   try {
//     const existing = await findExistingNotification(user_id, type, message);
//     if (existing) return existing;
//     const notification = await Notification.create({
//       user_id,
//       type,
//       message,
//       is_read: false,
//     });
//     return notification;
//   } catch (error) {
//     console.error("Create notification error:", error);
//     return null;
//   }
// };

// export const getUserNotifications = async (user_id, limit = 20) => {
//   try {
//     return await Notification.findAll({
//       where: { user_id },
//       order: [["createdAt", "DESC"]],
//       limit,
//     });
//   } catch (error) {
//     console.error("Get notifications error:", error);
//     return [];
//   }
// };

// export const markNotificationRead = async (notificationId) => {
//   try {
//     const notification = await Notification.findByPk(notificationId);
//     if (!notification) return null;
//   notification.is_read = true;  // <- fix
//   await notification.save();
//   return notification;
//     return null;
//   } catch (error) {
//     console.error("Mark notification read error:", error);
//     return null;
//   }
// }; 

import pkg from "../models/index.cjs";
const { Notification } = pkg;

export const findExistingNotification = async (user_id, type, message) => {
  return await Notification.findOne({
    where: {
      user_id,
      type,
      message,
      is_read: false,
    },
  });
};

export const createNotification = async (user_id, type, message) => {
  try {
    const existing = await findExistingNotification(user_id, type, message);
    if (existing) return existing;
    const notification = await Notification.create({
      user_id,
      type,
      message,
      is_read: false,
    });
    return notification;
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
    if (notification) {
      notification.read = true;
      await notification.save();
      return notification;
    }
    return null;
  } catch (error) {
    console.error("Mark notification read error:", error);
    return null;
  }
}; 