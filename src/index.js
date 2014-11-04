/*
  Copyright 2014 Weswit Srl

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// Global JMS connection and sessions
var _conn= null;
var _stocksTopicSession= null;
var _stocksQueueSession= null;
var _portfolioTopicSession= null;
var _portfolioQueueSession= null;
var _chatTopicSession= null;
var _chatQueueSession= null;

// In this example we authenticate via JavaScript by sending an "Ajax" request to a WebServer that will answer
// with a session token (or refusing the request).
// We do not actually deploy the WebServer, we will simulate the authentication on the client (see the js/Authentication.js)

require(["js/Authentication", "js/Constants", "js/stocks_grid", "js/portfolio_grid", "StatusWidget", "ConnectionFactory"],
    function(Authentication, Constants, stocks_grid, portfolio_grid, StatusWidget, ConnectionFactory) {

   var widget= new StatusWidget("left", "0px", true);

   $("#submit_form :submit").click(function(event) {
    // The user wants to authenticate

    // In this case we handle the auth via JS so prevent the form from submitting
    event.preventDefault();

    // Disable the form while we try to authenticate
    $("input").prop('disabled', false);

    //trim input values
    var user= $("#user").val().replace(Constants.TRIM_REGEXP, "$1");
    var password= $("#password").val().replace(Constants.TRIM_REGEXP, "$1");

    // Let's call the webserver to ask for an authentication token
    // in this demo we call a longin.js file that is an empty file
    // and we'll fake the authentication on the client
    $.ajax({
      url: "js/login.js",
      type: "POST",
      data: {
        user: user,
        password: password
      },

      error: function(obj, errorText) {
        jError("Authentication Failed: " + errorText, Constants.J_NOTIFY_OPTIONS_ERR);
      },

      success: function() {

        // We expect the token to be sent by the WebServer,
        // in this case the token "generation" is simulated by the Authentication module.
        // note that while the Authentication module will always return the same token
        // for a certain user, the WebServer would actually generate a different token
        // every time (or at least will refresh it from time to time.
        var token= Authentication.getToken(user, password);

        if (token == null) {
          jError("Authentication Failed: wrong user/password", Constants.J_NOTIFY_OPTIONS_ERR);

        } else {

          // Hide login form, show application
          $("#submit_form").hide();
          $("#stock_list").slideDown();
          $("#portfolio").slideDown();
          $("#chat").slideDown();
          $("#logout").show();

          // Now we can connect to JMS Gateway
          ConnectionFactory.createConnection(Constants.SERVER, Constants.ADAPTER_SET, Constants.DATA_ADAPTER, user, token, {
            onConnectionCreated: function(conn) {
                _conn= conn;

                // Exception listener: JMS exception, as well as exceptions thrown by
                // the Authentication Hook, are sent asynchronously and received by
                // this handler
                _conn.setExceptionListener({
                  onException: function(exception) {
                    if (exception.getErrorCode() == null) {

                        // Common exception, show the error
                        jError("Error: " + exception.getMessage(), Constants.J_NOTIFY_OPTIONS_ERR);

                    } else {

                        // Authorization errors use specific error codes
                        switch (exception.getErrorCode()) {
                            case "STOCKS_ACCESS_NOT_AUTHORIZED":

                                // Close the Stock-List application
                                $("#stock_list").slideUp();
                                break;

                            case "PORTFOLIO_ACCESS_NOT_AUTHORIZED":

                                // Close the Stock-List application
                                $("#portfolio").slideUp();
                                break;

                            case "CHAT_ACCESS_NOT_AUTHORIZED":

                                // Close the Stock-List application
                                $("#chat").slideUp();
                                break;

                            default:

                            // Other error
                            jError("Error: " + exception.getMessage(), Constants.J_NOTIFY_OPTIONS_ERR);
                        }
                    }
                  }
                });

                // Start the connection
                _conn.start();

                // Start the applications
                startStockList();
                startPortfolio();
                startChat();

            }, onConnectionFailed: function(errorCode, errorMessage) {
                jError("Connection to JMS Gateway refused: " + errorCode + " " + errorMessage, Constants.J_NOTIFY_OPTIONS_ERR);

                // Hide login form, show application
                $("#submit_form").show();
                $("#stock_list").slideUp();
                $("#portfolio").slideUp();
                $("#chat").slideUp();
                $("#logout").hide();

            }, onLSClient: function(lsClient) {

                // Enable status widget
                lsClient.addListener(widget);
            }
          });
        }
      },
      complete: function() {
        $("input").prop('disabled', false);
      }
    });
  });

  // Enable the login form
  $("input").prop('disabled', false);

  // Setup the logout button
  $("#logout").click(function() {
    if (_conn != null) {
        _conn.close();
        _conn= null;
    }

    // Clear the grids
    stocks_grid.clean();
    portfolio_grid.getDynaGrid().clean();

    $("#submit_form").show();
    $("#stock_list").slideUp();
    $("#portfolio").slideUp();
    $("#chat").slideUp();
    $("#logout").hide();
  });
});

function startStockList() {
    require(["js/stocks_grid"], function(stocks_grid) {

        // Start the Stock-List application
        _stocksTopicSession= _conn.createSession(false, "PRE_ACK");
        var topic= _stocksTopicSession.createTopic("stocksTopic");
        var consumer= _stocksTopicSession.createConsumer(topic, null);

        // Add listener to message consumer
        consumer.setMessageListener({
          onMessage: function(message) {

            // Message received
            var feedMessage= message.getObject();
            if (!feedMessage.currentValues)
              return;

            var key= feedMessage.itemName;
            var values= feedMessage.currentValues;

            // Update the view with the received data
            stocks_grid.updateRow(key, values);
          }
        });

        // Send messages to Stock-List Demo Service, it will start publishing
        // new values on the stocks topic
        _stocksQueueSession= _conn.createSession(false, "AUTO_ACK");
        var queue= _stocksQueueSession.createQueue("stocksQueue");
        var producer= _stocksQueueSession.createProducer(queue, null);

        var msg= _stocksQueueSession.createTextMessage("subscribeitem2_2");
        producer.send(msg);

        msg= _stocksQueueSession.createTextMessage("subscribeitem13_13");
        producer.send(msg);

        msg= _stocksQueueSession.createTextMessage("subscribeitem17_17");
        producer.send(msg);
    });
}

function startPortfolio() {
    require(["js/Constants", "js/portfolio_grid"], function(Constants, portfolio_grid) {

        // Start the Portfolio application
        _portfolioTopicSession= _conn.createSession(false, "PRE_ACK");
        var topic= _portfolioTopicSession.createTopic("portfolioTopic");
        var consumer= _portfolioTopicSession.createConsumer(topic, null);

        // Let's define the initial sorting column
        portfolio_grid.changeSort("key");

        // Add listener to message consumer
        consumer.setMessageListener({
          onMessage: function(message) {

            // Message received
            var portfolioMessage= message.getObject();

            // Update the grid
            portfolio_grid.updateRow(portfolioMessage.key, portfolioMessage);
          }
        });

        // Send subscription message for portfolio
        _portfolioQueueSession= _conn.createSession(false, "AUTO_ACK");
        var queue= _portfolioQueueSession.createQueue("portfolioQueue");
        var producer= _portfolioQueueSession.createProducer(queue, null);

        var msg= _portfolioQueueSession.createTextMessage("SUBSCRIBE|" + Constants.PORTFOLIO_ID);
        producer.send(msg);
    });
}

function startChat() {

    // Start the chat application
    _chatTopicSession= _conn.createSession(false, "PRE_ACK");
    var topic= _chatTopicSession.createTopic("chatTopic");
    var consumer= _chatTopicSession.createConsumer(topic, null);

    // Add listener to the message consumer
    consumer.setMessageListener({
        onMessage: function(message) {

          // Message received
          var simpleChatMessage= message.getObject();

          // Add the message to the html using jquery
          $("#messages").append(
              $("<div>"). // Create a div per each message
                append($("<span>").text(simpleChatMessage.timestamp).addClass("timestamp")). // Fill it with timestamp
                append(": ").
                append($("<span>").text(simpleChatMessage.message).addClass("message")). // Fill it with the message
                addClass("messageContainer")
              ).scrollTop($("#messages").prop("scrollHeight")); // Move the scrollbar on the bottom
        }
    });
}

