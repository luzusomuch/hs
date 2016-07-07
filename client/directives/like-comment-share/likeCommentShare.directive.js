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
  constructor(LikeService) {
  	this.LikeService = LikeService;
  	LikeService.checkLiked(this.data._id, this.type).then(resp => {
  		this.data.liked = resp.data.liked;
  	});
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
}

angular.module('healthStarsApp').controller('likeCommentShareCtrl', likeCommentShareCtrl);