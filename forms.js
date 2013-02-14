var form = require('express-form'),
    field = form.field;

exports.contact = form(
  field('headline').trim().required(),
  field('msg').trim().required(),
  field('email').trim().isEmail().required()
);