// check if enabled in settings
if ((require("Storage").readJSON("sleeplogtimer.settings.json", true) || {enabled: true}).enabled) {
  // read settings
  settings = require("sleeplogtimer").getSettings(); // is undefined if used with var

  // insert neccessary settings into widget
  WIDGETS.sleeplogtimer = {
    area: "tl",
    width: 0,
    //alarmAt: type Date of the alarm if triggered
    draw: function () {
      // draw zzz
      g.reset().setColor(settings.wid.color).drawImage(atob("BwoBD8SSSP4EEEDg"), this.x + 1, this.y);
      // draw duration to wake up alarm if enabled
      if (settings.wid.duration) {
        // directly include Font4x5Numeric
        g.setFontCustom(atob("CAZMA/H4PgvXoK1+DhPg7W4P1uCEPg/X4O1+AA=="), 46, atob("AgQEAgQEBAQEBAQE"), 5).setFontAlign(1, 1);
        g.drawString(settings.after, this.x + this.width + 1, this.y + 23);
      }
    },
    reload: require("sleeplogtimer").widReload
  };

  // load widget
  WIDGETS.sleeplogtimer.reload();
}