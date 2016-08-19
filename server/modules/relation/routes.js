import Joi from 'joi';
import _ from 'lodash';
import async from 'async';


module.exports = function(kernel) {
	/*
  Get all relation of selected user 
  */
  kernel.app.get('/api/v1/relations/:id/:type', kernel.middleware.isAuthenticated(), (req, res) => {
    let page = req.query.page || 1;
    let pageSize = req.query.pageSize || 20;
    kernel.model.Relation.find({
      status: 'completed', 
      type: req.params.type, 
      $or: [{
        fromUserId: req.params.id
      }, {
        toUserId: req.params.id
      }]
    })
    .limit(Number(pageSize))
    .skip(pageSize * (page-1))
    .exec().then(relations => {
      let fromUserId = _.map(relations, 'fromUserId');
      let toUserId = _.map(relations, 'toUserId');
      let ids = _.union(fromUserId, toUserId);
      ids = _.map(_.groupBy(ids,function(doc){
        return doc;
      }),function(grouped){
        return grouped[0];
      });
      let index = _.findIndex(ids, (id) => {
        return id.toString()===req.user._id.toString();
      });
      if (index !== -1) {
        ids.splice(index, 1);
      }
      let results = [];
      async.each(ids, (id, callback) => {
        kernel.model.User.findById(id, '-password -salt')
        .populate('avatar')
        .exec().then(user => {
          if (!user) {
            callback(null);
          } else {
            results.push(user);
            callback(null);
          }
        }).catch(callback);
      }, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({type: 'SERVER_ERROR'});
        }
        kernel.model.Relation.count({
          status: 'completed', 
          type: req.params.type, 
          $or: [{
            fromUserId: req.params.id
          }, {
            toUserId: req.params.id
          }]
        }).then(count => {
          if (req.params.type==='friend') {
            kernel.model.User.findById(req.params.id).then(user => {
              if (!user) {
                return res.status(404).end();
              }
              if (user.notificationSetting && user.notificationSetting.isVisibleFriendsList && req.query.showFriend) {
                return res.status(200).json({items: [], totalItem: 0});
              }
              return res.status(200).json({items: results, totalItem: count});  
            }).catch(err => {
              return res.status(500).json({type: 'SERVER_ERROR'});      
            });
          } else {
            return res.status(200).json({items: results, totalItem: count});
          }
        }).catch(err => {
          console.log(err);
          return res.status(500).json({type: 'SERVER_ERROR'});  
        });
      });
    }).catch(err => {
      console.log(err);
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

  /*Accept friend request*/
  kernel.app.put('/api/v1/relations/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    if (!req.body.status) {
      return res.status(422).end();
    }
    kernel.model.Relation.findById(req.params.id).then(relation => {
      if (!relation) {
        return res.status(404).end();
      }
      relation.status = req.body.status;
      relation.save().then(() => {
        return res.status(200).end();
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});  
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /*Reject friend request*/
  kernel.app.delete('/api/v1/relations/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Relation.findById(req.params.id).then(relation => {
      if (!relation) {
        return res.status(404).end();
      }
      let availableUser = [relation.fromUserId.toString(), relation.toUserId.toString()];
      if (availableUser.indexOf(req.user._id.toString()) !== -1) {
        relation.remove().then(() => {
          return res.status(200).end();
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});    
        });
      } else {
        return res.status(403).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /*Unfriend by user id and current user id*/
  kernel.app.delete('/api/v1/relations/:id/user', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Relation.findOne({
      type: 'friend', 
      $or: [{
        fromUserId: req.user._id, toUserId: req.params.id
      }, {
        fromUserId: req.params.id, toUserId: req.user._id
      }],
      status: 'completed'
    }).then(relation => {
      if (!relation) {
        return res.status(404).end();
      }
      let availableUser = [relation.fromUserId.toString(), relation.toUserId.toString()];
      if (availableUser.indexOf(req.user._id.toString()) !== -1) {
        relation.remove().then(() => {
          return res.status(200).end();
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});    
        });
      } else {
        return res.status(403).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
};