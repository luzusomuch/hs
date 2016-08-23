(function(angular, undefined) {
  angular.module("healthStarsApp.constants", [])

.constant("APP_CONFIG", {
	"userRoles": [
		"guest",
		"user",
		"admin"
	],
	"baseUrl": "http://localhost:9000/",
	"socketUrl": "http://localhost:9000/",
	"apiVer": "v1",
	"apiKey": {
		"google": "AIzaSyCdqpWKP40L13Nzi_dt_iNiXYCsZ98Rp38",
		"weather": "d6ce4efe26d8a70511337db70401d39c",
		"fbAppId": "1573466596291608",
		"twAppId": "Qd9Qf8FXDTf6qf2cRtQV8Kss2",
		"ggAppId": "415481653468-jnu548h7uhjeditfm1bqb1hb23fqosoc.apps.googleusercontent.com"
	}
})

;
})(angular);