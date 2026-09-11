// Client-side pass notifications - the assignment's own suggested bonus
// feature. There's no server push infrastructure here: while the tab stays
// open, this schedules a plain setTimeout for each qualifying pass and fires
// a browser Notification a few minutes before it rises. Closing the tab (or
// the browser throttling a long-backgrounded tab) will lose anything still
// scheduled - a real limitation of a pure client-side approach, not hidden
// from the user (see the status text below).

const NOTIFY_LEAD_MINUTES = 5;
const NOTIFY_MIN_ELEVATION_DEG = 30;

let notificationsEnabled = false;
let scheduledTimeouts = [];

function clearScheduledNotifications() {
  scheduledTimeouts.forEach((id) => clearTimeout(id));
  scheduledTimeouts = [];
}

function updateNotifyStatus(text) {
  document.getElementById("notify-status").textContent = text;
}

function qualifyingPasses(passes) {
  const leadMs = NOTIFY_LEAD_MINUTES * 60000;
  const now = Date.now();
  return passes.filter((p) => {
    if (!p.visible || p.peak_elevation_deg < NOTIFY_MIN_ELEVATION_DEG) return false;
    const notifyAt = new Date(p.rise_time).getTime() - leadMs;
    return notifyAt > now;
  });
}

window.scheduleNotifications = function scheduleNotifications(passes, locationLabel) {
  clearScheduledNotifications();
  if (!notificationsEnabled) return;

  const qualifying = qualifyingPasses(passes);
  const leadMs = NOTIFY_LEAD_MINUTES * 60000;

  qualifying.forEach((p) => {
    const notifyAt = new Date(p.rise_time).getTime() - leadMs;
    const delay = notifyAt - Date.now();
    const id = setTimeout(() => {
      new Notification(`${p.name} passes over ${locationLabel} soon`, {
        body: `Rising in ~${NOTIFY_LEAD_MINUTES} minutes, peaking at ${p.peak_elevation_deg}° elevation. ${p.orbit_type} satellite, ${p.visible ? "should be visible to the eye" : ""}`,
        tag: `pass-${p.norad_id}-${p.rise_time}`,
      });
    }, delay);
    scheduledTimeouts.push(id);
  });

  updateNotifyStatus(
    qualifying.length
      ? `On - ${qualifying.length} upcoming alert${qualifying.length === 1 ? "" : "s"} scheduled (tab must stay open)`
      : "On - no standout passes to alert on right now"
  );
};

function initNotifications() {
  const btn = document.getElementById("enable-notifications-btn");

  if (!("Notification" in window)) {
    btn.disabled = true;
    updateNotifyStatus("Not supported in this browser");
    return;
  }

  btn.addEventListener("click", async () => {
    if (notificationsEnabled) {
      notificationsEnabled = false;
      btn.classList.remove("active");
      clearScheduledNotifications();
      updateNotifyStatus("Off");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      updateNotifyStatus("Blocked - allow notifications for this site in your browser settings to use this");
      return;
    }

    notificationsEnabled = true;
    btn.classList.add("active");
    if (window.currentPassesForNotify) {
      window.scheduleNotifications(window.currentPassesForNotify.passes, window.currentPassesForNotify.location);
    } else {
      updateNotifyStatus("On - will alert before the next standout pass");
    }
  });
}

initNotifications();
