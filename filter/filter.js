define(function (require) {
  // we need to load the css ourselves
  require('css!plugins/filter/filter.css');

  // we also need to load the controller and used by the template
  require('plugins/filter/controllers/filter_controller');
  require('plugins/filter/directives/angucomplete');

  return function (Private) {
    var TemplateVisType = Private(require('plugins/vis_types/template/template_vis_type'));

    // return the visType object, which kibana will use to display and configure new
    // Vis object of this type.
    return new TemplateVisType({
      name: 'filter',
      title: 'Filter widget',
      icon: 'fa-code',
      description: 'Filter widget with choosable fields.',
      template: require('text!plugins/filter/filter.html'),
      params: {
        editor: require('text!plugins/filter/filter_params.html')
      },
      requiresSearch: false
    });
  };
});