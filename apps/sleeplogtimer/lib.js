exports = {
  // function to read settings with defaults
  getSettings: function() {
    return Object.assign({
      enabled: true,
      after: 6,
      fromType: 0, // first ? sleep: 0 = consec., 1 = deep, 2 = light
      alarm: {
        msg: "",
        vibrate: "..",
        as: true,
        hidden: true
      },
      filter: {
        fromType: true, // referrence for from: true = wake up time, false = fall asleep time
        from: 3,
        toType: true, // referrence for to: true = wake up time, false = fall asleep time
        to: 12,
        dow: 127
      },
      conditions: {
        minConsecSleep: 0,
        minTrueSleep: 0
      },
      wid: {
        hide: false,
        duration: true,
        color: g.theme.dark ? 65504 : 31 // yellow or blue
      }
    }, require("Storage").readJSON("sleeplogtimer.settings.json", true) || {});
  },

  // widget reload function
  widReload: function() {
    // abort if trigger object is not available
    if (typeof (global.sleeplog || {}).trigger !== "object") return;

    // read settings to calculate duration to wake up alarm
    let settings = exports.getSettings();

    // set shortcut to filter
    let filter = settings.filter;
    // 0 = Sunday (default), 1 = Monday
    const firstDayOfWeek = (require("Storage").readJSON("setting.json", true) || {}).firstDayOfWeek || 0;

    // check if alarming on the correct weekday
    if (filter.dow & 1 << (new Date().getDay() +
      // add one day if first day of the week is monday
      ((require("Storage").readJSON("setting.json", true) || {}).firstDayOfWeek || 0) +
      // add one day if alarm will be on the next day
      (filter.toType ? filter.to - settings.after < 0 : filter.to + settings.after > 24)
    )%7) {
      // set widget width if not hidden
      if (!this.hidden) this.width = 8;
      // insert sleeplogtimer conditions and function
      sleeplog.trigger.sleeplogtimer = {
        onchange: true,
        from: (settings.filter.from - settings.filter.fromType * settings.after + 24)%24 * 36E5,
        to: (settings.filter.to - settings.filter.toType * settings.after + 24)%24 * 36E5 - 1,
        // set condition depending on settings
        checkCondition: [
          data => data.consecutive === 2, // going into consecutive sleep
          data => data.status === 4 && data.prevStatus < 4, // going into deep sleep
          data => data.status >= 3 && data.prevStatus < 3 // going into deep/light sleep
        ][settings.fromType],
        // set timestamp depending on settings
        getTimestamp: settings.fromType ? data => data.timestamp :
          data => new Date(sleeplog.awakeSince || (data.timestamp - sleeplog.conf.minConsec)),
        fn: function (data) {
          print("condition = ", this.checkCondition(data));
          print("timestamp = ", this.getTimestamp(data));
          // execute trigger function if not already triggered and the condition is met
          if (!WIDGETS.sleeplogtimer.alarmAt && this.checkCondition(data))
            require("sleeplogtimer").trigger(this.getTimestamp(data));
        }
      };
    } else {
      // reset widget width
      this.width = 0;
      // clear trigger function
      delete sleeplog.trigger.sleeplogtimer;
    }
  },

  // trigger function
  trigger: function(timestamp) {
    // read settings
    let settings = exports.getSettings();

    // convert timestamp into hours
    let now = timestamp.getHours() + timestamp.getMinutes() / 60;

    // add alarm event at wake up time
    require("sched").setAlarm("sleeplogtimer", {
      appid: "sleeplog",
      on: true,
      t: Math.round((now + settings.after)%24 * 36E5),
      msg: "Asleep since " + timestamp.getHours() + ":" + timestamp.getMinutes(),
      hidden: settings.alarm.hidden,
      rp: false,
      vibrate: settings.alarm.vibrate,
      as: settings.alarm.as,
      "js": "require('sleeplogtimer').alarm()",
      data: {
        after: settings.after,
        msg: settings.alarm.msg,
        conditions: settings.conditions
      }
    });

    // reload alarms
    require("sched").reload();
  },

  // alarm function
  alarm: function() {
    // load alarm
    let alarm = require("sched").getAlarm("sleeplogtimer");
    // load sleep stats if any special condition is set
    let stats = Object.keys(alarm.data.conditions).some(key => alarm.data.conditions[key]) ?
      require("sleeplog").getStats(new Date(), alarm.data.after * 36E5) : {};
    // check for special conditions only if stats are loaded
    if (!stats || stats.consecSleep >= alarm.data.conditions.minConsecSleep &&
      stats.deepSleep + stats.lightSleep >= alarm.data.conditions.minTrueSleep) {
      // set msg from settings if defined
      if (alarm.data.msg) alarm.msg = alarm.data.msg;
      // edit this alarm to be handled by sched.js once
      delete alarm.data;
      delete alarm.js;
      alarm.del = true;
      // write changes
      require("sched").setAlarm("sleeplogtimer", alarm);
      // retrigger sched.js
      load("sched.js");
    } else {
      // clear this alarm if the special conditions did not match
      require("sched").setAlarm("sleeplogtimer", undefined);
      // reload alarms
      require("sched").reload();
    }
  }
};