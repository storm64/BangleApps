(function () {
  // define images
  let imgs = {
    alarm: "GBiBAAAYABg8GDD/DDH/jGP/xmP/xmf/5sf/48f/48//8w//8A//8A//8A//8B//+B//+D///H///v///3///gAAAAB+AAB+AAAYAA==",
    alarm_at: "GBiBAERAAF9AAJ8gAL+gAD+AAD+AAD+AAD+AAH/H4AAcuA4xDABhBgBBAgDBEwCBIQDBQQCBgwCAAQDAAwBAAgBgBgAwDAAdOAAH4A==",
    alarm_in: "GBiBAERAAF9AAJ8gAL+gAD+AAD+AAD+AAD+AAH/H4AAMMg4BhgAAbAAAGAAAMAAAYQAAwQABgQAAAQAAAwB4AgBABgBQDABcOAAH4A==",
    no_alarm: "GBiBAA8A8D4AfHx+PnnDnv8A/+wAN8mD05iA2REBiDGDDCAbxCA4BCDEBDACDBABCBgAmAh+MAw8IAYAYAPDwAZ+YAwAMBgAGDAADA==",
    timer: "GBiBAAACAAAHAAAPgAAJwAAI4AAYcAAQOAAQHAAQDgAQfwAR/gf3/DwP4GAYAOA4AHD4AD/4AB/4AA/4AAfwAAPwAAHwAADgAABAAA==",
    timer_at: "GBiBAAHAAAFgAAMwAAIYAAIMAAL+AD/8AOHwAIMH4P8cuH8xDD9hBh5BAg7BEwSBIQDBQQCBgwCAAQDAAwBAAgBgBgAwDAAdOAAH4A==",
    timer_in: "GBiBAAHAAAFgAAMwAAIYAAIMAAL+AD/8AOHwAIMH4P8MMn8Bhj8AbB4AGA4AMAQAYQAAwQABgQAAAQAAAwB4AgBABgBQDABcOAAH4A==",
    no_timer: "GBiBAD///BgAGBgAGBgAGAwAMAwAMAYAYAYAYAMAwAGDgADHAABuAABuAADLAAGBgAMIwAYcYAY+YAz/MA//8B//+B//+B//+D///A=="
  };
  // define timer id caches
  let timeout;
  let interval;
  // define time constants
  const ONE_MINUTE = 60 * 1000;
  const ONE_HOUR = 60 * ONE_MINUTE;
  // define items show function
  let showFn = i => {
    timeout = setTimeout(i => {
      i.emit('redraw');
      interval = setInterval(
        i => i.emit('redraw'), ONE_MINUTE, i
      );
    }, ONE_MINUTE - Date.now() % ONE_MINUTE, i);
  };
  // define items hide function
  let hideFn = () => {
    if (timeout) clearTimeout(timeout);
    timeout = undefined;
    if (interval) clearInterval(interval);
    interval = undefined;
  };
  // define items run function
  let runFn = i => {
    i.view = !i.view;
    i.emit('redraw');
  };
  // define function to format ms as human-readable time
  let getReadableTime = function (ms, isTime) {
    ms %= 24 * ONE_HOUR;
    if (isTime) ms -= Date().getTimezoneOffset() * ONE_MINUTE;
    let h = Math.floor(ms / ONE_HOUR);
    ms -= h * ONE_HOUR;
    let m = Math.floor(ms / ONE_MINUTE);
    if (isTime) h = ("0" + h).substr(-2);
    return h + ":" + ("0" + m).substr(-2);
  };
  //
  let getItems = function (timer) {
    // load sched
    let sched = require("sched");
    // read active alarms/timers
    let alarms = sched.getAlarms().filter(a => a.on && !timer == !a.timer).map(alarm => {
      let now = new Date();
      let tTo = sched.getTimeToAlarm(alarm, now);
      alarm.t = tTo ? now.valueOf() + tTo : 0;
      return {
        t: alarm.t,
        tTo: now => alarm.t - now + now % ONE_MINUTE
      };
    }).filter(a => a.t).sort((a, b) => a.t - b.t).map((alarm, index) => {
      return {
        name: (timer ? "Timer " : "Alarm ") + (index + 1) + (timer ? " in" : " at"),
        get: function () {
          // change name acording to view
          this.name = this.name.replace(this.view ? "at" : "in", this.view ? "in" : "at")
          return {
            text: getReadableTime(this.view ? alarm.t : alarm.tTo(Date.now()), this.view),
            img: atob(timer ? (
              this.view ? imgs.timer_at : imgs.timer_in
            ) : (
              this.view ? imgs.alarm_at : imgs.alarm_in
            ))
          };
        },
        show: function () { showFn(this); },
        hide: function () { hideFn(); },
        run: function () { runFn(this); },
        view: !timer
      };
    });
    // set text and icon on missing alarms
    if (!alarms.length) alarms = [{
      name: "no " + (timer ? "Timer" : "Alarms"),
      get: function () {
        return {
          text: "",
          img: atob(timer ? imgs.no_timer : imgs.no_alarm),
        };
      },
      show: () => { },
      hide: () => { }
    }];
    return alarms;
  };
  // return cards
  return [{
    name: "next Alarm",
    img: atob(imgs.alarm),
    dynamic: true,
    items: getItems(false)
  }, {
    name: "next Timer",
    img: atob(imgs.timer),
    dynamic: true,
    items: getItems(true)
  }];
});