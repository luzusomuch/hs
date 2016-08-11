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
		"google": "AIzaSyCLpMBiJ3YEMigY0dRLHlS3oH85vRdwXLQ",
		"weather": "d6ce4efe26d8a70511337db70401d39c",
		"fbAppId": "1573466596291608",
		"twAppId": "Qd9Qf8FXDTf6qf2cRtQV8Kss2",
		"ggAppId": "825525519990-0uf8b2cs1i4alptais0nk53pmajpdtnr.apps.googleusercontent.com"
	}
})

;
})(angular);