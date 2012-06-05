/*
 * Poshy Tip jQuery plugin v1.1
 * http://vadikom.com/tools/poshy-tip-jquery-plugin-for-stylish-tooltips/
 * Copyright 2010-2011, Vasil Dinkov, http://vadikom.com/
 */

(function($) {

  var tips = [],
    reBgImage = /^url\(["']?([^"'\)]*)["']?\);?$/i,
    rePNG = /\.png$/i,
    ie6 = $.browser.msie && $.browser.version == 6;

  // make sure the tips' position is updated on resize
  function handleWindowResize() {
    $.each(tips, function() {
      this.refresh(true);
    });
  }
  $(window).resize(handleWindowResize);

  $.Ttip = function(elm, options) {
    this.$elm = $(elm);
    this.opts = $.extend({}, $.fn.ttip.defaults, options);
    this.$tip = $(this.$elm.data('ttip'));

    //this.$arrow = this.$tip.find('div.tip-arrow');
    this.disabled = false;
    this.init();
  };

  $.Ttip.prototype = {
    init: function() {
      tips.push(this);

      this.$elm.data('ttip', this);

      // hook element events
      if (this.opts.showOn != 'none') {
        this.$elm.bind({
          'mouseenter.ttip': $.proxy(this.mouseenter, this),
          'mouseleave.ttip': $.proxy(this.mouseleave, this)
        });
        switch (this.opts.showOn) {
          case 'hover':
            if (this.opts.alignTo == 'cursor')
              this.$elm.bind('mousemove.ttip', $.proxy(this.mousemove, this));
            if (this.opts.allowTipHover)
              this.$tip.hover($.proxy(this.clearTimeouts, this), $.proxy(this.mouseleave, this));
            break;
          case 'focus':
            this.$elm.bind({
              'focus.ttip': $.proxy(this.show, this),
              'blur.ttip': $.proxy(this.hide, this)
            });
            break;
        }
      }
    },
    mouseenter: function(e) {
      if (this.disabled)
        return true;

      if (this.opts.showOn == 'focus')
        return true;

      this.clearTimeouts();
      this.showTimeout = setTimeout($.proxy(this.show, this), this.opts.showTimeout);
    },
    mouseleave: function(e) {
      if (this.disabled || this.asyncAnimating && (this.$tip[0] === e.relatedTarget || jQuery.contains(this.$tip[0], e.relatedTarget)))
        return true;

      if (this.opts.showOn == 'focus')
        return true;

      this.clearTimeouts();
      this.hideTimeout = setTimeout($.proxy(this.hide, this), this.opts.hideTimeout);
    },
    mousemove: function(e) {
      if (this.disabled)
        return true;

      this.eventX = e.pageX;
      this.eventY = e.pageY;
      if (this.opts.followCursor && this.$tip.data('active')) {
        this.calcPos();
        this.$tip.css({left: this.pos.l, top: this.pos.t});
        //if (this.pos.arrow)
          //this.$arrow[0].className = 'tip-arrow tip-arrow-' + this.pos.arrow;
      }
    },
    show: function() {
      if (this.disabled || this.$tip.data('active'))
        return;

      this.reset();
      this.update();
      this.display();
      if (this.opts.timeOnScreen)
        setTimeout($.proxy(this.hide, this), this.opts.timeOnScreen);
    },
    hide: function() {
      if (this.disabled || !this.$tip.data('active'))
        return;

      this.display(true);
    },
    reset: function() {
      this.$tip.queue([]).detach().css('visibility', 'hidden').data('active', false);
      //this.$inner.find('*').ttip('hide');
      if (this.opts.fade)
        this.$tip.css('opacity', this.opacity);
      //this.$arrow[0].className = 'tip-arrow tip-arrow-top tip-arrow-right tip-arrow-bottom tip-arrow-left';
      this.asyncAnimating = false;
    },
    
    update: function(content, dontOverwriteOption) {
      
      if (this.disabled)
        return;

      var async = content !== undefined;
      if (async) {
        if (!dontOverwriteOption)
          this.opts.content = content;
        if (!this.$tip.data('active'))
          return;
      } else {
        content = this.opts.content;
      }

      // update content only if it has been changed since last time
      var self = this,
        newContent = typeof content == 'function' ?
          content.call(this.$elm[0], function(newContent) {
            self.update(newContent);
          }) :
          content == '[title]' ? this.$elm.data('title.ttip') : content;
      if (this.content !== newContent) {
        this.$inner.empty().append(newContent);
        this.content = newContent;
      }
      
      this.refresh(async);
    },
    
    refresh: function(async) {
      if (this.disabled)
        return;

      if (async) {
        if (!this.$tip.data('active'))
          return;
        // save current position as we will need to animate
        var currPos = {left: this.$tip.css('left'), top: this.$tip.css('top')};
      }

      // reset position to avoid text wrapping, etc.
      this.$tip.css({left: 0, top: 0}).appendTo(document.body);

      // save default opacity
      if (this.opacity === undefined)
        this.opacity = this.$tip.css('opacity');

      // check for images - this code is here (i.e. executed each time we show the tip and not on init) due to some browser inconsistencies
      //arrow = this.$arrow.css('background-image').match(reBgImage);
      /*
      // IE arrow fixes
      if (arrow && !$.support.opacity) {
        // disable arrow in IE6 if using a PNG
        if (ie6 && rePNG.test(arrow[1])) {
          arrow = false;
          this.$arrow.css('background-image', 'none');
        }
        // disable fade effect in IE due to Alpha filter + translucent PNG issue
        this.opts.fade = false;
      }
      */

      this.tipOuterW = this.$tip.outerWidth();
      this.tipOuterH = this.$tip.outerHeight();

      this.calcPos();
      /*
      // position and show the arrow image
      if (arrow && this.pos.arrow) {
        this.$arrow[0].className = 'tip-arrow tip-arrow-' + this.pos.arrow;
        this.$arrow.css('visibility', 'inherit');
      }
      */
      if (async) {
        this.asyncAnimating = true;
        var self = this;
        this.$tip.css(currPos).animate({left: this.pos.l, top: this.pos.t}, 200, function() { self.asyncAnimating = false; });
      } else {
        this.$tip.css({left: this.pos.l, top: this.pos.t});
      }
    },
    display: function(hide) {
      var active = this.$tip.data('active');
      if (active && !hide || !active && hide)
        return;

      this.$tip.stop();

      //if ((this.opts.slide && this.pos.arrow || this.opts.fade) && (hide && this.opts.hideAniDuration || !hide && this.opts.showAniDuration)) {
      if ((this.opts.slide || this.opts.fade) && (hide && this.opts.hideAniDuration || !hide && this.opts.showAniDuration)) {
        var from = {}, to = {};
        /*
        // this.pos.arrow is only undefined when alignX == alignY == 'center' and we don't need to slide in that rare case
        if (this.opts.slide && this.pos.arrow) {
          var prop, arr;
          if (this.pos.arrow == 'bottom' || this.pos.arrow == 'top') {
            prop = 'top';
            arr = 'bottom';
          } else {
            prop = 'left';
            arr = 'right';
          }
          var val = parseInt(this.$tip.css(prop));
          from[prop] = val + (hide ? 0 : (this.pos.arrow == arr ? -this.opts.slideOffset : this.opts.slideOffset));
          to[prop] = val + (hide ? (this.pos.arrow == arr ? this.opts.slideOffset : -this.opts.slideOffset) : 0) + 'px';
        }
        */
        if (this.opts.fade) {
          from.opacity = hide ? this.$tip.css('opacity') : 0;
          to.opacity = hide ? 0 : this.opacity;
        }
        //if (hide) this.$tip.children('iframe').css({display : 'none'})
        this.$tip.css(from).animate(to, this.opts[hide ? 'hideAniDuration' : 'showAniDuration'], $.proxy(function () {
          //if (hide) return;
          //this.$tip.children('iframe').css({display: 'block'});
        }, this));
      }
      hide ? this.$tip.queue($.proxy(this.reset, this)) : this.$tip.css('visibility', 'inherit');
      this.$tip.data('active', !active);
    },
    disable: function() {
      this.reset();
      this.disabled = true;
    },
    enable: function() {
      this.disabled = false;
    },
    destroy: function() {
      this.reset();
      this.$tip.remove();
      delete this.$tip;
      this.content = null;
      this.$elm.unbind('.ttip').removeData('ttip');
      tips.splice($.inArray(this, tips), 1);
    },
    clearTimeouts: function() {
      if (this.showTimeout) {
        clearTimeout(this.showTimeout);
        this.showTimeout = 0;
      }
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = 0;
      }
    },
    calcPos: function() {
      var pos = {l: 0, t: 0, arrow: ''},
        $win = $(window),
        win = {
          l: $win.scrollLeft(),
          t: $win.scrollTop(),
          w: $win.width(),
          h: $win.height()
        }, xL, xC, xR, yT, yC, yB;
      if (this.opts.alignTo == 'cursor') {
        xL = xC = xR = this.eventX;
        yT = yC = yB = this.eventY;
      } else { // this.opts.alignTo == 'target'
        var elmOffset = this.$elm.offset(),
          elm = {
            l: elmOffset.left,
            t: elmOffset.top,
            w: this.$elm.outerWidth(),
            h: this.$elm.outerHeight()
          };
        xL = elm.l + (this.opts.alignX != 'inner-right' ? 0 : elm.w); // left edge
        xC = xL + Math.floor(elm.w / 2);        // h center
        xR = xL + (this.opts.alignX != 'inner-left' ? elm.w : 0); // right edge
        yT = elm.t + (this.opts.alignY != 'inner-bottom' ? 0 : elm.h);  // top edge
        yC = yT + Math.floor(elm.h / 2);        // v center
        yB = yT + (this.opts.alignY != 'inner-top' ? elm.h : 0);  // bottom edge
      }

      // keep in viewport and calc arrow position
      switch (this.opts.alignX) {
        case 'right':
        case 'inner-left':
          pos.l = xR + this.opts.offsetX;
          if (pos.l + this.tipOuterW > win.l + win.w)
            pos.l = win.l + win.w - this.tipOuterW;
          if (this.opts.alignX == 'right' || this.opts.alignY == 'center')
            pos.arrow = 'left';
          break;
        case 'center':
          pos.l = xC - Math.floor(this.tipOuterW / 2);
          if (pos.l + this.tipOuterW > win.l + win.w)
            pos.l = win.l + win.w - this.tipOuterW;
          else if (pos.l < win.l)
            pos.l = win.l;
          break;
        default: // 'left' || 'inner-right'
          pos.l = xL - this.tipOuterW - this.opts.offsetX;
          if (pos.l < win.l)
            pos.l = win.l;
          if (this.opts.alignX == 'left' || this.opts.alignY == 'center')
            pos.arrow = 'right';
      }
      switch (this.opts.alignY) {
        case 'bottom':
        case 'inner-top':
          pos.t = yB + this.opts.offsetY;
          // 'left' and 'right' need priority for 'target'
          if (!pos.arrow || this.opts.alignTo == 'cursor')
            pos.arrow = 'top';
          if (pos.t + this.tipOuterH > win.t + win.h) {
            pos.t = yT - this.tipOuterH - this.opts.offsetY;
            if (pos.arrow == 'top')
              pos.arrow = 'bottom';
          }
          break;
        case 'center':
          pos.t = yC - Math.floor(this.tipOuterH / 2);
          if (pos.t + this.tipOuterH > win.t + win.h)
            pos.t = win.t + win.h - this.tipOuterH;
          else if (pos.t < win.t)
            pos.t = win.t;
          break;
        default: // 'top' || 'inner-bottom'
          pos.t = yT - this.tipOuterH - this.opts.offsetY;
          // 'left' and 'right' need priority for 'target'
          if (!pos.arrow || this.opts.alignTo == 'cursor')
            pos.arrow = 'bottom';
          if (pos.t < win.t) {
            pos.t = yB + this.opts.offsetY;
            if (pos.arrow == 'bottom')
              pos.arrow = 'top';
          }
      }
      this.pos = pos;
    }
  };

  $.fn.ttip = function(options) {
    if (typeof options == 'string') {
      var args = arguments,
        method = options;
      Array.prototype.shift.call(args);
      // unhook live events if 'destroy' is called
      if (method == 'destroy')
        this.die('mouseenter.ttip').die('focus.ttip');
      return this.each(function() {
        var ttip = $(this).data('ttip');
        if (ttip && ttip[method])
          ttip[method].apply(ttip, args);
      });
    }

    var opts = $.extend({}, $.fn.ttip.defaults, options);

    // generate CSS for this tip class if not already generated
    if (!$('#ttip-css-' + opts.className)[0])
      $(['<style id="ttip-css-',opts.className,'" type="text/css">',
        'div.',opts.className,'{visibility:hidden;position:absolute;top:0;left:0;}',
        //'div.',opts.className,' table, div.',opts.className,' td{margin:0;font-family:inherit;font-size:inherit;font-weight:inherit;font-style:inherit;font-variant:inherit;}',
        //'div.',opts.className,' td.tip-bg-image span{display:block;font:1px/1px sans-serif;height:',opts.bgImageFrameSize,'px;width:',opts.bgImageFrameSize,'px;overflow:hidden;}',
        //'div.',opts.className,' td.tip-right{background-position:100% 0;}',
        //'div.',opts.className,' td.tip-bottom{background-position:100% 100%;}',
        //'div.',opts.className,' td.tip-left{background-position:0 100%;}',
        //'div.',opts.className,' div.tip-inner{background-position:-',opts.bgImageFrameSize,'px -',opts.bgImageFrameSize,'px;}',
        'div.',opts.className,' div.tip-arrow{visibility:hidden;position:absolute;overflow:hidden;font:1px/1px sans-serif;}',
      '</style>'].join('')).appendTo('head');

    // check if we need to hook live events
    if (opts.liveEvents && opts.showOn != 'none') {
      var deadOpts = $.extend({}, opts, { liveEvents: false });
      switch (opts.showOn) {
        case 'hover':
          this.live('mouseenter.ttip', function() {
            var $this = $(this);
            if (!$this.data('ttip'))
              $this.ttip(deadOpts).ttip('mouseenter');
          });
          break;
        case 'focus':
          this.live('focus.ttip', function() {
            var $this = $(this);
            if (!$this.data('ttip'))
              $this.ttip(deadOpts).ttip('show');
          });
          break;
      }
      return this;
    }

    return this.each(function() {
      new $.Ttip(this, opts);
    });
  }

  // default settings
  $.fn.ttip.defaults = {
    className:    'tip-yellow', // class for the tips
    bgImageFrameSize: 10,   // size in pixels for the background-image (if set in CSS) frame around the inner content of the tip
    showTimeout:    500,    // timeout before showing the tip (in milliseconds 1000 == 1 second)
    hideTimeout:    100,    // timeout before hiding the tip
    timeOnScreen:   0,    // timeout before automatically hiding the tip after showing it (set to > 0 in order to activate)
    showOn:     'hover',  // handler for showing the tip ('hover', 'focus', 'none') - use 'none' to trigger it manually
    liveEvents:   false,    // use live events
    alignTo:    'cursor', // align/position the tip relative to ('cursor', 'target')
    alignX:     'right',  // horizontal alignment for the tip relative to the mouse cursor or the target element
              // ('right', 'center', 'left', 'inner-left', 'inner-right') - 'inner-*' matter if alignTo:'target'
    alignY:     'top',    // vertical alignment for the tip relative to the mouse cursor or the target element
              // ('bottom', 'center', 'top', 'inner-bottom', 'inner-top') - 'inner-*' matter if alignTo:'target'
    offsetX:    -22,    // offset X pixels from the default position - doesn't matter if alignX:'center'
    offsetY:    18,   // offset Y pixels from the default position - doesn't matter if alignY:'center'
    allowTipHover:    true,   // allow hovering the tip without hiding it onmouseout of the target - matters only if showOn:'hover'
    followCursor:   false,    // if the tip should follow the cursor - matters only if showOn:'hover' and alignTo:'cursor'
    fade:       true,   // use fade animation
    slide:      true,   // use slide animation
    slideOffset:    8,    // slide animation offset
    showAniDuration:  300,    // show animation duration - set to 0 if you don't want show animation
    hideAniDuration:  300   // hide animation duration - set to 0 if you don't want hide animation
  };

})(jQuery);