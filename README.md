# Lightstreamer JMS Extender - Authentication and Authorization Demo - HTML Client

The JMS Extender Authentication and Authorization Demo is a simple example illustrating *authentication* and *authorization* mechanisms when an
*external Web/Application Server* is involved in the process.

This project includes a simple web client front-end example for the [Lightstreamer JMS Extender - Authentication and Authorization Demo - Java Hook](https://github.com/Lightstreamer/Lightstreamer-JMS-example-Auth-hook-java).

## Screenshots

![screenshot1](screenshot1.png) ![screenshot2](screenshot2.png) ![screenshot3](screenshot3.png)

## Details

This *Authentication and Authorization Demo* illustrates the typical best practice used for Lightstreamer JMS Extender Web applications, when a Web/Application server is involved in the process.
The actual authentication is usually handled by the legacy Web/Application server, irrespective of Lightstreamer.

From `src/index.js`:

```js
[...]

$.ajax({
  url: "js/login.js",
  type: "POST",
  data: {
    user: user,
    password: password,
  },

[...]
```

Some sort of token is sent back to the Client through cookies, response payload or any other technique.
When the JMS JavaScript Client creates the JMS connection, instead of sending again the full credentials (usually involving a password) to
the JMS Extender, it sends just the username and the token.

From `src/index.js`:

```js
[...]

// Now we can connect to JMS Extender
ConnectionFactory.createConnection(Constants.SERVER, Constants.JMS_CONNECTOR,
    user, token, {
        onConnectionCreated: function(conn) {

[...]
```

The Hook is passed this information and validates the token against the Web/Application Server that
generated it (or a database or whatever back-end system).

Here is an overview of the whole sequence:

![sequence diagram](sequence_diagram.png)

In this demo client the Web/Application server is not actually involved and calls to placeholder methods are performed to obtain and extract the token.

Once the user is authenticated on the JMS Extender as explained above, the client interface opens three different panels: a stock-list panel,
a portfolio panel and a chat panel. Each panel tries to create consumers and producers for different destination. Each time a creation is requested,
the JMS Extender proceeds with the authorization of the request; each one of the username available in the demo is bound to a list of destinations
it is authorized to view. Again the server might use an external service to verify if the received request is a valid one or not:
more details on this are shown in the [Hook project](https://github.com/Lightstreamer/Lightstreamer-JMS-example-Auth-hook-java).


## Install

Before you can run the demo of this project some dependencies need to be solved:

* Note that, as prerequisite, the following projects have to be deployed on your local Lightstreamer JMS Extender instance. Please check out the projects and follow the installation instructions provided with them:
  * [Lightstreamer JMS Extender - Stock-List Demo - Java (JMS) Service](https://github.com/Lightstreamer/Lightstreamer-JMS-example-StockList-service-java)
  * [Lightstreamer JMS Extender - Portfolio Demo - Java (JMS) Service](https://github.com/Lightstreamer/Lightstreamer-JMS-example-Portfolio-service-java)
* Install the [JMS Extender Hook](https://github.com/Lightstreamer/Lightstreamer-JMS-example-Auth-hook-java) required by this project.
* Launch Lightstreamer JMS Extender and the two JMS demo services above.
* Get the `lightstreamer-jms.js` file from the [Lightstreamer JMS Extender](http://download.lightstreamer.com/#jms) and put it in the `src/js` folder of this project.
* [Lightstreamer visual widgets](https://github.com/Lightstreamer/Lightstreamer-lib-client-widgets-javascript), such as the status widget and dynagrid, are hot-linked in the html page: they are in no way mandatory and you may replace them with widgets from any other library by modifying `src/portfolio_grid.js`, `src/stocks_grid.js` and the `onLSClient` event in `src/index.js`.
* RequireJS is currently hot-linked in the html page: you may want to replace it with a local version and/or to upgrade its version.
* jQuery is currently hot-linked in the html page: you may want to replace it with a local version and/or to upgrade its version.

Now, you need to configure the `src/js/Constants.js` of this example by specifying the name of the JMS connector you are going to use.
By default the demo will look for the <b>HornetQ</b> JMS connector, please refer to the related services projects ([Stock-List Demo](https://github.com/Lightstreamer/Lightstreamer-JMS-example-StockList-service-java) and
[Portfolio Demo](https://github.com/Lightstreamer/Lightstreamer-JMS-example-Portfolio-service-java))
for more details on the choice of a JMS broker to be used.

To set the JMS connector name look where the Constants object is returned:

```js
[...]

return {
    SERVER: protocolToUse + "//localhost:8080",
    JMS_CONNECTOR: "HornetQ",

[...]
```

To access the demo from a web browser, copy it somewhere under your webserver root directory. You can also add it to the JMS Extender internal web server pages under `JMSExtenderHome/pages` directory by copying there the `src` folder with a name such as `AuthDemo_JMS`. Subsequently you may access it as: <i>http://_your_jms_extender_http_address_/AuthDemo_JMS/</i>.
Depending on the browser in use, and on the security settings, you might also be able to launch the index.html file directly from the file system.

## See Also

### JMS Extender Hook Needed by This Client

* [Lightstreamer JMS Extender - Authentication and Authorization Demo - Java Hook](https://github.com/Lightstreamer/Lightstreamer-JMS-example-Auth-hook-java)

## JMS Extender Compatibility Notes

* Compatible with Lightstreamer JMS Extender Client library version 1.2 or newer.
* Compatible with Lightstreamer JMS Extender since version 1.5 or newer.
