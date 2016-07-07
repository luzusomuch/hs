'use strict';

angular.module('healthStarsApp').directive('likeCommentShare', () => ({
  restrict: 'E',
  scope: {
  	data: '=',
    type: '@'
  },
  controller: 'likeCommentShareCtrl',
  controllerAs: 'vm',
  bindToController: true,
  templateUrl: 'directives/like-comment-share/view.html'
}));

class likeCommentShareCtrl {
  constructor(LikeService, CommentService, $localStorage) {
  	this.LikeService = LikeService;
  	this.CommentService = CommentService;
  	LikeService.checkLiked(this.data._id, this.type).then(resp => {
  		this.data.liked = resp.data.liked;
  	});
  	this.pageSize = 3;
  	this.comment = {};
  	this.authUser = $localStorage.authUser;
  }

  like() {
  	this.LikeService.likeOrDislike(this.data._id, this.type).then(resp => {
  		this.data.liked = resp.data.liked;
  		if (this.data.liked) {
				this.data.totalLike = (this.data.totalLike) ? this.data.totalLike + 1 : 1;
			} else {
				this.data.totalLike = this.data.totalLike -1;
			}
  	}).catch(err => {
  		console.log(err);
  	});
  }

  showComments() {
  	this.data.showComment = !this.data.showComment;
  	if (this.data.showComment) {
  		this.CommentService.getListComments(this.data._id, this.type).then(resp => {
  			this.data.comments = resp.data.comments;
  			this.pageSize = resp.data.totalItem;
  		});
  	}
  }

  postComment(comment) {
  	if (comment && comment.content.trim().length > 0) {
  		comment.objectId = this.data._id;
  		comment.objectName = this.type;
  		this.CommentService.create(comment).then(resp => {
  			this.comment = {};
  			$('#reply-textarea').css('height', '43px');
  			this.data.comments.push(resp.data);
  			this.data.totalComment = (this.data.totalComment) ? this.data.totalComment+=1 : 1;
  		}).catch(err => {
  			console.log(err);
  		});
  	} else {
  		// TODO show error when enter empty content
  	}
  }
}

angular.module('healthStarsApp').controller('likeCommentShareCtrl', likeCommentShareCtrl);