(function(angular, undefined) {
  angular.module("healthStarsApp.constants", [])

.constant("APP_CONFIG", {
	"userRoles": [
		"user",
		"admin"
	],
	"baseUrl": "https://healthstars.de/",
	"socketUrl": "https://healthstars.de/",
	"APIConnection": "http://35.157.226.188/",
	"apiVer": "v1",
	"apiKey": {
		"google": "AIzaSyCdqpWKP40L13Nzi_dt_iNiXYCsZ98Rp38",
		"weather": "248a4c6336acbc3b8738d521ab7de09d",
		"fbAppId": "1564026697235598",
		"twAppId": "gcSqXze6lyyyomv2j9dlUGI61",
		"ggAppId": "415481653468-jnu548h7uhjeditfm1bqb1hb23fqosoc.apps.googleusercontent.com",
		"hotmailId": "8d9ca6b9-d2f8-4afd-9274-557e4ca4aab5",
		"hotmailCallbackUrl": "https://healthstars.de/profile/"
	}
})

;
})(angular);