(function(angular, undefined) {
  angular.module("healthStarsApp.constants", [])

.constant("APP_CONFIG", {
	"userRoles": [
		"user",
		"admin"
	],
	"baseUrl": "http://ec2-35-157-136-123.eu-central-1.compute.amazonaws.com/",
	"socketUrl": "http://ec2-35-157-136-123.eu-central-1.compute.amazonaws.com:9000/",
	"apiVer": "v1",
	"apiKey": {
		"google": "AIzaSyCdqpWKP40L13Nzi_dt_iNiXYCsZ98Rp38",
		"weather": "248a4c6336acbc3b8738d521ab7de09d",
		"fbAppId": "1564026697235598",
		"twAppId": "NBwHIfLe0uEq8X9DsZpXptAtT",
		"ggAppId": "415481653468-jnu548h7uhjeditfm1bqb1hb23fqosoc.apps.googleusercontent.com",
		"hotmailId": "8d9ca6b9-d2f8-4afd-9274-557e4ca4aab5",
		"hotmailCallbackUrl": "http://ec2-35-157-136-123.eu-central-1.compute.amazonaws.com/profile/"
	}
})

;
})(angular);