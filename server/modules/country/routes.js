import countryjs from 'countryjs';

module.exports = function(kernel) {
	kernel.app.get('/api/v1/countries/currency', (req, res) => {
		if (!req.query.countryCode) {
			return res.status(422).json({message: 'Missing country code entity'});
		}
		if (req.query.countryCode==='GB') {
			return res.status(200).send({currencies: ['Pound', 'EUR']});
		}
		return res.status(200).send({currencies: countryjs.currencies(req.query.countryCode)});
  });
};