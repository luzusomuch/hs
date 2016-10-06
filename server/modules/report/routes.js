import Joi from 'joi';
import async from 'async';
import _ from 'lodash';

module.exports = function(kernel) {
  /*Create new report*/
	kernel.app.post('/api/v1/reports', kernel.middleware.isAuthenticated(), (req, res) => {
		if (req.user.deleted && req.user.deleted.status) {
      return res.status(403).json({type: 'EMAIL_DELETED', message: 'This user email was deleted'});
    }
    if (req.user.blocked && req.user.blocked.status) {
      return res.status(403).json({type: 'EMAIL_BLOCKED', message: 'This user email was blocked'}); 
    }
		let data = req.body;
		data.reporterId = req.user._id;

		var schema = Joi.object().keys({
      description: Joi.string().required().options({
        language: {
          key: 'description'
        }
      }),
      type: Joi.string().required().options({
        language: {
          key: 'type'
        }
      }),
      reportedItemId: Joi.string().required().options({
        language: {
          key: 'reportedItemId'
        }
      })
    });
    
    var result = Joi.validate(data, schema, {
      stripUnknown: true,
      abortEarly: false,
      allowUnknown: true
    });

    if (result.error) {
      var errors = [];
      result.error.details.forEach(error => {
        var type;
        switch (error.type) {
          case 'string.description': 
            type = 'REPORT_DESCRIPTION_REQUIRED';
            break;
          case 'string.type':
            type = 'REPORT_TYPE_REQUIRED';
            break;
          case 'string.reportedItemId':
          	type = 'REPORT_ITEM_REQUIRED';
          	break;
          default:
            break;
        }
        errors.push({type: type, path: error.path, message: error.message});
      });
      return res.status(422).json(errors);
    }
    kernel.model.Report(data).save().then(saved => {
    	return res.status(200).end();
    }).catch(err => {
    	return res.status(500).json({type: 'SERVER_ERROR'});
    })
	});

  kernel.app.get('/api/v1/reports/search', kernel.middleware.hasRole('admin'), (req, res) => {
    kernel.model.Report.find({checked: (req.query.checked) ? true : false})
    .populate('reporterId', '-password -salt').exec().then(reports => {
      let results = [];
      async.each(reports, (report, callback) => {
        report = report.toJSON();
        kernel.model.Event.findById(report.reportedItemId).then(event => {
          report.event = (event) ? event : null;
          results.push(report);
          return callback(null);
        }).catch(callback);
      }, (err) => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR'});
        }
        let items = [];
        if (req.query.type && req.query.searchQuery) {
          _.each(results, (item) => {
            if (req.query.type==='reporterId.name' && item.reporterId) {
              if (item.reporterId && item.reporterId!==null && item.reporterId.name && item.reporterId.name.toLowerCase().indexOf(req.query.searchQuery.toLowerCase()) !== -1) {
                items.push(item);
              }
            } else if (req.query.type==='event.name') {
              if (item.event && item.event.name.toLowerCase().indexOf(req.query.searchQuery.toLowerCase()) !== -1) {
                items.push(item);
              }
            }
          });
        } else {
          items = results;
        }
        return res.status(200).json({items: items});
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /*get all reports for admin*/
  kernel.app.get('/api/v1/reports/all', kernel.middleware.hasRole('admin'), (req, res) => {
    let pageSize = req.query.pageSize || 3;
    let page = req.query.page || 1;
    kernel.model.Report.find({checked: false}).limit(Number(pageSize))
    .skip(pageSize * (page-1))
    .populate('reporterId', '-password -salt')
    .exec().then(reports => {
      kernel.model.Report.count({checked: false}).then(count => {
        let results = [];
        async.each(reports, (report, callback) => {
          let item = report.toJSON();
          if (report.type === 'User') {
            item.event = null;
            results.push(item);
            callback();
          } else {
            let eventId;
            async.parallel([
              (cb) => {
                if (report.type==='Event') {
                  eventId = report.reportedItemId;
                  cb(null);
                } else if (report.type==='Photo') {
                  async.waterfall([
                    (_cb) => {
                      kernel.model.Feed.findOne({photosId: report.reportedItemId}).then(feed => {
                        if (!feed) {
                          _cb(null, {eventId: null});
                        } else {
                          _cb(null, {eventId: feed.eventId});
                        }
                      }).catch(_cb);
                    },
                    (result, _cb) => {
                      if (result.eventId) {
                        _cb(null, result);
                      } else {
                        kernel.model.Event.findOne({photosId: report.reportedItemId}).then(event => {
                          if (!event) {
                            _cb({error: 'Event not found', code: 404});
                          } else {
                            _cb(null, {eventId: event._id});
                          }
                        }).catch(_cb);
                      }
                    }
                  ], (err, result) => {
                    if (err) {
                      return cb(err);
                    }
                    eventId = result.eventId;
                    cb(null);
                  });
                } else if (report.type==='Feed') {
                  kernel.model.Feed.findById(report.reportedItemId).then(feed => {
                    if (!feed) {
                      cb(null);
                    } else {
                      eventId = feed.eventId;
                      cb(null);
                    }
                  }).catch(cb);
                } else if (report.type==='Comment') {
                  cb(null);
                } else {
                  cb(null);
                }
              }
            ], (err) => {
              if (err) {
                results.push(item);
                return callback(err);
              }
              if (eventId) {
                kernel.model.Event.findById(eventId).then(event => {
                  item.event = (event) ? event : null;
                  results.push(item);
                  callback();
                }).catch(callback);
              } else {
                item.event = null;
                results.push(item);
                callback();
              }
            });
          }
        }, (err) => {
          if (err) {
            return res.status(500).json({type: 'SERVER_ERROR'});    
          }
          return res.status(200).json({items: results, totalItem: count});
        });
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});  
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });

  /*Mark report as checked*/
  kernel.app.put('/api/v1/reports/:id/checked', kernel.middleware.hasRole('admin'), (req, res) => {
    kernel.model.Report.findById(req.params.id).then(report => {
      if (!report) {
        return res.status(404).end();
      }
      report.checked = true;
      report.checkedBy = req.user._id;
      report.save().then(() => {
        return res.status(200).end();
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});  
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  });
};