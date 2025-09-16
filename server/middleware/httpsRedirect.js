const httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) 
{
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
};

module.exports = httpsRedirect;