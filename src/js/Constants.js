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

define(function() {
  var protocolToUse = document.location.protocol != "file:" ? document.location.protocol : "http:";

  return {
    SERVER: protocolToUse + "//localhost:8080",
    ADAPTER_SET: "JMS",
    DATA_ADAPTER: "HornetQ",
    PORTFOLIO_ID: "portfolio1",
    J_NOTIFY_OPTIONS_ERR: {
      autoHide : true, // added in v2.0
      TimeShown : 3000,
      clickOverlay: true,
      HorizontalPosition : 'center',
      VerticalPosition: 'center'
    },
    J_NOTIFY_OPTIONS_OK: {
      autoHide : true, // added in v2.0
      TimeShown : 500,
      clickOverlay: true,
      HorizontalPosition : 'center',
      VerticalPosition: 'center'
    },
    TRIM_REGEXP: new RegExp("^\\s*([\\s\\S]*?)\\s*$")
  };
});