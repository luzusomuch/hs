'use strict';

(function() {

  function CommentService($http) {
  	return {
  		create: (comment) => {
  			return $http.post('/api/v1/comments', comment);
  		},
  		update: (id, content) => {
  			return $http.put('/api/v1/comments/'+id, {content: content});
  		},
  		getListComments(id, type, params) {
  			return $http.get('/api/v1/comments/'+id+'/'+type, {params: params});
  		},
  		checkCommentatorExisted(id, type) {
  			return $http.get('/api/v1/comments/'+id+'/'+type+'/check');
  		},
      block(id) {
        return $http.put('/api/v1/comments/'+id+'/block');
      },
  		delete: (id) => {
  			return $http.delete('/api/v1/comments/'+id);
  		}
  	};
  }

  angular.module('healthStarsApp')
    .factory('CommentService', CommentService);
})();
