(function(angular, undefined) {
  angular.module("healthStarsApp.constants", [])

.constant("APP_CONFIG", {
	"userRoles": [
		"guest",
		"user",
		"admin"
	],
	"baseUrl": "http://ec2-52-41-38-203.us-west-2.compute.amazonaws.com/",
	"socketUrl": "http://52.41.38.203:9000/",
	"apiVer": "v1",
	"apiKey": {
		"google": "AIzaSyCdqpWKP40L13Nzi_dt_iNiXYCsZ98Rp38",
		"weather": "d6ce4efe26d8a70511337db70401d39c",
		"fbAppId": "1564026697235598",
		"twAppId": "NBwHIfLe0uEq8X9DsZpXptAtT",
		"ggAppId": "825525519990-0uf8b2cs1i4alptais0nk53pmajpdtnr.apps.googleusercontent.com",
		"hotmailId": "8d9ca6b9-d2f8-4afd-9274-557e4ca4aab5",
		"hotmailCallbackUrl": "http://ec2-52-41-38-203.us-west-2.compute.amazonaws.com/api/v1/users/hotmail-contacts"
	}
})

;
})(angular);