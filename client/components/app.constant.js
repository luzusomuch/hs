(function(angular, undefined) {
  angular.module("healthStarsApp.constants", [])

.constant("APP_CONFIG", {
	"userRoles": [
		"user",
		"admin"
	],
	"baseUrl": "http://localhost:9000/",
	"socketUrl": "http://localhost:9000/",
	"baseUrl": "http://localhost:9000/",
	"apiVer": "v1",
	"apiKey": {
		"google": "AIzaSyCdqpWKP40L13Nzi_dt_iNiXYCsZ98Rp38",
		"weather": "94d68bfa4200b08d42fd600cf0e3ca86",
		"fbAppId": "1573466596291608",
		"twAppId": "Qd9Qf8FXDTf6qf2cRtQV8Kss2",
		"ggAppId": "415481653468-jnu548h7uhjeditfm1bqb1hb23fqosoc.apps.googleusercontent.com",
		"hotmailId": "f6f1fb5a-0120-4336-9a00-a0f210e5b125",
		"hotmailCallbackUrl": "http://localhost:9000/profile/"
	}
})

;
})(angular);