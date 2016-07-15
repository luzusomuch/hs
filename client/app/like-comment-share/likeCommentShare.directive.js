'use strict';

angular.module('healthStarsApp').directive('likeCommentShare', () => ({
  restrict: 'E',
  scope: {
  	data: '=',
    type: '@',
    eventOwner: '='
  },
  controller: 'likeCommentShareCtrl',
  controllerAs: 'vm',
  bindToController: true,
  templateUrl: 'app/like-comment-share/view.html'
}));

class likeCommentShareCtrl {
  constructor(LikeService, CommentService, ShareService, $localStorage, $q, $timeout) {
  	this.LikeService = LikeService;
  	this.CommentService = CommentService;
    this.ShareService = ShareService;
  	LikeService.checkLiked(this.data._id, this.type).then(resp => {
  		this.data.liked = resp.data.liked;
  	});
    ShareService.checkShared(this.data._id, this.type).then(resp => {
      this.data.shared = resp.data.shared;
    });
  	this.comment = {};
  	this.authUser = $localStorage.authUser;
    this.$q = $q;

    if (this.type==='Photo') {
      $timeout(() => {
        this.data.showComment = true;
        this.loadComment(this.data, 'Photo', {pageSize: 5});
      }, 500)
    }
  }

  like(object, type) {
    let data = (object && type) ? object : this.data;
    data.type = (object && type) ? type : this.type;

  	this.LikeService.likeOrDislike(data._id, data.type).then(resp => {
  		data.liked = resp.data.liked;
  		if (data.liked) {
				data.totalLike = (data.totalLike) ? data.totalLike + 1 : 1;
			} else {
				data.totalLike = data.totalLike -1;
			}
  	}).catch(err => {
  		console.log(err);
  	});
  }

  loadComment(data, type, params) {
    this.CommentService.getListComments(data._id, type, params).then(resp => {
      let likePromise = [];
      let sharePromise = [];

      _.each(resp.data.comments, (comment) => {
        likePromise.push(this.LikeService.checkLiked(comment._id, 'Comment'));
        sharePromise.push(this.ShareService.checkShared(comment._id, 'Comment'));
      });
      // check all comment liked or not
      this.$q.all(likePromise).then(checked => {
        _.each(resp.data.comments, (comment, index) => {
          comment.liked = checked[index].data.liked;
        });
        // Check shared or not
        this.$q.all(sharePromise).then(checked => {
          _.each(resp.data.comments, (comment, index) => {
            comment.shared = checked[index].data.shared;
          });
          
          data.comments = (data.comments) ? data.comments.concat(resp.data.comments) : resp.data.comments;
          data.comments = _.uniq(data.comments, '_id');
          data.comments.sort((a,b) => {
            if (a.createdAt < b.createdAt) {
              return -1;
            }
            if (a.createdAt > b.createdAt) {
              return 1
            }
            return 0
          });
          data.pageSize = resp.data.totalItem;
          data.page +=1;
        });
      });
    });
  }

  loadMore(comment) {
    let data = (comment) ? comment : this.data;
    data.type = (comment) ? 'Comment' : this.type;
    this.loadComment(data, data.type, {page: data.page});
  }

  showComments(comment) {
    let data = (comment) ? comment : this.data;
    data.type = (comment) ? 'Comment' : this.type;
    data.page = (data.page) ? data.page : 1;
  	data.showComment = !data.showComment;
  	if (data.showComment && !data.blocked) {
      this.loadComment(data, data.type, {page: data.page});
  	}
  }

  postComment(comment, parentComment) {
    if (parentComment && parentComment.blocked) {
      return console.log('This comment has been blocked');
      // TODO show error
    }
  	if (comment && comment.content.trim().length > 0) {
  		comment.objectId = (parentComment) ? parentComment._id : this.data._id;
  		comment.objectName = (parentComment) ? 'Comment' : this.type;
  		this.CommentService.create(comment).then(resp => {
        comment.content = null;
  			$('#reply-textarea').css('height', '43px');
        let data = (parentComment) ? parentComment : this.data;
  			data.comments.push(resp.data);
  			data.totalComment = (data.totalComment) ? data.totalComment+=1 : 1;
        data.pageSize +=1;
  		}).catch(err => {
  			console.log(err);
  		});
  	} else {
  		// TODO show error when enter empty content
  	}
  }

  editComment(comment) {
    if (comment.content.trim().length > 0 && !comment.deleted && (comment.ownerId._id===this.authUser._id || this.eventOwner._id===this.authUser._id)) {
      this.CommentService.update(comment._id, comment.content).then(() => {
        comment.isEdit = false;
      }).catch(err => {
        console.log(err);
        // TODO show error
      });
    } else {
      // TODO show error
    }
  }

  deleteComment(comment) {
    comment.showOption = false;
    if (this.authUser._id===comment.ownerId._id || this.authUser._id===this.eventOwner._id || this.authUser._id===this.eventOwner) {
      this.CommentService.delete(comment._id).then(() => {
        comment.deleted = true;
      }).catch(err => {
        console.log(err);
        // TODO show error 
      });
    } else {
      // TODO - show error
    }
  }

  blockComment(comment) {
    this.CommentService.block(comment._id).then(() => {
      comment.blocked = !comment.blocked;
    }).catch(err => {
      console.log(err);
      // TODO show error;
    });
  }

  // share(object, type) {
  //   let data = (object && type) ? object : this.data;
  //   data.type = (object && type) ? type : this.type;

  //   this.ShareService.share(data._id, data.type).then(resp => {
  //     data.shared = resp.data.shared;
  //     data.totalShare = (data.totalShare) ? data.totalShare+=1 : 1;
  //   }).catch(err => {
  //     console.log(err);
  //     // TODO show error;
  //   });
  // }
}

angular.module('healthStarsApp').controller('likeCommentShareCtrl', likeCommentShareCtrl);