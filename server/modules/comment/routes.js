import Joi from 'joi';
import async from 'async';

module.exports = function(kernel) {
  /**
   * Create new comment
   */
  kernel.app.post('/api/v1/comments', kernel.middleware.isAuthenticated(), (req, res) => {
    var data = {
      objectName: req.body.objectName,
      objectId: req.body.objectId,
      content: req.body.content
    };
    var schema = Joi.object().keys({ 
      objectId: Joi.string().required(),
      objectName: Joi.string().required(),
      content: Joi.string().min(kernel.config.COMMENT_VALIDATORS.minLength).required()
    });
    var result = Joi.validate(data, schema);
    if (result.error) {
      return res.status(422).json(kernel.errorsHandler.parseError(result.error));
    }

    async.parallel([
      (cb) => {
        if (req.body.objectName.toLowerCase()==="comment" && req.body.isSubComment) {
          kernel.model.Comment.findById(req.body.objectId).then(comment => {
            if (!comment) {
              cb({message: 'Comment not found'});
            }
            if (!comment.isSubComment) {
              cb(null, {allowCreate: true});
            } else {
              cb(null, {allowCreate: false});
            }
          }).catch(error => {
            cb(error);
          });
        } else {
          cb(null, {allowCreate: true});
        }
      }
    ], function(error, result) {
      if (error) {
        return res.status(500).json(error);
      }
      if (!result[0].allowCreate) {
        return res.status(500).json({message: 'New comment is not valid'});
      }

      kernel.module.Comment.attachModel(req.body.objectName);

      data.ownerId = req.user._id;
      if (req.body.isSubComment) {
        data.isSubComment = true;
      }
      let model = new kernel.model.Comment(data);
      model.save().then(comment => {
        return res.status(200).json(comment);
      }).catch(err => {
        return res.status(500).json(err);
      });
    });
  });
  
  /**
   * Get list comment parameter objectId, objectName
   */
  kernel.app.get('/api/v1/comments/:objectId/:objectName', (req, res) => {
    var result = [];
    var page = req.query.page || 1;
    var pageSize = req.query.pagesize || kernel.config.COMMENT_PAGE_SIZE;
    var isSubComment = req.query.isSubComment || false;
    kernel.model.Comment.find({objectId:req.params.objectId,objectName:req.params.objectName, isSubComment: isSubComment}) 
    .populate('ownerId', '-hashedPassword - salt')
    .limit(Number(pageSize))
    .skip(pageSize * (page-1))
    .exec()
    .then(comments => {
      return res.status(200).json({comments: comments, totalItem: comments.length});
    }).catch(err => {
      return res.status(500).json(err);
    });
  });
  
  /**
   * Update comment parameter id 
   */
  kernel.app.put('/api/v1/comments/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    var schema = Joi.object().keys({ 
      content: Joi.string().min(kernel.config.COMMENT_VALIDATORS.minLength).required()
    });
    var result = Joi.validate(req.body, schema);
    if (result.error) {
      return res.status(422).json(kernel.errorsHandler.parseError(result.error));
    }

    kernel.model.Comment.findOne({_id: req.params.id, ownerId: req.user._id})
    .then(comment =>{
      if (!comment){
        return res.status(404).json({message: 'Comment not found'});
      }
      if (comment.deleted) {
        return res.status(422).json({message: 'This comment was deleted'});
      }
      comment.content = req.body.content;
      comment.save().then(updated =>{
        return res.status(200).json(updated);
      });
    }).catch(err => {
      return res.status(500).json(err);
    });
  });
  
  /**
   * Check user comment exists
   */
  kernel.app.get('/api/v1/comments/:objectId/:objectName/check', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Comment.findOne({ objectId: req.params.objectId, objectName:req.params.objectName, ownerId: req.user._id})
    .then(comment =>{
      if (!comment) {
        return res.status(200).json({existed:false});
      } else {
        return res.status(200).json({existed:true});
      }
    }).catch(err => {
      return res.status(500).json(err);
    });
  });
  
  /**
   * Delete comment parameter id 
   */
  kernel.app.delete('/api/v1/comments/:id', kernel.middleware.isAuthenticated(), (req, res) => {
    kernel.model.Comment.findById(req.params.id).then(comment =>{
      if (comment.ownerId.toString() === req.user._id.toString() || req.user.role === 'admin'){
        comment.deleted = true;
        comment.deletedByUserId = req.user._id;
        // we not delete the comment. We just update status of the comment
        comment.save().then(() => {
          return res.status(200).end();
        }).catch(err => {
          return res.status(500).json(err);
        });
      } else {
        return res.status(403).end();
      }
    }).catch(err => {
      return res.status(500).json(err);
    });
  });
};
