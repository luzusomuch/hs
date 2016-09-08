'use strict';

class AboutCtrl {
  	constructor(about) {
    	this.about = about;
 	}
}

angular.module('healthStarsApp').controller('AboutCtrl', AboutCtrl);