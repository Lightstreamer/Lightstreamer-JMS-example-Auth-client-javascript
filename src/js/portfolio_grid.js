/*
  Copyright (c) Lightstreamer Srl

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

// Cell highlighting time (milliseconds)
const hotTime = 500;
var direction = false; // True = decreasing; false = increasing; null = no sort

var grid = new DynaGrid("portfolio_grid", true);
grid.setAutoCleanBehavior(true, false);
grid.addListener({
  onVisualUpdate: function (key, info) {
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

const SPACER = null;
const UP = "images/up.gif";
const DOWN = "images/down.gif";

const portfolioGrid = {
  getDynaGrid: function () {
    return grid;
  },

  updateRow: function (key, data) {
    if (data.qty == "0") {
      grid.removeRow(key);
    } else {
      grid.updateRow(key, data);
    }
  },

  changeSort: function (sortOn) {
    const sortedBy = grid.getSortField();
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
      currentImg.attr("src", SPACER);
    }

    if (direction !== null) {
      var nextImg = $("#img_" + sortOn);
      var nextCol = $("#col_" + sortOn);

      nextImg.attr("src", arrow);
      nextCol.addClass("tableTitleSorted");

      if (sortOn == "qty") {
        grid.setSort(sortOn, direction, true, false);
      } else {
        grid.setSort(sortOn, direction);
      }
    } else {
      grid.setSort(null);
    }
  }
};

$(".button[data-sorting]").click(function () {
  portfolioGrid.changeSort($(this).data("sorting"));
});

export default portfolioGrid;
