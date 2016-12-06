import countryjs from 'countryjs';

module.exports = function(kernel) {
	kernel.app.get('/api/v1/countries/currency', (req, res) => {
		if (!req.query.countryCode) {
			return res.status(422).json({message: 'Missing country code entity'});
		}
		return res.status(500).send({currencies: countryjs.currencies(req.query.countryCode)});
  });
};