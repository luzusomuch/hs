(function(angular, undefined) {
  angular.module("healthStarsApp.constants", [])

.constant("APP_CONFIG", {
	"userRoles": [
		"user",
		"admin"
	],
	"baseUrl": "http://ec2-35-163-48-227.us-west-2.compute.amazonaws.com/",
	"socketUrl": "http://ec2-35-163-48-227.us-west-2.compute.amazonaws.com:9000/",
	"apiVer": "v1",
	"apiKey": {
		"google": "AIzaSyCdqpWKP40L13Nzi_dt_iNiXYCsZ98Rp38",
		"weather": "d6ce4efe26d8a70511337db70401d39c",
		"fbAppId": "1564026697235598",
		"twAppId": "NBwHIfLe0uEq8X9DsZpXptAtT",
		"ggAppId": "415481653468-jnu548h7uhjeditfm1bqb1hb23fqosoc.apps.googleusercontent.com",
		"hotmailId": "8d9ca6b9-d2f8-4afd-9274-557e4ca4aab5",
		"hotmailCallbackUrl": "http://ec2-35-163-48-227.us-west-2.compute.amazonaws.com/profile/"
	}
})

;
})(angular);