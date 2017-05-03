"use strict";

define([
        "dispatcher",
        "controller/TimelineController",
        'controller/InteractiveAreaController'
    ],

    function (dispatcher, TimelineController, InteractiveAreaController) {

        var MovieController;
        var commonAssetsUrl = "http://localhost:3030/assets";
        var vrView;
        var vrReady = false;
        var isPlaying = false;

        // Video Controller
        var VRViewController = {

            init: function (movieController) {
                var self = this;
                MovieController = movieController;
                this.$playPause = $('.play_pause');

                vrView = new VRView.Player('#vrview', {
                    image: 'blank.png',
                    preview: 'blank.png',
                    is_stereo: true,
                    is_autopan_off: true
                }, {
                    assetsUrl: commonAssetsUrl,
                    autoplay: false
                });

                vrView.on('ready', function() {
                    vrReady = true;
                    if(self.onReadyFn) { self.onReadyFn(); }
                });


                vrView.on('enddraw', this._onShapeDrawn.bind(this));
                vrView.on('shapeselected', this._onShapeSelected.bind(this));
                vrView.on('shapeunselected', this._onShapeUnselected.bind(this));
                vrView.on('shapetransformed', this._onShapeTransformed.bind(this));
                vrView.on('timeupdate', this._onVideoTimeUpdate.bind(this));


                dispatcher.on(dispatcher.elementAddedKeyframe, function(e, elementModel, relativeFrame) {
                    var frame = elementModel.getFrame() + relativeFrame;
                    var shape = InteractiveAreaController.getShapeAt(elementModel, frame);
                    vrView.addShapeKeyframe(elementModel.getId(), relativeFrame/1000, { vertices: shape.vertices });
                });

                dispatcher.on(dispatcher.elementRemovedKeyframe, function(e, elementModel, frame) {
                    vrView.removeShapeKeyframe(elementModel.getId(), frame/1000);
                });

                // on color/frame/duration change
                dispatcher.on(dispatcher.elementUpdatedInfo, function(e, elementModel) {

                    vrView.editShape(elementModel.getId(), {
                        background_color: elementModel.getBackground(),
                        background_opacity: elementModel.getBackgroundOpacity(),
                        start_frame: elementModel.getFrame()/1000,
                        end_frame: (elementModel.getFrame() + elementModel.getDuration()) / 1000
                    });

                });

                this.$playPause.on('click', function() {
                    if(!isPlaying) {
                        self.playVideo();
                    } else {
                        self.pauseVideo();
                    }
                });

                /*

                 vrView.on('ready', onVRViewReady);
                 vrView.on('modechange', onModeChange);
                 vrView.on('click', onHotspotClick);
                 vrView.on('error', onVRViewError);
                 vrView.on('getposition', onGetPosition);
                 vrView.on('enddraw', onShapeDrawn);
                 vrView.on('shapetransformed', onShapeTransformed);
                 vrView.on('shapeselected', onShapeSelected);
                 vrView.on('shapeunselected', onShapeUnselected);*/

            },

            _onShapeDrawn: function(shape) {

                var currentFrame = TimelineController.getCurrentFrame();

                // create model
                var elementModel = InteractiveAreaController.createFromShape(shape, currentFrame);

                // set zindex (
                var sceneElements = MovieController.getElements();
                var maxZindex = Math.max.apply(Math, sceneElements.map(function(o){ return o.getZindex(); })) || 0;
                elementModel.setZindex(maxZindex + 1);

                // add element to current scene model
                MovieController.addElement(elementModel);

                // add element to timeline
                TimelineController.addElement(elementModel);

                // update shape with timeline info
                vrView.editShape(elementModel.getId(), {
                    background_color: elementModel.getBackground(),
                    background_opacity: elementModel.getBackgroundOpacity(),
                    start_frame: elementModel.getFrame()/1000,
                    end_frame: (elementModel.getFrame() + elementModel.getDuration()) / 1000
                });

            },

            _onShapeSelected: function(shape) {

                var scene = MovieController.getCurrentScene();
                var element = scene.getElement(shape.id);
                dispatcher.trigger(dispatcher.elementSelected, element);

            },

            _onShapeUnselected: function() {
                dispatcher.trigger(dispatcher.elementsDeselected);
            },

            _onShapeTransformed: function(shape) {
                var scene = MovieController.getCurrentScene();
                var element = scene.getElement(shape.id);

                var keyframe = InteractiveAreaController.updateAt(element, TimelineController.getCurrentFrame(), shape.vertices);

                dispatcher.trigger(dispatcher.elementUpdated, element);

                vrView.editShapeKeyframe(shape.id, keyframe, { vertices: shape.vertices });

                console.log('shape transformed', shape)

            },

            _onVideoTimeUpdate: function(data) {
                if(!TimelineController.isDragging()) {
                    console.log(data)
                    TimelineController.updateTrack(data.currentTime);
                }
            },

            onReady: function(fn) {
                this.onReadyFn = fn;
            },

            playVideo: function(){
                if(vrView && !isPlaying) {
                    vrView.play();
                    isPlaying = true;
                    this.$playPause.find('> *').removeClass('fi-play').addClass('fi-pause')
                }
            },

            pauseVideo: function() {
                if(vrView && isPlaying) {
                    vrView.pause();
                    isPlaying = false;
                    this.$playPause.find('> *').removeClass('fi-pause').addClass('fi-play')
                }
            },

            loadScene: function(sceneModel) {

                if(!vrReady) {
                    return this.onReady(function() { this.loadScene(sceneModel) });
                }

                if(!vrView || !vrReady) {
                    console.warn('vrView not initialized yet!');
                    return;
                }

                this.pauseVideo();

                var sceneParams = {
                    assetsUrl: commonAssetsUrl,
                    video: false,
                    preview: 'blank.png',
                    is_stereo: false,
                    is_autopan_off: true
                };

                if(sceneModel.getVideo()) {
                    // TODO unload current vr content
                    sceneParams.video = commonAssetsUrl + '/video/' + sceneModel.getVideo();
                    // TODO sceneParams.preview = ..get saved video frame png;
                } else {
                    sceneParams.image = 'blank.png';
                }

                // to add: is_stereo support, image support, preview image support

                vrView.setContent(sceneParams);

                // add shapes
                var shapes = sceneModel.getElements();
                var initialShapeVertices;
                for(var i = 0; i < shapes.length; i++) {
                    initialShapeVertices = shapes[i].getKeyframes();

                    var j = 0;
                    for(var keyframe in initialShapeVertices) {

                        if(j === 0) {

                            vrView.addShape(shapes[i].getId(), initialShapeVertices[keyframe]);
                            vrView.editShape(shapes[i].getId(), {
                                background_color: shapes[i].getBackground(),
                                background_opacity: shapes[i].getBackgroundOpacity(),
                                start_frame: shapes[i].getFrame()/1000,
                                end_frame: (shapes[i].getFrame() + shapes[i].getDuration()) / 1000
                            });

                        } else {
                            vrView.addShapeKeyframe(shapes[i].getId(), keyframe/1000, initialShapeVertices[keyframe]);
                        }

                        j++;
                    }
                }

                vrView.setCurrentTime(0.01);
                vrView.setCurrentTime(0);

            },

            seek: function(frame) {
                if(vrView && vrReady) { // TODO check if scene has video or prevent timeline track drag!
                    vrView.setCurrentTime(frame/1000); // ms to seconds
                }
            },

            activateShapeTool: function() {
                vrView.activateShapeTool();
            },

            deactivateShapeTool: function() {
                vrView.deactivateShapeTool();
            },

            addShape: function(id, shapeInfo) {
                vrView.addShape(id, shapeInfo);

            },

            addShapeKeyframe: function(id, frame, vertices) {
                vrView.addShape(id, frame, vertices);
            },

            removeShape: function(id) {
                vrView.removeShape(id);
            }


        };


        return VRViewController;

    });