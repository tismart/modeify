var log = require('log')('modal');
var modal = require('modal');
var scrollbarSize = require('scrollbar-size');
var view = require('view');

/**
 * Store the active modal
 */

var active = null;

/**
 * Events
 */

var events = ['showing', 'show', 'hiding', 'hide'];

/**
 * Expose `modal`
 */

module.exports = function(opts, fn) {
  var Modal = view(opts, fn);

  /**
   * Show Modal
   */

  Modal.prototype.show = function(fn) {
    log('showing modal');

    this.modal = active = modal(this.el).overlay();

    var view = this;
    events.forEach(function(e) {
      view.modal.on(e, function() {
        view.emit(e, arguments);
      });
    });

    if (opts.width) this.modal.el.style.maxWidth = opts.width;
    if (opts.closable) this.modal.closable();

    var el = this.modal.el;
    this.modal.show(function() {

      // Set the scrollbar size
      var div = el.querySelector('div');

      if (scrollbarSize > 0) {
        div.style.marginRight = -scrollbarSize + 'px';
        div.style.paddingRight = scrollbarSize + 'px';
      }

      // Wait until the modal is displayed before setting the height
      setTimeout(function() {
        var height = el.clientHeight;
        var offset = el.offsetTop;
        var windowHeight = window.innerHeight;

        if ((height + offset) > windowHeight)
          el.style.height = (windowHeight - offset) + 'px';
      }, 10);

      if (fn) fn();
    });
  };

  /**
   * Hide Modal
   */

  Modal.prototype.hide = function(e) {
    log('hiding modal');

    if (this.modal) this.modal.hide();

    active = null;
  };

  return Modal;
};

/**
 * Hide any active modal
 */

module.exports.hide = function(e) {
  if (active) active.hide(e);
};
