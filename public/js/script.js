$('.alert .close').live('click', function () {
  $(this).parent().fadeOut(500, function () {
    $(this).remove();
  });
  return false;
});

function createFlashMsgHtml(data) {
  return '<div ' + (data.guid ? 'id="fm-' + data.guid +'"' : '') +
    'class="alert alert-' + data.type + '">' +
    data.msg +
    '<a class="close" data-dismiss="alert" href="#">&times;</a></div>';
}

$('.form-contact').submit(function (e) {
  var f = $(this);
  $.post(f.attr('action'), f.serialize(), function (data) {
    if (data.flash)
      showFlashMsgs(data.flash);

    if (data.flash && data.flash.error)
      return;

    f.get(0).reset();
  });
  return false;
});

var eshq = new ESHQ('messages');
eshq.onmessage = function(e) {
  $('#flashmsgs').append(createFlashMsgHtml({type: 'info', msg: e.data}));
  console.info('info', e.data);
};
eshq.addEventListener('error', function(e) {
  $('#flashmsgs').append(createFlashMsgHtml({type: 'error', msg: e.data}));
  console.error('error', e.data);
});
eshq.addEventListener('success', function(e) {
  $('#flashmsgs').append(createFlashMsgHtml({type: 'success', msg: e.data}));
  console.info('success', e.data);
});
