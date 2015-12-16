/**
 * @license MIT http://jseppi.mit-license.org/license.html
*/
(function(window, angular, undefined) {
'use strict';

var dd = angular.module('ngDropdowns', []);

dd.run(['$templateCache', function ($templateCache) {
  $templateCache.put('ngDropdowns/templates/dropdownSelect.html', [
    '<div class="wrap-dd-select">',
      '<div class="selected">{{dropdownModel[labelField]}}</div>',
      '<ul class="dropdown">',
        '<li ng-repeat="item in dropdownSelect"',
        ' class="dropdown-item"',
        ' dropdown-select-item="item"',
        ' dropdown-item-label="labelField">',
        '</li>',
      '</ul>',
    '</div>'
  ].join(''));

  $templateCache.put('ngDropdowns/templates/dropdownSelectItem.html', [
    '<li ng-class="{divider: (dropdownSelectItem.divider && !dropdownSelectItem[dropdownItemLabel]), \'divider-label\': (dropdownSelectItem.divider && dropdownSelectItem[dropdownItemLabel])}">',
      '<a href="" class="dropdown-item"',
      ' ng-if="!dropdownSelectItem.divider"',
      ' ng-href="{{dropdownSelectItem.href}}"',
      ' ng-class="{\'isLimited\': dropdownSelectItem.isLimited, \'isNew\': dropdownSelectItem.isNew }"',
      ' ng-click="selectItem()">',
      ' <div class="dropdown-item-label">{{dropdownSelectItem[dropdownItemLabel]}}</div>',
      ' <div class="dropdown-img-stock">',
      ' <img src-cached="img/stock.png"/>',
      ' </div>',  
      '</a>',
      '<span ng-if="dropdownSelectItem.divider">',
        '{{dropdownSelectItem[dropdownItemLabel]}}',
      '</span>',
    '</li>'
  ].join(''));

  $templateCache.put('ngDropdowns/templates/dropdownMenu.html', [
    '<ul class="dropdown">',
      '<li ng-repeat="item in dropdownMenu"',
      ' class="dropdown-item"',
      ' dropdown-item-label="labelField"',
      ' dropdown-menu-item="item">',
      '</li>',
    '</ul>'
  ].join(''));

  $templateCache.put('ngDropdowns/templates/dropdownMenuItem.html', [
    '<li ng-class="{divider: dropdownMenuItem.divider, \'divider-label\': dropdownMenuItem.divider && dropdownMenuItem[dropdownItemLabel]}">',
      '<a href="" class="dropdown-item"',
      ' ng-if="!dropdownMenuItem.divider"',
      ' ng-href="{{dropdownMenuItem.href}}"',
      ' ng-click="selectItem()">',
        '{{dropdownMenuItem[dropdownItemLabel]}}',
      '</a>',
      '<span ng-if="dropdownMenuItem.divider">',
        '{{dropdownMenuItem[dropdownItemLabel]}}',
      '</span>',
    '</li>'
  ].join(''));

}]);

dd.directive('dropdownSelect', ['DropdownService',
  function (DropdownService) {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        dropdownSelect: '=',
        dropdownModel: '=',
        dropdownOnchange: '&',
        dropdownDisabled: '='
      },

      controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
        $scope.labelField = $attrs.dropdownItemLabel || 'text';

        DropdownService.register($element);

        this.select = function (selected) {
          if (selected !== $scope.dropdownModel) {
            angular.copy(selected, $scope.dropdownModel);
          }
          $scope.dropdownOnchange({
            selected: selected
          });
        };

        $element.bind('click', function (event) {
         event.stopPropagation();
         if(!$scope.dropdownDisabled){
            DropdownService.toggleActive($element);
         }
        });

        $scope.$on('$destroy', function () {
          DropdownService.unregister($element);
        });
      }],
      templateUrl: 'ngDropdowns/templates/dropdownSelect.html' 
    };
  }
]);

dd.directive('dropdownSelectItem', [
  function () {
    return {
      require: '^dropdownSelect',
      replace: true,
      scope: {
        dropdownItemLabel: '=',
        dropdownSelectItem: '='
      },

      link: function (scope, element, attrs, dropdownSelectCtrl) {
        scope.selectItem = function () {
          if (scope.dropdownSelectItem.href) {
            return;
          }
          dropdownSelectCtrl.select(scope.dropdownSelectItem);
        };
      },

      templateUrl: 'ngDropdowns/templates/dropdownSelectItem.html' 
    };
  }
]);

dd.directive('dropdownMenu', ['$parse', '$compile', 'DropdownService', '$templateCache',
  function ($parse, $compile, DropdownService, $templateCache) {
    return {
      restrict: 'A',
      replace: false,
      scope: {
        dropdownMenu: '=',
        dropdownModel: '=',
        dropdownOnchange: '&',
        dropdownDisabled: '='
      },

      controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
        $scope.labelField = $attrs.dropdownItemLabel || 'text';

        var $template = angular.element($templateCache.get('ngDropdowns/templates/dropdownMenu.html'));
        // Attach this controller to the element's data
        $template.data('$dropdownMenuController', this);

        var tpl = $compile($template)($scope);
        var $wrap = angular.element('<div class="wrap-dd-menu"></div>');

        $element.replaceWith($wrap);
        $wrap.append($element);
        $wrap.append(tpl);

        DropdownService.register(tpl);

        this.select = function (selected) {
          if (selected !== $scope.dropdownModel) {
            angular.copy(selected, $scope.dropdownModel);
          }
          $scope.dropdownOnchange({
            selected: selected
          });
        };

        $element.bind('click', function (event) {
          event.stopPropagation();
          if(!$scope.dropdownDisabled){
           DropdownService.toggleActive(tpl);
          }
        });

        $scope.$on('$destroy', function () {
          DropdownService.unregister(tpl);
        });
      }]
    };
  }
]);

dd.directive('dropdownMenuItem', [
  function () {
    return {
      require: '^dropdownMenu',
      replace: true,
      scope: {
        dropdownMenuItem: '=',
        dropdownItemLabel: '='
      },

      link: function (scope, element, attrs, dropdownMenuCtrl) {
        scope.selectItem = function () {
          if (scope.dropdownMenuItem.href) {
            return;
          }
          dropdownMenuCtrl.select(scope.dropdownMenuItem);
        };
      },

      templateUrl: 'ngDropdowns/templates/dropdownMenuItem.html'
    };
  }
]);

dd.factory('DropdownService', ['$document',
  function ($document) {
    var body = $document.find('body'),
        service = {},
        _dropdowns = [];

    body.bind('click', function () {
      angular.forEach(_dropdowns, function (el) {
        el.removeClass('active');
      });
    });

    service.register = function (ddEl) {
      _dropdowns.push(ddEl);
    };

    service.unregister = function (ddEl) {
      var index;
      index = _dropdowns.indexOf(ddEl);
      if (index > -1) {
        _dropdowns.splice(index, 1);
      }
    };

    service.toggleActive = function (ddEl) {
      angular.forEach(_dropdowns, function (el) {
        if (el !== ddEl) {
          el.removeClass('active');
        }
      });

      ddEl.toggleClass('active');
    };

    return service;
  }
]);
})(window, window.angular);