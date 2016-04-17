/**
 * Created by NagarjunaYendluri on 4/11/16.
 */

//init login controller
angular.module("iwsProjectApp", []).controller("LoginController", ["$scope", function($scope){

    //initialize visual captcha
    var captcha = visualCaptcha( 'sample-captcha', {
        imgPath: 'img/',
        captcha: {
            numberOfImages: 5,
            callbacks: {
                loaded: function( captcha ) {
                    // This is to avoid adding the hashtag to the URL when clicking/selecting visualCaptcha options
                    var anchorOptions = document.getElementById( 'sample-captcha' ).getElementsByTagName( 'a' );
                    var anchorList = Array.prototype.slice.call( anchorOptions );// .getElementsByTagName does not return an actual array
                    anchorList.forEach( function( anchorItem ) {
                        _bindClick( anchorItem, function( event ) {
                            event.preventDefault();
                        });
                    });
                }
            }
        }
    } );
    //define model
    $scope.model={};

    //define status
    $scope.status = {
        validationErrors : ""
    }

    //function that handles submit
    $scope.submit = function(){

        //get model
        var model = $scope.model;

        // set status
        $scope.status.validationErrors = "";

        // check if valid
        if ( captcha.getCaptchaData().valid ) {

            if($scope.frm.$valid){
                // get the post data
                var postData = {
                    "userName":model.userName,
                    "userPass": model.password,
                    "userKey": model.userKey
                };
                //set captcha details
                 postData[captcha.getCaptchaData().name] = captcha.getCaptchaData().value;
    
                // post
                $.ajax({
                    url: "/login",
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
    
                            //show alert
                            $scope.$apply(function () {
                                //reset fields after register
                                $scope.model.userName = "";
                                $scope.model.password = "";
                                $scope.model.userKey = "";
                                
                                bootbox.alert("User logged in Successfully");
                            });
    
    
    
    
                        }
    
                        // done
                        captcha.refresh();
    
                    }
                });
            }else{
                $scope.status.validationErrors = "Please fill in all the fields";
            }
        }else{
            $scope.status.validationErrors = "Please select captcha";
        }
    }



        // Binds an element to callback on click
        // @param element object like document.getElementById() (has to be a single element)
        // @param callback function to run when the element is clicked
        var _bindClick = function( element, callback ) {
            if ( element.addEventListener ) {
                element.addEventListener( 'click', callback, false );
            } else {
                element.attachEvent( 'onclick', callback );
            }
        };






}]);
