define(function (require) {

    var module = require('modules').get('kibana/filter', ['kibana']);
    module.controller('KbnFilterController', ['$scope', '$sce', '$q', 'Private', 'es', 'courier', 'config', function ($scope, $sce, $q, Private, es, courier, config) {

        // Get Kibana's filter managers api.
        var filterManager = Private(require('components/filter_manager/filter_manager'));
        var queryFilter = Private(require('components/filter_bar/query_filter'));

        var SearchSource = Private(require('components/courier/data_source/search_source'));
        var CallClient = Private(require('components/courier/fetch/_call_client'));
        var searchStrategy = Private(require('components/courier/fetch/strategy/search'));

        (function init() {
            if ($scope.initialized)
                return;

            $scope.initialized = true;
            $scope.vis.params.resultLimit = $scope.vis.params.resultLimit ? $scope.vis.params.resultLimit : config.get('discover:sampleSize');
            $scope.searchIndex = $scope.searchIndex ? $scope.searchIndex : config.get('defaultIndex');
            buildFieldsArray();
        })();

        // Builds an array of all the possible fields.
        function buildFieldsArray() {
            var fieldsArr = [];
            $scope.data = {};
            courier.indexPatterns.get($scope.searchIndex).then(function(indexPattern) {
                indexPattern.fields.forEach(function(elem) {
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
            });
        }

        function setAutoCompleteOptions() {
            // Search for all the possible results to complete
            if (!$scope.vis.params.filteredField)
                return $q.when();

            var autoCompleteSearch = new SearchSource();
            autoCompleteSearch
                .size(0)
                .aggs({
                    "results": {
                        "terms": {
                            "field": $scope.vis.params.filteredField,
                            "size": $scope.vis.params.resultLimit,
                            "order": {
                                "_count": "desc"
                            }
                        }
                    }
                });

            var autoCompleteRequest = autoCompleteSearch._createRequest();
            return CallClient(searchStrategy, [autoCompleteRequest]).then(function(results) {
                return results[0].aggregations.results.buckets;
            });
        }
        $scope.getAutoCompleteResults = setAutoCompleteOptions;

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
            if ($scope.vis.params.filteredField && $scope.selectedValue) {
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
        };
    }]);
});