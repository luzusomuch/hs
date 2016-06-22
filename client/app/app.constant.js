(function(angular, undefined) {
  angular.module("healthStarsApp.constants", [])

.constant("APP_CONFIG", {
	"userRoles": [
		"guest",
		"user",
		"admin"
	],
	"baseUrl": "http://localhost:9000/",
	"apiVer": "v1"
})

;
})(angular);