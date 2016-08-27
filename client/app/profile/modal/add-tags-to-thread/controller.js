'use strict';

class AddTagsToThreadCtrl {
	constructor(tags, $uibModalInstance) {
		this.$uibModalInstance = $uibModalInstance;
		this.tags = tags;
	}

	addNewTags(tag) {
		if (tag && tag.trim().length > 0) {
			this.tags.push(tag);
			this.newTag = null;
		}
	}

	remove(index) {
		this.tags.splice(index, 1);
	}

	submit() {
		this.$uibModalInstance.close(this.tags);
	}

	close() {
		this.$uibModalInstance.dismiss();
	}
}

angular.module('healthStarsApp').controller('AddTagsToThreadCtrl', AddTagsToThreadCtrl);