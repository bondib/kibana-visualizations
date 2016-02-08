define(function (require) {
    // we need to load the css ourselves
    require('css!plugins/property_filter/property_filter.css');

    // we also need to load the controller and used by the template
    require('plugins/property_filter/controllers/property_filter_controller');
    require('plugins/property_filter/directives/angucomplete');

    return function (Private) {
        var TemplateVisType = Private(require('plugins/vis_types/template/template_vis_type'));

        // return the visType object, which kibana will use to display and configure new
        // Vis object of this type.
        return new TemplateVisType({
            name: 'property-filter',
            title: 'Property Filter Widget',
            icon: 'fa-code',
            description: 'Filter widget with choosable fields.',
            template: require('text!plugins/property_filter/property_filter.html'),
            params: {
                editor: require('text!plugins/property_filter/property_filter_params.html')
            },
            requiresSearch: false
        });
    };
});