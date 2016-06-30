import Joi from 'joi';
import _ from 'lodash';


module.exports = function(kernel) {
	/*
  Get all relation of selected user 
  */
  kernel.app.get('/api/v1/relations/:id/:type', (req, res) => {
    kernel.model.Relation.find({status: 'completed', type: req.params.type, fromUserId: req.params.id})
    .populate('toUserId', '-hashedPassword -salt')
    .exec().then(relations => {
    	var result = _.map(relations, (relation) => {
    		return relation.toUserId;
    	});
      return res.status(200).json({relations: result, totalItem: result.length});
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
};