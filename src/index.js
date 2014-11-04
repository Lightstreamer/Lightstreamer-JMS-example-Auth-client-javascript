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

// In this example we authenticate via JavaScript by sending an "Ajax" request to a WebServer that will answer
// with a session token (or refusing the request).
// We do not actually deploy the WebServer, we will simulate the authentication on the client (see the js/Authentication.js)

require(["js/Authentication", "js/Constants", "js/stocks_grid", "js/portfolio_grid", "StatusWidget", "ConnectionFactory"],
    function(Authentication, Constants, stocks_grid, portfolio_grid, StatusWidget, ConnectionFactory) {

   var widget= new StatusWidget("left", "0px", true);
   var connection= null;

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
                connection= conn;

                // Exception listener: JMS exception, as well as exceptions thrown by
                // the Authentication Hook, are sent asynchronously and received by
                // this handler
                conn.setExceptionListener({
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
                                break;
                        }
                    }
                  }
                });

                // Start the connection
                conn.start();

                // Start the applications
                startStockList(conn);
                startPortfolio(conn);
                startChat(conn);

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
    if (connection != null) {

        // Close the connection
        connection.close();
        connection= null;
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

function startStockList(conn) {
    require(["js/stocks_grid"], function(stocks_grid) {

        // Start the Stock-List application
        var topicSession= conn.createSession(false, "PRE_ACK");
        var topic= topicSession.createTopic("stocksTopic");
        var consumer= topicSession.createConsumer(topic, null);

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
    });
}

function startPortfolio(conn) {
    require(["js/Constants", "js/portfolio_grid"], function(Constants, portfolio_grid) {

        // This listener will be used to reroute updates from
        // the JMS consumers to the UI
        var messageListener= {
          onMessage: function(message) {
            var portfolioMessage= message.getObject();
            portfolio_grid.updateRow(portfolioMessage.key,portfolioMessage);
          }
        };

        // Start the Portfolio application
        var session= conn.createSession(false, "PRE_ACK");
        var queue= session.createQueue("portfolioQueue");
        var producer= session.createProducer(queue, null);

        // Create the topic, updates to the portfolio status will be received here
        var topic= session.createTopic("portfolioTopic");
        var consumer= session.createConsumer(topic, null);
        consumer.setMessageListener(messageListener);

        // We'll ask the service about the current status of the portfolio,
        // the answer will arrive on this temporary queue
        session.createTemporaryQueue(function(tempQueue) {

            // Temp queue ready, attach a listener
            var responseConsumer= session.createConsumer(tempQueue);
            responseConsumer.setMessageListener(messageListener);

            // Create the request
            var statusRequest= session.createMapMessage();
            statusRequest.setObject("request", "GET_PORTFOLIO_STATUS");
            statusRequest.setObject("portfolio", Constants.PORTFOLIO_ID);

            // Set the reply to field to the temp queue created above, so the service know where to answer
            statusRequest.setJMSReplyTo(tempQueue);

            // We might use a correlation id to match request/response:
            //   var correlationId= new Date().getTime() + "" + Math.round(Math.random()*1000);
            //   statusRequest.setJMSCorrelationID(correlationId);
            producer.send(statusRequest);
        });

        // Fill the select with some stocks that can be bought/sold
        var AVAIL_STOCKS= 31;
        for (var i= 1; i <= AVAIL_STOCKS; i++) {
            var item= "item"+i;
            $("#stockN").append($("<option />").val(item).text(item));
        }

        // Attach the handler to the buy/sell buttons
        var buySell= function(event) {
            event.preventDefault();

            var qty= Number($("#qtyN").val());
            if (!qty || qty < 0) {
                alert("Please fill the 'quantity' field with a positive number.");
                return;
            }

            var buyRequest= session.createMapMessage();
            buyRequest.setObject("request", $(this).val().toUpperCase());
            buyRequest.setObject("portfolio", Constants.PORTFOLIO_ID);
            buyRequest.setObject("stock", $("#stockN").val());
            buyRequest.setObject("quantity",qty);
            producer.send(buyRequest);
        }

        $("#buy").click(buySell);
        $("#sell").click(buySell);

        // Enable form
        $("input").prop('disabled', false);
    });
}

function startChat(conn) {

    // Start the chat application
    var topicSession= conn.createSession(false, "PRE_ACK");
    var topic= topicSession.createTopic("chatTopic");
    var consumer= topicSession.createConsumer(topic, null);
    var producer= topicSession.createProducer(topic, null);

    // Add listener to the message consumer
    consumer.setMessageListener({
        onMessage: function(message) {

          // Message received
          $("#messages").append($("<div>").text(message.getText()).addClass("messageContainer")) // Append the message
            .scrollTop($("#messages").prop("scrollHeight")); // Move the scrollbar on the bottom
        }
    });

    // Attach the handler to the send button
    var send= function(event) {
        event.preventDefault();

        // Get value from form and send to JMS topic
        var text= $("#user_message").val();
        $("#user_message").val("");
        var message= topicSession.createTextMessage(text);
        producer.send(message);
    }

    $("#chatForm").submit(send);

    // Enable form
    $("input").prop('disabled', false);
}

