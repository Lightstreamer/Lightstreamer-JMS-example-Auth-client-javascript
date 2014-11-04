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

function submitMessage() {
  var textField= document.getElementById("user_message");
  if (textField) {
    var text= textField.value;
    textField.value= "";

    if (text) {
      var mex= "CHAT|" + text;

      if (_chatQueueSession == null)
        _chatQueueSession= _conn.createSession(false, "AUTO_ACK");

      // Send message to chat queue
      var queue= _chatQueueSession.createQueue("chatQueue");
      var producer= _chatQueueSession.createProducer(queue, null);

      var msg= _chatQueueSession.createTextMessage(mex);
      producer.send(msg);
    }
  }
}

