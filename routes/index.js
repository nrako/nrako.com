
exports.index = function(req, res) {
  res.render('index', { title: 'nrako.com' });
};

exports.contact = function(req, res) {
  if (!req.form.isValid)
    return;

  var eshq = global.eshq,
      sendgrid = global.sendgrid,
      emptyCb = function () {};

  eshq.send({
    channel: 'messages',
    data: 'Message received, confirmation to come in a few seconds...'
  }, emptyCb);

  sendgrid.send({
    to:       process.env.EMAIL || 'contact@nrako.com',
    from:     req.form.email,
    subject:  req.form.headline,
    text:     req.form.msg
  }, function(success, message) {
    if (!success) {
      eshq.send({
        channel: 'messages',
        data: 'Oups! Something went wrong. Please try again.',
        name   : 'error'
      }, emptyCb);
    } else {
      eshq.send({
        channel: 'messages',
        data: 'Your email has been sent with success!',
        name   : 'success'
      }, emptyCb);
    }
  });

  res.format({
    json: function() {
      res.json({success: true});
    },
    html: function() {
      res.render('index', { title: 'nrako.com' });
    }
  });
};