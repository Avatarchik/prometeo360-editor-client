/**
 * App startup
 */
requirejs.config({
    "baseUrl": "http://prometeo.duesottozero.com",
    "paths": {
        "app": "js/app",
        "lib": "js/libs",
        "config": "js/app/editor/config",
        "router": "js/app/editor/router",
        "api": "js/app/editor/api",
        "dispatcher": "js/app/editor/dispatcher",
        //"socket": "js/app/editor/socket",
        "model": "js/app/models",
        "controller": "js/app/editor/controllers",
        "view": "js/app/editor/views",
        "navigo": "js/libs/navigo",
        "bootstrap" : "js/libs/bootstrap.min",
        "jquery": "js/libs/jquery.min",
        "jqueryui" : "js/libs/jquery-ui/ui",
        "pnotify" : "js/libs/pnotify/pnotify.custom.min",
        "handlebars" : "js/libs/hbs/handlebars.min",
        "text" : "js/libs/hbs/text",
        "plupload": "js/libs/plupload/plupload.full.min",
        // "diff" : "js/libs/jsondiffpatch",
        "colorpicker" : "js/libs/colorpicker/minicolors.min"
    },
    "hbs": {
        templateExtension: ".hbs",
        compilerPath: "js/libs/hbs/handlebars.min"
    },
    "shim": {
        "bootstrap" : {
            deps: ['jquery', 'navigo', 'colorpicker']
        },
        handlebars: {
            exports: 'Handlebars'
        },
        plupload: {
            exports: "plupload"
        }
    },
    "packages": [
        {
            name: 'hbs',
            location: 'js/libs/hbs',
            main: 'hbs'
        }
    ]
});

// Load the main app module to start the app
requirejs([
    "bootstrap",
    "js/app/editor/_main"
]);
