

//init login controller
angular.module("iwsProjectApp").controller("RegisterController", ["$scope", function($scope){

    //define model
    $scope.model={};

    //define status
    $scope.status = {
        validationErrors : ""
    }

    //function that generates qrcode
    $scope.getqrcode = function(){

        //get the qrcode object
        $.get('/getqrcode', function(res){
            //build the qrcode
            new QRCode(document.getElementById("qrcode"), res.otpauthurl);
            $("#qrcode").removeAttr("title");
        });


    }

    //function that submits data
    $scope.submit = function(){
        var model = $scope.model;

        if($scope.frm.$valid){

            // get the post data
            var postData = {
                "userKey": model.userKey
            };

            // post
            $.ajax({
                url: "/register",
                type: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(postData),

                // success
                success: function (res) {

                    // check if errors
                    if (res.code != 0) {
                        $scope.$apply(function () {
                            $scope.status.validationErrors = res.text;
                        });

                    } else {

                        $scope.$apply(function () {
                            $scope.status.validationErrors = "";
                        });

                        //show alert

                        //call backs

                    }

                    // done

                }
            });
        }else{
            $scope.status.validationErrors = "Please fill in required fields";
        }

    }
}])