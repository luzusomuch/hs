import Joi from 'joi';
import _ from 'lodash';


module.exports = function(kernel) {
	/*
  Get all relation of selected user 
  */
  kernel.app.get('/api/v1/relations/:id/:type', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Relation.find({status: 'completed', type: req.params.type, $or: [{fromUserId: req.params.id}, {toUserId: req.params.id}]})
    .populate('toUserId', '-hashedPassword -salt')
    .exec().then(relations => {
    	var result = _.map(relations, (relation) => {
    		return relation.toUserId;
    	});
      return res.status(200).json({items: result, totalItem: result.length});
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /*Create new relation*/
  kernel.app.post('/api/v1/relations', kernel.middleware.isAuthenticated(), (req, res) => {
    if (!req.body.userId || !req.body.type) {
      return res.status(422).end();
    }
    kernel.model.User.findById(req.body.userId).then(user => {
      if (!user) {
        return res.status(404).end();
      }
      let availableType = ['friend', 'follow'];
      if (availableType.indexOf(req.body.type) !== -1) {
        kernel.model.Relation.findOne({
          type: req.body.type, 
          $or: [{
            fromUserId: req.body.userId, 
            toUserId: req.user._id
          }, {
            fromUserId: req.user._id, 
            toUserId: req.body.userId
          }]
        }).then(relation => {
          if (!relation) {
            kernel.model.Relation({
              fromUserId: req.user._id,
              toUserId: req.body.userId,
              type: req.body.type,
              status: (req.body.type==='follow') ? 'completed' : 'pending'
            }).save().then(saved => {
              return res.status(200).json({type: saved.status});
            }).catch(err => {
              return res.status(500).json({type: 'SERVER_ERROR'});    
            });
          } else if (relation.status==='pending') {
            return res.status(200).json({type: relation.status});
          } else {
            relation.remove().then(() => {
              return res.status(200).json({type: 'none'});
            }).catch(err => {
              return res.status(500).json({type: 'SERVER_ERROR'});    
            });
          }
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});    
        });
      } else {
        return res.status(404).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
};