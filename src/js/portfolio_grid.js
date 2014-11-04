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

define(["DynaGrid"], function(DynaGrid) {

  // Cell highlighting time (milliseconds)
  var hotTime= 500;
  var direction= false; // True = decreasing; false = increasing; null = no sort

  var portfolioGrid= new DynaGrid("portfolio_grid", true);
  portfolioGrid.setAutoCleanBehavior(true, false);
  portfolioGrid.addListener({
    onVisualUpdate: function(key, info) {
      if (info == null) {

        // Cleaning
        return;
      }

      // visual effects on updates
      info.setHotTime(hotTime);
      info.setStyle("lshot", "lscold");
      info.setCellStyle("command", "commandhot", "commandcold");
    }
  });

  var SPACER = null;
  var UP = "images/up.gif";
  var DOWN = "images/down.gif";

  var gridWrap = {
    getDynaGrid: function() {
      return portfolioGrid;
    },

    updateRow: function(key,data) {
      if (data.command == "DELETE") {
        portfolioGrid.removeRow(key);
      } else {
        portfolioGrid.updateRow(key,data);
      }
    },

    changeSort: function(sortOn) {
      var sortedBy = portfolioGrid.getSortField();
      var arrow = null;

      if (sortOn != sortedBy || direction === null) {
        direction = false;
        arrow = UP;
      } else if (direction === false) {
        direction = true;
        arrow = DOWN;
      } else {
        direction = null;
      }

      if (sortOn != sortedBy || direction === null) {
        var currentImg = $("#img_" + sortedBy);
        var currentCol = $("#col_" + sortedBy);

        currentCol.removeClass("tableTitleSorted");
        currentImg.attr("src",SPACER);
      }

      if (direction !== null) {
        var nextImg = $("#img_" + sortOn);
        var nextCol = $("#col_" + sortOn);

        nextImg.attr("src",arrow);
        nextCol.addClass("tableTitleSorted");

        if (sortOn == "qty") {
          portfolioGrid.setSort(sortOn, direction, true, false);
        } else {
          portfolioGrid.setSort(sortOn, direction);
        }
      } else {
        portfolioGrid.setSort(null);
      }
    }
  };

  $(".button[data-sorting]").click(function() {
    gridWrap.changeSort($(this).data("sorting"));
  });

  return gridWrap;
});