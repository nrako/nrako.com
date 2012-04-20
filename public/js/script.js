
$('#navbar').scrollspy();

var socket = io.connect(window.location.protocol + '//' + window.location.host);

$('.alert .close').live('click', function () {
  $(this).parent().fadeOut(500, function () {
    if ($(this).attr('id') != null) {
      socket.emit('closeflashmsg', $(this).attr('id'));
    }
    $(this).remove();
  });
  return false;
});

socket.on('message', function (data) {
  console.log('IO Message', data);
});

socket.on('flashmsg', function (data) {
  $('#flashmsgs').append(createFlashMsgHtml(data));
});

socket.on('closeflashmsg', function (flashMsgId) {
  $('#' + flashMsgId).remove();
});

function showFlashMsgs(data) {
  for (var type in data) {
    var html = '';
    $.each(data[type], function (i, msg) {
      html += createFlashMsgHtml({type: type, msg: msg});
    });
    
    $('#flashmsgs').append(html);
  }
}
function createFlashMsgHtml(data) {
  return '<div ' + (data.guid ? 'id="fm-' + data.guid +'"' : '') 
    + 'class="alert alert-' + data.type + '">' 
    + data.msg 
    + '<a class="close" data-dismiss="alert" href="#">&times;</a></div>';
}

$('.form-contact').submit(function (e) {
  var f = $(this);
  $.post(f.attr('action'), f.serialize(), function (data) {
    if (data.flash)
      showFlashMsgs(data.flash);
    else
    f.get(0).reset();
  });
  return false;
});

// google+ badge
window.___gcfg = {lang: 'en'};
(function() {var po = document.createElement("script");
  po.type = "text/javascript"; po.async = true;po.src = "https://apis.google.com/js/plusone.js";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(po, s);
})();

// twitter follow button
!function(d,s,id){
  var js,fjs=d.getElementsByTagName(s)[0];
  if(!d.getElementById(id)){
    js=d.createElement(s);
    js.id=id;
    js.src="//platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js,fjs);
  }
}(document,"script","twitter-wjs");