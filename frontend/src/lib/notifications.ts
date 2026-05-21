import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { PET_NAME } from "./pet";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

const TAGLINES = [
  "te extraña 🥺",
  "quiere jugar contigo",
  "está aprendiendo una palabra nueva",
  "tiene algo que contarte",
  "se siente solito 🌙",
  "está pensando en ti",
];

export async function scheduleDailyCheckIns(userName: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    // 3 check-ins per day at 10am, 3pm, 8pm
    const hours = [10, 15, 20];
    for (let i = 0; i < hours.length; i++) {
      const tagline = TAGLINES[i % TAGLINES.length];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${PET_NAME} ${tagline}`,
          body: userName
            ? `¿Quieres venir a hablar conmigo, ${userName}?`
            : "¿Vienes a hablar conmigo?",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours[i],
          minute: 0,
          repeats: true,
        },
      });
    }
  } catch {
    // best-effort — never crash UX on notification failure
  }
}
