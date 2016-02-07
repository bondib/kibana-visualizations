define(function (require) {

  var module = require('modules').get('kibana/filter', ['kibana']);
  module.controller('KbnFilterController', function ($scope, $sce, Private, es, courier, config) {

    // Get Kibana's filter managers api.
    var filterManager = Private(require('components/filter_manager/filter_manager'));
    var queryFilter = Private(require('components/filter_bar/query_filter'));

    init();

    // Init data and params
    function init() {
      if (!$scope.init) {
        $scope.vis.params.resultLimit = $scope.vis.params.resultLimit ? $scope.vis.params.resultLimit : 1000;
        $scope.searchIndex = $scope.searchIndex ? $scope.searchIndex : config.get('defaultIndex');
        $scope.$watch('esResponse', setAutoCompleteOptions);
        buildFieldsArray();
        $scope.init = true;
      }
    }

    // Builds an array of all the possible fields.
    function buildFieldsArray() {
      if (!$scope.data) {
        var fieldsArr = [];
        $scope.data = {};

        courier.indexPatterns.get($scope.searchIndex).then(function(indexPattern) {
          indexPattern.fields.forEach(function(elem, index) {
            // Can filter which fields are optional for filtering(regex maybe).
            fieldsArr.push(elem.displayName);
          });

          if (fieldsArr.length > 0) {
            $scope.data.fieldsArr = fieldsArr.sort();

            if (!$scope.vis.params.filteredField) {
              $scope.vis.params = {};
              $scope.vis.params.filteredField = fieldsArr[0];
            }
          }
        })
      }
    }

    function setAutoCompleteOptions() {
      // Search for all the possible results to complete
      if (($scope.vis.params.filteredField) && ($scope.vis.params.resultLimit)) {
        es.search({
            body: {
              "aggs": {
                "results": {
                  "terms": {
                    "field": $scope.vis.params.filteredField,
                    "size": $scope.vis.params.resultLimit,
                    "order": {
                      "_count": "desc"
                    }
                  }
                }
              }
            }
          }).then(function (res) {
            $scope.results = res.aggregations.results.buckets;
          });
        }
    }

    // Pins a given filter on the app.
    function pinFilter(key, value) {
      var filters = queryFilter.getAppFilters();

      filters.forEach(function(elem) {
        if ((elem.meta.key == key) && (elem.meta.value == value)) {
          queryFilter.pinFilter(elem , true);
        }
      })
    }

    // Creates a new filter by a given value.
    $scope.executeFilter = function() {
      if (($scope.vis.params.filteredField) && ($scope.selectedValue)) {

        filterManager.add($scope.vis.params.filteredField, $scope.selectedValue.title, '+', $scope.searchIndex).then(function() {
          // the filterMananager.add promise finishes before adding the filter to the appfilters list,
          // so I have to use a different event esReponse to pin the filter.
          if ($scope.vis.params.pinFilter) {
            var watchObj = $scope.$watch('esResponse', function() {
              pinFilter($scope.vis.params.filteredField, $scope.selectedValue.title);
              watchObj(); // Removes the watch.
            });
          }
        });
      }
    }
  });
});