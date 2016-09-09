/**
 * GET /
 */
exports.index = function(req, res) {
  res.render('splash', {
    title: 'Splash'
  });
};