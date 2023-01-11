{ // start clock

  /*** draw functions ***/
  // function to draw the clock frame
  let drawFrame = function(opt) {
    let fs = opt.fullscreen;
    g.reset();
    let color = typeof opt.frameColor === "number" ? opt.frameColor : g.theme[opt.frameColor];
    if (color) g.setColor(color);
    g.drawRect(-1, fs ? -1 : 25, 176, fs ? 25 : 43);
    g.drawRect(-1, fs ? 84 : 98, 176, fs ? 130 : 137);
    g.drawRect(58, fs ? 84 : 98, 117, 176);
  };
  // function to draw the clock values
  let drawChanged = function(time, changed, opt) {
    // set y positions depending on fullscreen
    let fs = opt.fullscreen;
    let dy = fs ? 15 : 36; // for date line
    let y = fs ? 59 : 75;  // for hour and minute

    // draw date line on change
    if (changed.d) {
      // clear date line
      g.reset().clearRect(0, fs ? 0 : 27, 175, fs ? 24 : 41).setFont12x20();
      // check lock state on fullscreen
      if (fs && !Bangle.isLocked()) {
        // draw widgets
        Bangle.drawWidgets();
      } else {
        // calculate week of year
        let yf = new Date(time.getFullYear(), 0, 1);
        let dpy = Math.ceil((time + 1 - yf) / 86400000);
        let woy = (opt.woy || (/*LANG*/"Week").substr(0, 1)) +
          (" " + Math.ceil((dpy + (yf.getDay() - 11) % 7 + 3) / 7)).slice(-2);

        // setup values according to settings
        let values = opt.dateLine.map(field => ({
          date: require("locale").date(time, 1),
          dow: require("date_utils").dows(0, 1)[time.getDay()],
          woy: woy
        })[field]);

        // set y position and draw values
        g.setFontAlign(-1).drawString(values[0], 1, dy);
        g.setFontAlign(1).drawString(values[2], 176, dy);
        let v0x2 = 1 + g.stringWidth(values[0]);
        let v2x1 = 176 - g.stringWidth(values[2]);
        g.setFontAlign().drawString(values[1], (v0x2 + v2x1) / 2 + 1.4, dy);
      }
    }

    // draw hours on change
    if (changed.h) {
      let hours = ((opt.leading0 ? "0" : " ") + (opt.is12Hour ?
        (time.getHours()-1)%12+1 : time.getHours())).substr(-2) + ":";
      g.reset().clearRect(2, y - 29, 99, y + 20).setFont("Vector:66").setFontAlign(1);
      g.drawString(hours, 100, y);
      if (opt.is12Hour) g.setFont6x15().setFontAlign().drawString(
        time.getHours() < 12 ? "am" : "pm", 88, y - 21);
    }

    // draw minutes on change
    if (changed.m) {
      g.reset().clearRect(100, y - 29, 173, y + 20).setFont("Vector:66").setFontAlign(1);
      g.drawString(("0" + time.getMinutes()).substr(-2), 182, y);
    }
  };
  // function to draw each tile
  let drawTile = function(itm, get, opt) {
    // setup positions
    let rect = opt.rect;
    let center = (function(r) {
      return {x: (r.x + r.x2) / 2, y: (r.y + r.y2) / 2};
    })(rect);
    let xGap = opt.fs ? 14 : 12;

    // clear tile
    g.reset().clearRect(rect);
    // set highlight color if in focus
    if (opt.focus && opt.hl) g.setColor(opt.hl);

    // draw item text
    let text = "" + (get.text || "");

    let font = text.length > 5 || text.includes("\n") ? "6x8" : "12x20";
    if (text.length > 9) text = text.substr(0, 9).includes("\n") ?
      text.substr(0, text.indexOf("\n") + 9) :
      text.substr(0, 9) + "\n" + text.substr(9, 9).replace("\n", " ");
    g.setFont(font).setFontAlign().drawString(
      text, center.x + 1.4, rect.y2 - 7
    );

    // draw card count on multiple items
    if ((opt.nBs || [])[opt.menuA] > 1) {
      xGap += 4;
      g.setFont("6x8").drawString(
        opt.menuB + 1 + " \n " + opt.nBs[opt.menuA], center.x + 0.5, rect.y + 10
      ).drawLine(center.x - 5.5,  rect.y + 16, center.x + 4.5,  rect.y + 4);
    }

    // setup and draw images if defined
    let imgY = rect.y + (opt.fs ? 14 : 10);
    let imgScale = opt.fs ? 1 : 2/3;
    var images = [];
    if (itm.img) images.push({
      x: center.x - xGap + 0.4,
      y: imgY,
      image: itm.img,
      scale: imgScale,
      center: true
    });
    if (get.img) images.push({
      x: center.x + xGap,
      y: imgY,
      image: get.img,
      scale: imgScale,
      center: true
    });
    g.drawImages(images);
  };

  /*** clock_info initialisation ***/
  let initClkInfo = function(opt) {
    // load clock_info data
    let clkInfos = require("clock_info").load();
    // insert menuA image into each item
    clkInfos.forEach(mA => {
      mA.items.map(mB => { mB.img = mA.img; return mB; });
    });
    // define tile/info rectangles
    let y = opt.fullscreen ? [85, 129, 131, 175] : [99, 136, 138, 175];
    let tileRect = [
      {x: 0, y: y[0], x2: 57, y2: y[1]},
      {x: 59, y: y[0], x2: 116, y2: y[1]},
      {x: 118, y: y[0], x2: 175, y2: y[1]},
      {x: 0, y: y[2], x2: 57, y2: y[3]},
      {x: 59, y: y[2], x2: 116, y2: y[3]},
      {x: 118, y: y[2], x2: 175, y2: y[3]}
    ];
    let infoRect = [
      {x: 0, y: y[2], x2: 175, y2: y[3]},
      {x: 0, y: y[0], x2: 175, y2: y[3]}
    ];
    // setup clock_info items
    global["6tclk"].tileItems = tileRect.map(function(rect, index) {
      // get tile settings
      let myOpt = opt.tiles[index];
      // make a copy of clockinfo data for each item
      let itemInfos = clkInfos.slice();
      // filter menuA items if defined
      if (myOpt.menuA) itemInfos = itemInfos.filter(mA => myOpt.menuA.includes(mA.name));
      // filter menuB items if defined
      if (myOpt.menuB) itemInfos = itemInfos.map(menuA => {
        let mA = menuA.clone();
        mA.items = mA.items.filter(mB => myOpt.menuB.includes(mB.name));
        return mA;
      });
      return itemInfos;
    });
    // setup clock_info menus
    global["6tclk"].tileMenus = tileRect.map(function(rect, index) {
      // reference tileItems
      let tileItem = global["6tclk"].tileItems[index];
      // check if there is no entry
      if (tileItem.length <= 0 || tileItem[0].items.length <= 0) {
        // draw empty tile
        setTimeout(drawTile, 0, {
          // set menuA image if available
          img: tileItem[0] ? tileItem[0].img : undefined
        }, {
          // set placeholder
          text: tileItem[0] ? "none" : "\\\'o\'/"
        }, {
          // set options
          rect: rect,
          fs: opt.fullscreen
        });
        return {remove: () => {}};
      } else if (tileItem.length > 1 || tileItem[0].items.length > 1) {
        // calculate number of menuB items for each menuA item
        let nBs = tileItem.map(mA => mA.items.length);
        // setup interactive tile
        return require("clock_info").addInteractive(tileItem, {
          x: rect.x,
          y: rect.y,
          w: rect.x2 - rect.x,
          h: rect.y2 - rect.y,
          draw: drawTile,
          hl: "#0ff",
          rect: rect,
          tileNo: index,
          fs: opt.fullscreen,
          nBs: nBs
        });
      } else {
        // setup single element
        tileItem = tileItem[0].items[0];
        let menu = {
          index: -1,
          remove: () => tileItem.hide(),
          redraw: () => drawTile(tileItem, tileItem.get(), {
            rect: rect,
            tileNo: index,
            fs: opt.fullscreen
          })
        };
        tileItem.on("redraw", menu.redraw);
        tileItem.show();
        tileItem.emit("redraw");
        return menu;
      }
    });
  };

  /*** setup global object ***/
  global["6tclk"] = {
    // clock function
    clock: new (require("ClockFace"))({
      init: function() {
        initClkInfo(this);
      },
      draw: function(time, changed) {
        drawFrame(this);
        drawChanged(time, changed, this);
      },
      update: function(time, changed) {
        drawChanged(time, changed, this);
      },
      remove: function() {
        // remove tile menus
        global["6tclk"].tileMenus.forEach(tile => tile.remove());
        // remove lock listener
        Bangle.removeListener("lock", global["6tclk"].onLock);
        // remove clock
        delete global["6tclk"];
      },
      settingsFile: "6tilesclk.settings.json"
    }),
    // onLock function
    onLock: function(on) {
      let clock = global["6tclk"].clock;
      // clear selection of a tile on lock
      if (on) global["6tclk"].tileMenus.some(tile => { if (tile.focus) {
        tile.focus = false;
        tile.redraw();
        return true;
      } });
      // add date line redraw on lock state change on fullscreen mode
      if (clock.fullscreen && clock.loadWidgets) drawChanged(new Date(), {d: true}, clock);
    },
    // tiles array
    tileMenus: []
  };

  /*** start clock and load settings ***/
  global["6tclk"].clock.start();

  /*** add lock listener ***/
  Bangle.on("lock", global["6tclk"].onLock);

} // end of clock