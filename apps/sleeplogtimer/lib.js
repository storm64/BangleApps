exports = {
  // function to read settings with defaults
  getSettings: function() {
    return Object.assign({
      enabled: true,
      after: 6,
      fromType: 0, // first ? sleep: 0 = consec., 1 = deep, 2 = light
      alarm: {
        msg: "Asleep since ",
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
        minTrueSleep: 0,
        minConsecSleep: 0
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

    // check if alarming on the correct weekday
    if (filter.dow & 1 << (new Date().getDay() +
      // add one day if alarm will be on the next day
      (filter.toType ? filter.to - settings.after < 0 : filter.to + settings.after > 24)
    )%7) {
      // set widget width if not hidden
      if (!this.hidden) this.width = 8;
      // insert sleeplogalarm conditions and function
      sleeplog.trigger.sleeplogtimer = {
        from: (settings.filter.from - settings.filter.fromType * settings.after + 24)%24 * 36E5,
        to: (settings.filter.to - settings.filter.toType * settings.after + 24)%24 * 36E5 - 1,
        fn: function (data) {
          // abort if already triggered
          if (WIDGETS.sleeplogtimer.alarmAt) return;
          // execute trigger function if going into consec., deep or light sleep, depending on settings
          if ((settings.fromType === 0 && data.consecutive === 2 && data.prevConsecutive <= 2) ||
              (settings.fromType === 1 && data.status === 4 && data.prevStatus <= 4) ||
              (settings.fromType === 2 && data.status === 3 && data.prevStatus <= 3))
            require("sleeplogalarm").trigger();
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
  trigger: function() {
    // read settings
    let settings = exports.getSettings();

    // convert timestamp into hours
    let now = timestamp.getHours() + Math.round(timestamp.getMinutes() / 60);

    // add alarm event at wake up time
    require("sched").setAlarm("sleeplogtimer", {
      appid: "sleeplog",
      on: true,
      t: (now + settings.after)%24 * 36E5,
      msg: "Asleep since " + timestamp.getHours() + ":" + timestamp.getMinutes(),
      vibrate: settings.alarm.vibrate,
      as: settings.alarm.as,
      hidden: settings.alarm.hidden,
      rp: false,
      del: true,
      data: {msg: settings.alarm.msg, conditions: settings.conditions},
      js: function() {
        print("##### alarming from sleeplogtimer #####\nthis =\n" + this);
        if (true) { // check for special conditions (this.data.conditions), e.g. minimal sleep duration
          // edit this alarm to be handled by sched.js
          this.js = undefined;
          if (this.data.msg) this.msg = this.data.msg;
          // retrigger sched.js
          load("sched.js");
        } else {
          // delete this alarm
          require("sched").setAlarm("sleeplogtimer", undefined);
        }
      }
    });

    // write changes
    sched.setAlarms(allAlarms);
  }
};