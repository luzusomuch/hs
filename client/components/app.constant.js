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
		"google": "AIzaSyBhg6JbSzbbB1rC9iqukJdiAXzUOYlpf-4",
		"weather": "d6ce4efe26d8a70511337db70401d39c",
		"fbAppId": "1573466596291608"
	}
})

;
})(angular);